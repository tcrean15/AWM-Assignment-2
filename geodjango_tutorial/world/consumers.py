from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Game, GamePlayer
from .serializers import GameSerializer
from django.contrib.gis.geos import Point
from .tasks import check_game_status

class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_group_name = f'game_{self.game_id}'

        # Join game group
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        """Handle incoming messages"""
        message_type = content.get('type')
        
        try:
            if message_type == 'update_location':
                success = await self.update_location(content)
                if success:
                    # Broadcast game update to all players
                    game_data = await self.get_game_data()
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            'type': 'game_update',
                            'data': game_data
                        }
                    )
            elif message_type == 'add_hint':
                await self.add_hint(content)
            else:
                await self.send_json({
                    'error': 'Invalid message type'
                })
        except Exception as e:
            await self.send_json({
                'error': str(e)
            })

    async def game_update(self, event):
        """Send game update to WebSocket"""
        await self.send_json(event['data'])

    @database_sync_to_async
    def update_location(self, content):
        try:
            game = Game.objects.get(id=self.game_id)
            player = game.players.get(user=self.scope['user'])
            
            lat = content.get('latitude')
            lng = content.get('longitude')
            if lat and lng:
                player.location = Point(float(lng), float(lat))
                player.save()
                
                # Check if game should end
                check_game_status(self.game_id)
                
                return True
        except (Game.DoesNotExist, GamePlayer.DoesNotExist):
            return False

    @database_sync_to_async
    def add_hint(self, content):
        try:
            game = Game.objects.get(id=self.game_id)
            if game.selected_player == self.scope['user']:
                hint_text = content.get('hint')
                if hint_text:
                    game.hints.create(
                        text=hint_text,
                        created_by=self.scope['user']
                    )
                    return True
            return False
        except Game.DoesNotExist:
            return False

    @database_sync_to_async
    def get_game_data(self):
        """Get serialized game data"""
        game = Game.objects.get(id=self.game_id)
        return GameSerializer(game).data