from django.conf import settings
from django.db import migrations, models
import django.contrib.gis.db.models.fields

class Migration(migrations.Migration):

    dependencies = [
        ('world', '0001_initial'),
    ]

    operations = [
        # Make current_area nullable
        migrations.AlterField(
            model_name='game',
            name='current_area',
            field=django.contrib.gis.db.models.fields.PolygonField(blank=True, null=True, srid=4326),
        ),
        # Add center field only (radius already exists)
        migrations.AddField(
            model_name='game',
            name='center',
            field=django.contrib.gis.db.models.fields.PointField(blank=True, null=True, srid=4326),
        ),
    ] 