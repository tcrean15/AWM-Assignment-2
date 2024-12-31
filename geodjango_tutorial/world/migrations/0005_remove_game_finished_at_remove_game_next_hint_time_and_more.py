# Generated by Django 4.2.16 on 2024-12-29 20:13

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("world", "0004_game_locationnote_notecomment_gamehint_gameplayer"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="game",
            name="finished_at",
        ),
        migrations.RemoveField(
            model_name="game",
            name="next_hint_time",
        ),
        migrations.RemoveField(
            model_name="game",
            name="started_at",
        ),
        migrations.AlterField(
            model_name="game",
            name="host",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="hosted_games",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="game",
            name="selected_player",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="selected_in_games",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="game",
            name="status",
            field=models.CharField(default="WAITING", max_length=20),
        ),
    ]
