from django.contrib.gis.db import models

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.utils import timezone

class WorldBorder(models.Model):

    # Regular Django fields corresponding to the attributes in the

    # world borders shapefile.

    name = models.CharField(max_length=50)

    area = models.IntegerField()

    pop2005 = models.IntegerField('Population 2005')

    fips = models.CharField('FIPS Code', max_length=2, null=True)

    iso2 = models.CharField('2 Digit ISO', max_length=2)

    iso3 = models.CharField('3 Digit ISO', max_length=3)

    un = models.IntegerField('United Nations Code')

    region = models.IntegerField('Region Code')

    subregion = models.IntegerField('Sub-Region Code')

    lon = models.FloatField()

    lat = models.FloatField()

 

    # GeoDjango-specific: a geometry field (MultiPolygonField)

    mpoly = models.MultiPolygonField()

 

    # Returns the string representation of the model.

    def __str__(self):

        return self.name


#Store a point location on a user's profile.

User = get_user_model()

 

class Profile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    location = models.PointField(null=True, blank=True)

    accuracy = models.FloatField(null=True, blank=True)  # Store accuracy in meters

 

    def __str__(self):

        return self.user.username
    

def set_user_location(user_id, latitude, longitude, accuracy=None):

    user = User.objects.get(id=user_id)

    location = Point(longitude, latitude)  # Point takes (longitude, latitude)

   

    # Create or update the user's profile

    profile, created = Profile.objects.get_or_create(user=user)

    profile.location = location

    profile.accuracy = accuracy

    profile.save()

   

    return profile

class LocationNote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    location = models.PointField()
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.user.username}"

class NoteComment(models.Model):
    note = models.ForeignKey(LocationNote, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.note.title}"

class Game(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Waiting for players'),
        ('ACTIVE', 'Game in progress'),
        ('FINISHED', 'Game finished'),
    ]
    
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_games', null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='WAITING')
    start_area = models.PolygonField()
    current_area = models.PolygonField(null=True, blank=True)
    selected_player = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='selected_in_games')
    hunted_player = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='hunted_in_games')
    created_at = models.DateTimeField(auto_now_add=True)
    area_set = models.BooleanField(default=False)
    radius = models.FloatField(default=500)
    center = models.PointField(null=True, blank=True)

    def assign_teams_and_hunted(self):
        """Randomly assign teams and select a hunted player"""
        print("Starting team assignment...")  # Debug print
        players = list(self.players.all())
        if len(players) < 3:
            raise ValueError("Need at least 3 players")

        # Reset all players' teams first
        for player in players:
            player.team = 1  # Default to Hunters Team 1
            player.save()

        # Randomly select hunted player
        import random
        hunted = random.choice(players)
        hunted.team = 0  # Team 0 for hunted
        hunted.save()
        print(f"Selected {hunted.user.username} as hunted")  # Debug print

        # Remove hunted from players list and shuffle remaining players
        remaining_players = [p for p in players if p != hunted]
        random.shuffle(remaining_players)

        # Calculate number of hunter teams based on remaining players
        num_players = len(remaining_players)
        if num_players <= 4:
            num_teams = 2  # 2 teams for 3-5 total players
        else:
            num_teams = 3  # 3 teams for 6+ total players

        print(f"Creating {num_teams} hunter teams")  # Debug print

        # Distribute players across teams
        players_per_team = num_players // num_teams
        extra_players = num_players % num_teams

        current_index = 0
        for team_num in range(1, num_teams + 1):
            # Calculate how many players this team should get
            team_size = players_per_team
            if extra_players > 0:
                team_size += 1
                extra_players -= 1

            # Assign players to this team
            team_players = remaining_players[current_index:current_index + team_size]
            for player in team_players:
                player.team = team_num
                player.save()
                print(f"Assigned {player.user.username} to team {team_num}")  # Debug print
            
            current_index += team_size

        self.save()
        print("Team assignment complete")  # Debug print

    def set_game_area(self, center_lat, center_lng, radius):
        from django.contrib.gis.geos import Point
        self.center = Point(center_lng, center_lat)
        self.radius = radius
        # Create circular polygon for the area
        self.current_area = self.center.buffer(radius / 111000)  # Convert meters to degrees
        self.area_set = True
        self.save()

    def __str__(self):
        return f"Game {self.id} ({self.status})"

class GamePlayer(models.Model):
    TEAM_CHOICES = [
        (0, 'Hunted'),
        (1, 'Hunters Team 1'),
        (2, 'Hunters Team 2'),
        (3, 'Hunters Team 3'),
    ]
    
    game = models.ForeignKey(Game, related_name='players', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='game_players', on_delete=models.CASCADE)
    team = models.IntegerField(choices=TEAM_CHOICES, default=1)
    location = models.PointField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('game', 'user')

    def get_team_display(self):
        return dict(self.TEAM_CHOICES).get(self.team, 'Unknown Team')

    def __str__(self):
        return f"{self.user.username} in {self.game} - {self.get_team_display()}"

class GameHint(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='hints')
    content = models.TextField()
    image = models.ImageField(upload_to='game_hints/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Hint for game {self.game.id} at {self.created_at}"

class ChatMessage(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}"