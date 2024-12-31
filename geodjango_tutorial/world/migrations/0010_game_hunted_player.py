# Generated by Django 4.2.16 on 2024-12-31 17:01

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("world", "0009_game_radius"),
    ]

    operations = [
        migrations.AddField(
            model_name="game",
            name="hunted_player",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="hunted_in_games",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
