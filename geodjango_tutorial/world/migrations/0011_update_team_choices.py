# Generated by Django 4.2.16 on 2025-01-01 21:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("world", "0010_alter_gameplayer_created_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="gameplayer",
            name="team",
            field=models.IntegerField(
                choices=[
                    (0, "Hunted"),
                    (1, "Hunters Team 1"),
                    (2, "Hunters Team 2"),
                    (3, "Hunters Team 3"),
                ],
                default=1,
            ),
        ),
    ]
