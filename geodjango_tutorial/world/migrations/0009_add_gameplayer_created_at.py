from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('world', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameplayer',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='gameplayer',
            name='team',
            field=models.IntegerField(choices=[(1, 'Hunted'), (2, 'Hunters')], default=1),
        ),
    ] 