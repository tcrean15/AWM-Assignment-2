from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.contrib.gis.geos import Point
from django.contrib.auth.forms import UserCreationForm
from .models import Profile, set_user_location, LocationNote, NoteComment
from django.core.serializers import serialize
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.conf import settings

@login_required
def index(request):
    """Main map view"""
    try:
        user_profile = Profile.objects.get(user=request.user)
        location = user_profile.location
    except Profile.DoesNotExist:
        location = None
    return render(request, 'world/map.html', {
        'location': location,
        'settings': settings
    })

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('index')
    else:
        form = AuthenticationForm()
    return render(request, 'world/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required
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

def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create an empty profile for the user
            Profile.objects.create(user=user)
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'world/signup.html', {'form': form})

@login_required
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

@login_required
@require_POST
def add_note(request):
    try:
        latitude = float(request.POST.get('latitude'))
        longitude = float(request.POST.get('longitude'))
        title = request.POST.get('title')
        content = request.POST.get('content')
        
        location = Point(longitude, latitude)
        note = LocationNote.objects.create(
            user=request.user,
            location=location,
            title=title,
            content=content
        )
        
        return JsonResponse({
            'success': True,
            'note_id': note.id,
            'message': 'Note added successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_POST
def delete_note(request, note_id):
    note = get_object_or_404(LocationNote, id=note_id)
    if note.user != request.user:
        return JsonResponse({
            'success': False,
            'message': 'Unauthorized'
        }, status=403)
    
    note.delete()
    return JsonResponse({
        'success': True,
        'message': 'Note deleted successfully'
    })

@login_required
@require_POST
def add_comment(request, note_id):
    note = get_object_or_404(LocationNote, id=note_id)
    content = request.POST.get('content')
    
    comment = NoteComment.objects.create(
        note=note,
        user=request.user,
        content=content
    )
    
    return JsonResponse({
        'success': True,
        'comment_id': comment.id,
        'message': 'Comment added successfully'
    })

@login_required
@require_POST
def delete_comment(request, comment_id):
    comment = get_object_or_404(NoteComment, id=comment_id)
    if comment.user != request.user:
        return JsonResponse({
            'success': False,
            'message': 'Unauthorized'
        }, status=403)
    
    comment.delete()
    return JsonResponse({
        'success': True,
        'message': 'Comment deleted successfully'
    })

@login_required
@require_POST
def edit_note(request, note_id):
    note = get_object_or_404(LocationNote, id=note_id)
    if note.user != request.user:
        return JsonResponse({
            'success': False,
            'message': 'Unauthorized'
        }, status=403)
    
    try:
        title = request.POST.get('title')
        content = request.POST.get('content')
        
        note.title = title
        note.content = content
        note.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Note updated successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_POST
def set_location(request):
    try:
        latitude = float(request.POST.get('latitude'))
        longitude = float(request.POST.get('longitude'))
        accuracy = float(request.POST.get('accuracy', 0))
        
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
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
