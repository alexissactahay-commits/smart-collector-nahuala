from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLES = (
        ('ciudadano', 'Ciudadano'),
        ('recolector', 'Recolector'),
        ('admin', 'Administrador'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='ciudadano')
    email = models.EmailField(unique=True)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Route(models.Model):
    DIA_SEMANA = (
        ('Lunes', 'Lunes'),
        ('Martes', 'Martes'),
        ('Miércoles', 'Miércoles'),
        ('Jueves', 'Jueves'),
        ('Viernes', 'Viernes'),
        ('Sábado', 'Sábado'),
        ('Domingo', 'Domingo'),
    )
    day_of_week = models.CharField(max_length=10, choices=DIA_SEMANA, verbose_name="Día de la semana")
    name = models.CharField(max_length=100, verbose_name="Nombre de la ruta")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    start_time = models.TimeField(verbose_name="Hora de inicio")
    end_time = models.TimeField(verbose_name="Hora de fin")
    completed = models.BooleanField(default=False, verbose_name="Completada")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada el")

    class Meta:
        verbose_name = "Ruta"
        verbose_name_plural = "Rutas"

    def __str__(self):
        return f"{self.name} - {self.day_of_week} ({self.start_time} - {self.end_time})"


class RoutePoint(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='points')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name="Latitud")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name="Longitud")
    order = models.PositiveIntegerField(default=0, verbose_name="Orden en la ruta")

    class Meta:
        ordering = ['order']
        verbose_name = "Punto de Ruta"
        verbose_name_plural = "Puntos de Ruta"

    def __str__(self):
        return f"Punto {self.order} de {self.route.name}"


class Notification(models.Model):
    ESTADOS = (
        ('enviada', 'Enviada'),
        ('pendiente', 'Pendiente'),
        ('leida', 'Leída'),
    )
    message = models.CharField(max_length=150)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_notifications')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notificación para {self.usuario.username}: {self.message}"


class Report(models.Model):
    TIPOS = (
        ('incidencias', 'Incidencias'),
        ('rutas', 'Rutas'),
        ('usuarios', 'Usuarios'),
    )
    ESTADOS = (
        ('pending', 'Pendiente'),
        ('resolved', 'Resuelto'),
        ('unresolved', 'No resuelto'),
    )
    tipo = models.CharField(max_length=50, choices=TIPOS, default='incidencias')
    fecha = models.DateTimeField(auto_now_add=True)
    detalle = models.CharField(max_length=200)
    admin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'admin'},
        related_name='managed_reports'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_reports',
        verbose_name="Usuario que reporta"
    )
    status = models.CharField(max_length=20, choices=ESTADOS, default='pending')

    def __str__(self):
        return f"Reporte de {self.get_tipo_display()} por {self.user.username}"


# 👇 NUEVOS MODELOS: Fechas y Horarios de Rutas
class RouteDate(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='dates')
    date = models.DateField(verbose_name="Fecha")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada el")

    class Meta:
        verbose_name = "Fecha de Ruta"
        verbose_name_plural = "Fechas de Ruta"
        unique_together = ('route', 'date')

    def __str__(self):
        return f"{self.route.name} - {self.date}"


class RouteSchedule(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='schedules')
    start_time = models.TimeField(verbose_name="Hora de inicio")
    end_time = models.TimeField(verbose_name="Hora de fin")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada el")

    class Meta:
        verbose_name = "Horario de Ruta"
        verbose_name_plural = "Horarios de Ruta"

    def __str__(self):
        return f"{self.route.name} - {self.start_time} a {self.end_time}"


# 👇 NUEVO MODELO: Vehículo (ubicación en tiempo real del camión recolector)
class Vehicle(models.Model):
    name = models.CharField(
        max_length=100,
        default="Camión recolector",
        verbose_name="Nombre del vehículo"
    )
    latitude = models.FloatField(default=0, verbose_name="Latitud")
    longitude = models.FloatField(default=0, verbose_name="Longitud")
    last_update = models.DateTimeField(auto_now=True, verbose_name="Última actualización")
    route = models.ForeignKey(
        Route,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
        verbose_name="Ruta asignada"
    )

    class Meta:
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"

    def __str__(self):
        return f"{self.name} (lat={self.latitude}, lng={self.longitude})"
