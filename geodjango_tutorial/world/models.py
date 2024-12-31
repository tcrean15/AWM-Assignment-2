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
    
    host = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='hosted_games',
        null=True  # Keep this nullable for now
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='WAITING'
    )
    start_area = models.PolygonField()
    current_area = models.PolygonField()
    selected_player = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='selected_in_games'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    area_set = models.BooleanField(default=False)
    radius = models.FloatField(default=500)  # Store the radius in meters

    def can_start(self):
        return (
            self.status == 'WAITING' and 
            self.players.count() >= 3
        )

    def start_game(self, selected_player=None):
        if not self.can_start():
            raise ValueError("Game cannot be started")
        
        self.status = 'ACTIVE'
        if selected_player:
            self.selected_player = selected_player
        self.save()

    def __str__(self):
        return f"Game {self.id} ({self.status})"

class GamePlayer(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='game_players')
    team = models.IntegerField(default=0)
    location = models.PointField(null=True)
    last_location_update = models.DateTimeField(null=True)
    
    class Meta:
        unique_together = ['game', 'user']

    def __str__(self):
        return f"{self.user.username} in game {self.game.id}"

class GameHint(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='hints')
    content = models.TextField()
    image = models.ImageField(upload_to='game_hints/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Hint for game {self.game.id} at {self.created_at}"