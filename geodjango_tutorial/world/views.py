from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Game, GamePlayer, GameHint, ChatMessage
from .serializers import GameSerializer, GameHintSerializer, ChatMessageSerializer
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
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import ValidationError
from decimal import Decimal

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

    def perform_create(self, serializer):
        try:
            data = self.request.data
            print("Received data:", data)  # Debug log

            # Extract coordinates
            center_data = data.get('center', {})
            coordinates = center_data.get('coordinates', [])
            
            if not coordinates or len(coordinates) != 2:
                raise ValidationError('Invalid coordinates')
            
            # Create the game
            game = serializer.save(
                host=self.request.user,
                status='WAITING',
                area_set=True,
                center=Point(coordinates[0], coordinates[1]),  # longitude, latitude
                radius=data.get('radius', 500),
                kitty_value_per_player=data.get('kitty_value_per_player', 10),
                start_area=Point(coordinates[0], coordinates[1]).buffer(data.get('radius', 500) / 111000)
            )

            # Add host as first player and calculate initial kitty
            game.add_player(self.request.user)
            return game

        except Exception as e:
            print(f"Error creating game: {str(e)}")  # Debug log
            raise ValidationError(str(e))

class GameDetail(generics.RetrieveUpdateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        game = self.get_object()
        
        # Only host can update the game
        if game.host != request.user:
            return Response(
                {'error': 'Only the host can update the game'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Update the game settings
        try:
            data = request.data
            center_data = data.get('center', {})
            coordinates = center_data.get('coordinates', [])
            
            if coordinates:
                game.center = Point(coordinates[0], coordinates[1])
            
            if 'radius' in data:
                game.radius = data['radius']
            
            if 'kitty_value_per_player' in data:
                game.kitty_value_per_player = data['kitty_value_per_player']
                game.calculate_total_kitty()  # Recalculate total kitty
            
            game.save()
            return Response(GameSerializer(game).data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        print(f"User making request: {self.request.user}")
        return Game.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        print("Game data being sent:", serializer.data)  # Debug log
        return Response(serializer.data)

class JoinGame(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, pk):
        try:
            game = Game.objects.get(pk=pk)
            print(f"User {request.user.username} attempting to join game {pk}")  # Debug log
            
            # Check if user is already in the game
            if GamePlayer.objects.filter(game=game, user=request.user).exists():
                return Response(
                    {'error': 'User already in game'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create new player with the authenticated user
            player = GamePlayer.objects.create(
                game=game,
                user=request.user,
                team=game.players.count() % 2 + 1  # Teams are 1 or 2
            )
            print(f"Created player: {player}")  # Debug log
            
            # Get updated game data
            game.refresh_from_db()
            serializer = GameSerializer(game)
            
            return Response({
                'status': 'joined',
                'game': serializer.data
            })
        except Game.DoesNotExist:
            return Response(
                {'error': 'Game not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error joining game: {str(e)}")  # Debug log
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
            
            # Add debug logging
            print(f"Starting game {pk}")
            print(f"Area set: {game.area_set}")
            print(f"Player count: {game.players.count()}")
            
            # Check if user is host
            if game.host != request.user:
                return Response({'error': 'Only the host can start the game'}, status=403)
            
            # Check if area has been set
            if not game.area_set:
                return Response({'error': 'Game area must be set before starting'}, status=400)

            # Check minimum players
            if game.players.count() < 3:  # Changed back to 3 players minimum
                return Response({'error': 'Need at least 3 players to start'}, status=400)
            
            # Assign teams first, then update status
            print("Calling assign_teams_and_hunted()")  # Debug print
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
@permission_classes([AllowAny])
def login_view(request):
    print("Login attempt with data:", request.data)  # Debug log
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Please provide both username and password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    print("Authenticated user:", user)  # Debug log
    
    if not user:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get or create token
    token, _ = Token.objects.get_or_create(user=user)
    print("Generated token:", token.key)  # Debug log
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username
        }
    })

@api_view(['GET'])
def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # Delete the user's token
        Token.objects.filter(user=request.user).delete()
        
        return Response({
            "message": "Successfully logged out"
        })
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    print("Registration attempt with data:", request.data)  # Debug log
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Please provide both username and password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({
            'error': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(username=username, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        print(f"Created user {username} with token {token.key}")  # Debug log
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username
            }
        })
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Debug log
        return Response({
            'error': 'Registration failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        if game.status != 'WAITING':
            return Response({'error': 'Game has already started'}, status=400)
        
        # Check if player is already in the game
        if not GamePlayer.objects.filter(game=game, user=request.user).exists():
            # Add player and recalculate kitty
            game.add_player(request.user)
            
            # Force refresh from database and recalculate
            game.refresh_from_db()
            game.calculate_total_kitty()  # Force recalculation
            
            print(f"Game {game.id} now has {game.players.count()} players")  # Debug log
            print(f"Kitty per player: €{game.kitty_value_per_player}")  # Debug log
            print(f"Total kitty: €{game.total_kitty}")  # Debug log
        
        return Response(GameSerializer(game).data)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_game(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        
        # Check if user is the host
        if game.host != request.user:
            return Response(
                {"error": "Only the host can end the game"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # End the game
        game.status = 'FINISHED'
        game.save()
        
        return Response({
            "message": "Game ended successfully",
            "game_status": game.status
        })
        
    except Game.DoesNotExist:
        return Response(
            {"error": "Game not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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

@api_view(['POST'])
def set_game_area(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        center = request.data.get('center')
        radius = request.data.get('radius')
        
        # Create a circular polygon from center and radius
        point = Point(center['coordinates'])
        circle = point.buffer(radius / 111000)  # Convert meters to degrees (approximately)
        
        # Update both current_area and start_area
        game.current_area = circle
        game.start_area = circle  # Add this line
        game.area_set = True
        game.radius = radius  # Store the radius
        game.save()
        
        print(f"Set game area - Center: {center['coordinates']}, Radius: {radius}")
        print(f"Resulting area: {game.current_area}")
        
        return Response({
            'status': 'success',
            'area': {
                'center': center['coordinates'],
                'radius': radius
            }
        })
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)
    except Exception as e:
        print(f"Error setting game area: {str(e)}")
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_game(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        
        # Check if user is host
        if game.host != request.user:
            return Response({'error': 'Only the host can start the game'}, status=403)
        
        # Check if game can be started
        if game.status != 'WAITING':
            return Response({'error': 'Game cannot be started'}, status=400)
            
        if not game.area_set:
            return Response({'error': 'Game area must be set before starting'}, status=400)
            
        if game.players.count() < 3:
            return Response({'error': 'Need at least 3 players to start'}, status=400)

        # Assign teams and start game
        print("Assigning teams for game", game_id)  # Debug print
        game.assign_teams_and_hunted()
        game.status = 'ACTIVE'
        game.save()
        
        return Response(GameSerializer(game).data)
        
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)
    except Exception as e:
        print(f"Error starting game: {str(e)}")  # Debug print
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        messages = ChatMessage.objects.filter(game=game)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def game_messages(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        
        if not game.players.filter(user=request.user).exists():
            return Response(
                {"error": "Not authorized to access this game"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            # Get messages in chronological order (oldest first)
            messages = ChatMessage.objects.filter(game=game).order_by('created_at')
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            # Create new message
            message = ChatMessage.objects.create(
                game=game,
                user=request.user,
                content=request.data.get('message', '')
            )
            serializer = ChatMessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Game.DoesNotExist:
        return Response(
            {"error": "Game not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subtract_from_kitty(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
        player = game.players.get(user=request.user)
        
        if player.team != 0:
            return Response(
                {"error": "Only hunted players can subtract from kitty"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
        except:
            return Response(
                {"error": "Invalid amount"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        current_total = game.total_kitty or game.kitty_value_per_player * game.players.count()
            
        if amount > current_total:
            return Response(
                {"error": "Cannot subtract more than the total kitty"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Use the new method to subtract and check if game ended
        game_ended = game.subtract_from_kitty(amount)
        
        response_data = {
            "message": f"Successfully subtracted €{amount} from kitty",
            "new_total": str(game.total_kitty),
            "game_ended": game_ended,
            "game_status": game.status
        }

        if game_ended:
            response_data.update({
                "end_message": "Game Over! The Hunted team has won by depleting the kitty!",
                "winning_team": "Hunted",
                "final_kitty": "0.00"
            })
        
        return Response(response_data)
        
    except ValueError as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Game.DoesNotExist:
        return Response(
            {"error": "Game not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except GamePlayer.DoesNotExist:
        return Response(
            {"error": "Player not found in game"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error in subtract_from_kitty: {str(e)}")
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
