from datetime import timedelta
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Game
from django.contrib.gis.geos import Polygon

channel_layer = get_channel_layer()

def reduce_game_area(game_id):
    """Reduce the game area by 20%"""
    try:
        game = Game.objects.get(id=game_id)
        if game.status != 'IN_PROGRESS':
            return
        
        # Get the current area bounds
        bounds = game.current_area.extent
        center_x = (bounds[0] + bounds[2]) / 2
        center_y = (bounds[1] + bounds[3]) / 2
        
        # Calculate new bounds (20% smaller)
        width = (bounds[2] - bounds[0]) * 0.8
        height = (bounds[3] - bounds[1]) * 0.8
        
        new_bounds = (
            center_x - width/2,
            center_y - height/2,
            center_x + width/2,
            center_y + height/2
        )
        
        # Create new polygon
        new_area = Polygon.from_bbox(new_bounds)
        game.current_area = new_area
        game.next_area_reduction = timezone.now() + timedelta(minutes=25)
        game.save()
        
        # Notify clients
        async_to_sync(channel_layer.group_send)(
            f'game_{game_id}',
            {
                'type': 'game_update',
                'data': {
                    'type': 'area_update',
                    'area': game.current_area.json
                }
            }
        )
        
    except Game.DoesNotExist:
        pass

def check_game_status(game_id):
    """Check if any team has found the selected player"""
    try:
        game = Game.objects.get(id=game_id)
        if game.status != 'IN_PROGRESS':
            return
            
        selected_player = game.players.get(user=game.selected_player)
        other_players = game.players.exclude(user=game.selected_player)
        
        for player in other_players:
            if player.location and selected_player.location:
                # Check if players are within 10 meters of each other
                if player.location.distance(selected_player.location) * 100000 <= 10:
                    game.status = 'FINISHED'
                    game.finished_at = timezone.now()
                    game.save()
                    
                    # Notify clients
                    async_to_sync(channel_layer.group_send)(
                        f'game_{game_id}',
                        {
                            'type': 'game_update',
                            'data': {
                                'type': 'game_finished',
                                'winner_team': player.team
                            }
                        }
                    )
                    break
                    
    except Game.DoesNotExist:
        pass 