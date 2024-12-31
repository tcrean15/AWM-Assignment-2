from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game, GamePlayer, GameHint
from django.contrib.gis.geos import GEOSGeometry

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
    start_area = serializers.SerializerMethodField()
    current_area = serializers.SerializerMethodField()
    radius = serializers.SerializerMethodField()
    
    class Meta:
        model = Game
        fields = [
            'id', 
            'host', 
            'status', 
            'players', 
            'created_at',
            'area_set',
            'start_area',
            'current_area',
            'radius'
        ]

    def get_players(self, obj):
        players = GamePlayer.objects.filter(game=obj)
        return GamePlayerSerializer(players, many=True).data

    def get_start_area(self, obj):
        if obj.start_area:
            return GEOSGeometry(obj.start_area).coords[0]
        return None

    def get_current_area(self, obj):
        if obj.current_area:
            return GEOSGeometry(obj.current_area).coords[0]
        return None

    def get_radius(self, obj):
        # Return the stored radius value directly
        return obj.radius 