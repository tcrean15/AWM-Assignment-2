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
    host = UserSerializer()
    current_area = serializers.SerializerMethodField()
    radius = serializers.FloatField()

    class Meta:
        model = Game
        fields = ['id', 'status', 'host', 'players', 'current_area', 'radius']

    def get_current_area(self, obj):
        if obj.current_area:
            return obj.current_area.ewkt
        return None 

class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'username', 'created_at'] 