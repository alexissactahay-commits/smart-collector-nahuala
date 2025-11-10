from django.core.management.base import BaseCommand
from core.models import User, Route

class Command(BaseCommand):
    help = 'Carga datos de prueba iniciales'

    def handle(self, *args, **kwargs):
        # Crear ruta de prueba
        route, created = Route.objects.get_or_create(
            id=1,
            defaults={
                'sector': 'Centro Histórico',
                'horario': '8:00 AM - 12:00 PM',
                'estado': 'pendiente',
                'path': [
                    [14.789, -91.852],  # Coordenadas de Olintepeque
                    [14.790, -91.853],
                    [14.791, -91.854],
                    [14.792, -91.855]
                ]
            }
        )

        # Crear usuario ciudadano de prueba
        if not User.objects.filter(username='ciudadano').exists():
            User.objects.create_user(
                username='ciudadano',
                email='ciudadano@olintepeque.gt',
                password='ciudadano123',
                role='ciudadano'
            )

        self.stdout.write(self.style.SUCCESS('✅ ¡Datos de prueba cargados!'))