from django.core.management.base import BaseCommand
from app.models import Vehicle  # AJUSTA si tu modelo está en otra app

class Command(BaseCommand):
    help = "Crea el vehículo por defecto con ID=1 si no existe"

    def handle(self, *args, **kwargs):
        if not Vehicle.objects.filter(id=1).exists():
            Vehicle.objects.create(
                id=1,
                latitude=14.886351,
                longitude=-91.514472,
                driver="Camión Principal",
                plate="SC-0001"
            )
            self.stdout.write(self.style.SUCCESS("Vehículo ID=1 creado"))
        else:
            self.stdout.write("Vehículo ID=1 ya existe")

