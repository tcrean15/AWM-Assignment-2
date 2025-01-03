from django.urls import path
from . import views

app_name = 'world'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('games/', views.GameListCreate.as_view(), name='games'),
    path('current-user/', views.current_user, name='current-user'),
    path('logout/', views.logout_view, name='logout'),
    path('games/<int:pk>/', views.GameDetail.as_view(), name='game-detail'),
    path('games/<int:pk>/join/', views.JoinGame.as_view(), name='join-game'),
    path('games/<int:pk>/start/', views.StartGame.as_view(), name='start-game'),
    path('games/<int:game_id>/join/', views.join_game, name='join-game'),
    path('games/<int:game_id>/end/', views.end_game, name='end_game'),
    path('games/<int:game_id>/update-area/', views.update_game_area, name='update-game-area'),
    path('api/games/<int:game_id>/set_area/', views.set_game_area, name='set_game_area'),
    path('api/register/', views.register_view, name='register'),
    path('games/<int:game_id>/chat/', views.chat_history, name='chat-history'),
    path('games/<int:game_id>/messages/', views.game_messages, name='game_messages'),
    path('games/<int:game_id>/subtract-kitty/', views.subtract_from_kitty, name='subtract-kitty'),
] 