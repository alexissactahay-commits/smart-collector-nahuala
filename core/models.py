from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# ==========================
# CONSTANTES REUTILIZABLES
# ==========================
DIA_SEMANA = (
    ('Lunes', 'Lunes'),
    ('Martes', 'Martes'),
    ('Miércoles', 'Miércoles'),
    ('Jueves', 'Jueves'),
    ('Viernes', 'Viernes'),
    ('Sábado', 'Sábado'),
    ('Domingo', 'Domingo'),
)


class User(AbstractUser):
    ROLES = (
        ('ciudadano', 'Ciudadano'),
        ('recolector', 'Recolector'),
        ('admin', 'Administrador'),
    )

    role = models.CharField(max_length=20, choices=ROLES, default='ciudadano')
    email = models.EmailField(unique=True)

    # 👇 CAMPO NUEVO — Foto de perfil
    photo = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        verbose_name="Foto de perfil"
    )

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Route(models.Model):
    # ⚠️ NOTA:
    # Estos campos quedan por compatibilidad (temporal).
    # La lógica real se manejará con RouteDate (fechas) y RouteSchedule (horarios),
    # pero NO los borramos aquí para no romper vistas/serializers existentes.
    day_of_week = models.CharField(
        max_length=10,
        choices=DIA_SEMANA,
        verbose_name="Día de la semana",
        null=True,
        blank=True
    )

    name = models.CharField(max_length=100, verbose_name="Nombre de la ruta")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")

    start_time = models.TimeField(verbose_name="Hora de inicio", null=True, blank=True)
    end_time = models.TimeField(verbose_name="Hora de fin", null=True, blank=True)

    completed = models.BooleanField(default=False, verbose_name="Completada")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada el")

    class Meta:
        verbose_name = "Ruta"
        verbose_name_plural = "Rutas"

    def __str__(self):
        # Para que no truene si están en None
        day = self.day_of_week or "Sin día"
        st = self.start_time.strftime("%H:%M") if self.start_time else "—"
        et = self.end_time.strftime("%H:%M") if self.end_time else "—"
        return f"{self.name} - {day} ({st} - {et})"


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


# ==========================
# NUEVO: COMUNIDADES
# ==========================
class Community(models.Model):
    name = models.CharField(max_length=150, unique=True, verbose_name="Nombre de la comunidad")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada el")

    class Meta:
        verbose_name = "Comunidad"
        verbose_name_plural = "Comunidades"
        ordering = ["name"]

    def __str__(self):
        return self.name


class RouteCommunity(models.Model):
    """
    Relación N:M entre Ruta y Comunidad.
    - Permite asignar varias comunidades a una ruta.
    - Permite quitar una comunidad de una ruta sin borrar la comunidad global.
    """
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="route_communities")
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="community_routes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Asignada el")

    class Meta:
        verbose_name = "Comunidad por Ruta"
        verbose_name_plural = "Comunidades por Ruta"
        unique_together = ("route", "community")

    def __str__(self):
        return f"{self.route.name} -> {self.community.name}"


class Notification(models.Model):
    """
    Mensajes / notificaciones.

    ✅ NUEVO (para borrar sin romper historial):
    - deleted_by_user: el ciudadano lo "borra" solo para sí mismo
    - deleted_globally: el admin lo borra para todos (ya no aparece ni a admin ni a ciudadano)
    - deleted_at: fecha de borrado (auditoría)
    """
    ESTADOS = (
        ('enviada', 'Enviada'),
        ('pendiente', 'Pendiente'),
        ('leida', 'Leída'),
    )

    message = models.CharField(max_length=150)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_notifications')
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    created_at = models.DateTimeField(auto_now_add=True)

    # ✅✅✅ CAMPOS NUEVOS PARA BORRADO
    deleted_by_user = models.BooleanField(default=False, verbose_name="Borrado por usuario")
    deleted_globally = models.BooleanField(default=False, verbose_name="Borrado por admin (global)")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de borrado")

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["usuario", "created_at"]),
            models.Index(fields=["deleted_globally", "created_at"]),
            models.Index(fields=["deleted_by_user", "created_at"]),
        ]

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

    # ✅✅✅ FIX DEFINITIVO:
    # El horario TIENE que guardar su propio día.
    # Si no, siempre vas a ver el day_of_week de la Route (por eso siempre era Lunes).
    day_of_week = models.CharField(
        max_length=10,
        choices=DIA_SEMANA,
        verbose_name="Día de la semana",
        default='Lunes'
    )

    start_time = models.TimeField(verbose_name="Hora de inicio")
    end_time = models.TimeField(verbose_name="Hora de fin")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creada el")

    class Meta:
        verbose_name = "Horario de Ruta"
        verbose_name_plural = "Horarios de Ruta"
        # ✅ Cambiado: ahora el día también cuenta para evitar choques
        unique_together = ('route', 'day_of_week', 'start_time', 'end_time')

    def __str__(self):
        return f"{self.route.name} - {self.day_of_week} ({self.start_time} a {self.end_time})"


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