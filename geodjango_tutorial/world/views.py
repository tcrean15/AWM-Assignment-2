from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Game, GamePlayer, GameHint
from .serializers import GameSerializer, GameHintSerializer
from django.contrib.gis.geos import Polygon, Point
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.generic import ListView, DetailView
from rest_framework import viewsets
from rest_framework.decorators import action
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework.authtoken.models import Token
import random
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def index(request):
    """Main map view"""
    return render(request, 'world/index.html')

def get_notes(request):
    notes = LocationNote.objects.all().select_related('user')
    notes_data = []
    
    for note in notes:
        note_data = {
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'latitude': note.location.y,
            'longitude': note.location.x,
            'author': note.user.username,
            'created_at': note.created_at.strftime('%Y-%m-%d %H:%M'),
            'user': {
                'id': note.user.id,
                'username': note.user.username
            },
            'is_owner': note.user == request.user,
            'comments': [{
                'id': comment.id,
                'content': comment.content,
                'author': comment.user.username,
                'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M'),
                'is_owner': comment.user == request.user
            } for comment in note.comments.all()]
        }
        notes_data.append(note_data)
    
    return JsonResponse({'notes': notes_data})

def update_location(request):
    if request.method == 'POST':
        try:
            latitude = float(request.POST.get('latitude'))
            longitude = float(request.POST.get('longitude'))
            accuracy = float(request.POST.get('accuracy', 100))
            
            from .models import set_user_location
            profile = set_user_location(
                request.user.id,
                latitude,
                longitude,
                accuracy
            )
            return JsonResponse({
                'success': True,
                'message': 'Location updated successfully'
            })
        except (ValueError, TypeError) as e:
            return JsonResponse({
                'success': False,
                'message': 'Invalid coordinates provided'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method'
    }, status=405)

