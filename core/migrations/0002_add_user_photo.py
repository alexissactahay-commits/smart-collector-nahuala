from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='photo',
            field=models.ImageField(
                upload_to='profile_pictures/',
                null=True,
                blank=True,
                verbose_name='Foto de perfil'
            ),
        ),
    ]
