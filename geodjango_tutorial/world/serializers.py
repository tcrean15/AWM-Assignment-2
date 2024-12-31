from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game, GamePlayer, GameHint

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class GameHintSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameHint
        fields = ['id', 'text', 'created_at']

class GamePlayerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = GamePlayer
        fields = ['user', 'team']

class GameSerializer(serializers.ModelSerializer):
    host = UserSerializer()
    players = serializers.SerializerMethodField()
    
    class Meta:
        model = Game
        fields = [
            'id', 
            'host', 
            'status', 
            'players', 
            'created_at',
            'area_set'
        ]

    def get_players(self, obj):
        players = GamePlayer.objects.filter(game=obj)
        return GamePlayerSerializer(players, many=True).data 