class GameListCreate(generics.ListCreateAPIView):
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Game.objects.all()

    def create(self, request, *args, **kwargs):
        try:
            # Create a default game area (Dublin area)
            default_area = Polygon((
                (53.3498, -6.2603),
                (53.3498, -6.2403),
                (53.3298, -6.2403),
                (53.3298, -6.2603),
                (53.3498, -6.2603)
            ))
            
            # Create the game
            game = Game.objects.create(
                host=request.user,
                start_area=default_area,
                current_area=default_area,
                status='WAITING'
            )
            
            # Create a GamePlayer entry for the host
            GamePlayer.objects.create(
                game=game,
                user=request.user,
                team=0
            )
            
            serializer = self.get_serializer(game)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating game: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GameDetail(generics.RetrieveAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = []  # Allow any access for testing

class JoinGame(generics.GenericAPIView):
    permission_classes = []  # Allow any access for testing

    def post(self, request, pk):
        try:
            game = Game.objects.get(pk=pk)
            player = GamePlayer.objects.create(
                game=game,
                team=game.players.count() % 2  # Alternate teams
            )
            return Response({
                'status': 'joined',
                'game': GameSerializer(game).data
            })
        except Game.DoesNotExist:
            return Response(
                {'error': 'Game not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpdateLocation(APIView):
    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        player = get_object_or_404(GamePlayer, game=game, user=request.user)
        player.update_location(request.data['latitude'], request.data['longitude'])
        return Response({'status': 'updated'}, status=status.HTTP_200_OK)

class CreateHint(APIView):
    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        if game.selected_player != request.user:
            return Response({'error': 'Only selected player can create hints'}, 
                          status=status.HTTP_403_FORBIDDEN)
        serializer = GameHintSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(game=game)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SelectPlayer(APIView):
    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        if game.host != request.user:
            return Response({'error': 'Only host can select player'}, 
                          status=status.HTTP_403_FORBIDDEN)
        player = get_object_or_404(GamePlayer, id=request.data['player_id'])
        game.selected_player = player.user
        game.save()
        return Response({'status': 'selected'}, status=status.HTTP_200_OK)

class StartGame(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            game = Game.objects.get(pk=pk)
            
            # Check if user is host
            if game.host != request.user:
                return Response({'error': 'Only the host can start the game'}, status=403)
            
            # Check if area has been set
            if not game.area_set:
                return Response({'error': 'Game area must be set before starting'}, status=400)

            # Check minimum players
            if game.players.count() < 3:
                return Response({'error': 'Need at least 3 players to start'}, status=400)
            
            # Assign teams and hunted player
            game.assign_teams_and_hunted()
            
            # Update game status
            game.status = 'ACTIVE'
            game.save()

            # Return updated game data
            serializer = GameSerializer(game)
            return Response(serializer.data)

        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

class CreateGame(generics.CreateAPIView):
    serializer_class = GameSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            # Create a default game area (Europe)
            default_area = Polygon.from_bbox((-10.0, 35.0, 40.0, 70.0))
            
            # Create the game
            game = Game.objects.create(
                host=request.user if request.user.is_authenticated else None,
                start_area=default_area,
                current_area=default_area,
                status='WAITING',
                radius=500  # Add default radius
            )
            
            # Add the creator as a player if they're authenticated
            if request.user.is_authenticated:
                GamePlayer.objects.create(
                    game=game,
                    user=request.user
                )
            
            serializer = self.get_serializer(game)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GameListView(ListView):
    model = Game
    template_name = 'world/game_list.html'
    context_object_name = 'games'

    def get_queryset(self):
        return Game.objects.all().order_by('-created_at')

class GameDetailView(DetailView):
    model = Game
    template_name = 'world/game_detail.html'
    context_object_name = 'game'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['players'] = self.object.players.all()
        return context

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            # Create a default game area (Europe)
            default_area = Polygon.from_bbox((-10.0, 35.0, 40.0, 70.0))
            
            # Create the game
            game = Game.objects.create(
                host=request.user if request.user.is_authenticated else None,
                start_area=default_area,
                current_area=default_area,
                status='WAITING'
            )
            
            # Add the creator as a player if they're authenticated
            if request.user.is_authenticated:
                GamePlayer.objects.create(
                    game=game,
                    user=request.user
                )
            
            serializer = self.get_serializer(game)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        game = self.get_object()
        if game.status != 'WAITING':
            return Response(
                {'error': 'Cannot join game in current state'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        GamePlayer.objects.create(
            game=game,
            user=request.user
        )
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        game = self.get_object()
        if game.host != request.user:
            return Response(
                {'error': 'Only host can start the game'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if game.players.count() < 2:
            return Response(
                {'error': 'Need at least 2 players to start'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        game.status = 'active'
        game.save()
        return Response({'status': 'started'}, status=status.HTTP_200_OK)

class GameHintViewSet(viewsets.ModelViewSet):
    queryset = GameHint.objects.all()
    serializer_class = GameHintSerializer
    
    def perform_create(self, serializer):
        serializer.save(game_id=self.kwargs['game_pk'])

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username
            }
        })
    return Response({
        'error': 'Invalid credentials'
    }, status=401)

@api_view(['GET'])
def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'success': True})

@api_view(['POST'])
def register_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)
    
    user = User.objects.create_user(username=username, password=password)
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username
        }
    })

@api_view(['GET'])
def current_user(request):
    print("Current user session:", request.session.session_key)
    print("Current user auth:", request.user.is_authenticated)
    print("Current user:", request.user)
    
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username
        })
    return Response({'error': 'Not authenticated'}, status=401)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_game(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        
        # Check if user is already in the game
        if GamePlayer.objects.filter(game=game, user=request.user).exists():
            return Response({'error': 'Already joined this game'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new player entry
        GamePlayer.objects.create(
            game=game,
            user=request.user,
            team=1  # You might want to implement team assignment logic
        )
        
        return Response({'success': True})
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_game(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        
        # Check if user is host
        if game.host != request.user:
            return Response(
                {'error': 'Only the host can end the game'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Update game status or delete game
        game.status = 'FINISHED'  # Or you could delete the game with game.delete()
        game.save()
        
        return Response({'message': 'Game ended successfully'})
        
    except Game.DoesNotExist:
        return Response(
            {'error': 'Game not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_game_area(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        
        if game.host != request.user:
            return Response(
                {'error': 'Only the host can update the game area'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        lat = float(request.data.get('latitude'))
        lng = float(request.data.get('longitude'))
        radius = float(request.data.get('radius', 500))
        
        # Store the original radius in meters
        game.radius = radius
        
        # Create center point (longitude, latitude order for PostGIS)
        center_point = Point(lng, lat, srid=4326)
        
        # Debug logging
        print(f"Creating game area with center: lat={lat}, lng={lng}")
        print(f"Radius: {radius} meters")
        
        # Convert radius from meters to degrees
        degree_radius = radius / 111000
        
        # Create the circular buffer
        game.start_area = center_point.buffer(degree_radius)
        game.current_area = game.start_area
        game.area_set = True
        game.save()
        
        # Return the center point and radius in the response
        return Response({
            'message': 'Game area updated successfully',
            'center': [lat, lng],  # Return as [latitude, longitude]
            'radius': radius
        })
        
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)
    except (ValueError, KeyError) as e:
        return Response({'error': f'Invalid data: {str(e)}'}, status=400)
