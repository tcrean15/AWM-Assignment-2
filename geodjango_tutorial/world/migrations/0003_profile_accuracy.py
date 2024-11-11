from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('world', '0002_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='Profile',
            name='accuracy',
            field=models.FloatField(blank=True, null=True),
        ),
    ] 