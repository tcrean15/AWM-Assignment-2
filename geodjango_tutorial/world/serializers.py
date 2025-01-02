from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game, GamePlayer, GameHint, ChatMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class GameHintSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameHint
        fields = ['id', 'content', 'created_at']

class GamePlayerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    username = serializers.CharField(source='user.username', read_only=True)
    team_name = serializers.SerializerMethodField()

    class Meta:
        model = GamePlayer
        fields = ['id', 'user', 'team', 'username', 'team_name']

    def get_team_name(self, obj):
        team_names = {
            0: 'Hunted',
            1: 'Hunters Team 1',
            2: 'Hunters Team 2',
            3: 'Hunters Team 3'
        }
        return team_names.get(obj.team, 'Unknown Team')

class GameSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(many=True, read_only=True)
    host = UserSerializer(read_only=True)
    center = serializers.SerializerMethodField()
    total_kitty = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    kitty_value_per_player = serializers.DecimalField(max_digits=6, decimal_places=2)
    
    class Meta:
        model = Game
        fields = [
            'id', 'status', 'host', 'players', 'current_area', 
            'radius', 'kitty_value_per_player', 'total_kitty', 'center',
            'area_set'
        ]

    def get_center(self, obj):
        if obj.center:
            return {
                'type': 'Point',
                'coordinates': [obj.center.x, obj.center.y]
            }
        return None

class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'username', 'created_at'] 