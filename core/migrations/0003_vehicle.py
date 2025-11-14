# Generated manually to create Vehicle model
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_add_user_photo'),
    ]

    operations = [
        migrations.CreateModel(
            name='Vehicle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='Camión recolector', max_length=100, verbose_name='Nombre del vehículo')),
                ('latitude', models.FloatField(default=0, verbose_name='Latitud')),
                ('longitude', models.FloatField(default=0, verbose_name='Longitud')),
                ('last_update', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('route', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vehicles', to='core.route', verbose_name='Ruta asignada')),
            ],
            options={
                'verbose_name': 'Vehículo',
                'verbose_name_plural': 'Vehículos',
            },
        ),
    ]
