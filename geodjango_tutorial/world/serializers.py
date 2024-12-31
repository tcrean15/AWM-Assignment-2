from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game, GamePlayer, GameHint
from django.contrib.gis.geos import GEOSGeometry, WKTReader

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
    hunted_player = UserSerializer()
    
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
            'radius',
            'hunted_player'
        ]

    def get_players(self, obj):
        players = GamePlayer.objects.filter(game=obj)
        return GamePlayerSerializer(players, many=True).data

    def get_start_area(self, obj):
        if obj.start_area:
            try:
                # Parse the WKT string into coordinates
                wkt = obj.start_area.wkt
                # Get the center point
                center = obj.start_area.centroid
                
                # Debug logging
                print(f"Start Area WKT: {wkt}")
                print(f"Center point: lat={center.y}, lng={center.x}")
                
                # Return structured data
                return {
                    'wkt': wkt,
                    'center': [center.y, center.x],  # [latitude, longitude]
                    'type': 'circle'
                }
            except Exception as e:
                print(f"Error getting start area: {e}")
                return None
        return None

    def get_current_area(self, obj):
        if obj.current_area:
            try:
                wkt = obj.current_area.wkt
                center = obj.current_area.centroid
                return {
                    'wkt': wkt,
                    'center': [center.y, center.x],  # [latitude, longitude]
                    'type': 'circle'
                }
            except Exception as e:
                print(f"Error getting current area: {e}")
                return None
        return None

    def get_radius(self, obj):
        # Return the stored radius value directly
        return obj.radius 