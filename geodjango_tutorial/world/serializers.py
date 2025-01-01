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
        fields = ['id', 'content', 'created_at']

class GamePlayerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = GamePlayer
        fields = ['id', 'user', 'team', 'username']

class GameSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(many=True, read_only=True)
    host = UserSerializer()

    class Meta:
        model = Game
        fields = ['id', 'status', 'host', 'players'] 