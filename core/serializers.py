from rest_framework import serializers
from .models import (
    User,
    Route,
    RoutePoint,
    Notification,
    Report,
    RouteDate,
    RouteSchedule,
    Vehicle,
    Community,
    RouteCommunity
)

# ==========================
# USUARIOS
# ==========================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active']


# ==========================
# RUTAS Y PUNTOS
# ==========================
class RoutePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutePoint
        fields = ['id', 'latitude', 'longitude', 'order']


# ==========================
# COMUNIDADES (NUEVO)
# ==========================
class CommunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = ['id', 'name', 'created_at']


class RouteCommunitySerializer(serializers.ModelSerializer):
    # Mostrar la ruta embebida (solo id y name para no inflar)
    route = serializers.SerializerMethodField(read_only=True)
    # Mostrar comunidad embebida
    community = CommunitySerializer(read_only=True)

    # Para crear/asignar (POST)
    route_id = serializers.PrimaryKeyRelatedField(
        source='route',
        queryset=Route.objects.all(),
        write_only=True,
        required=True
    )
    community_id = serializers.PrimaryKeyRelatedField(
        source='community',
        queryset=Community.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = RouteCommunity
        fields = ['id', 'route', 'community', 'route_id', 'community_id', 'created_at']
        validators = []  # evita conflictos con unique_together

    def get_route(self, obj):
        return {"id": obj.route_id, "name": obj.route.name}


class RouteSerializer(serializers.ModelSerializer):
    points = RoutePointSerializer(many=True, read_only=True)

    # ✅ Incluir comunidades asignadas a la ruta (para ciudadano/calendario)
    communities = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Route
        fields = [
            'id',
            'day_of_week',
            'name',
            'description',
            'start_time',
            'end_time',
            'completed',
            'created_at',
            'points',
            'communities',
        ]

    def get_communities(self, obj):
        """
        ✅ FIX DEFINITIVO:
        No dependemos de related_name (community_routes / route_communities / etc.).
        Consultamos directo RouteCommunity y devolvemos sus comunidades.
        """
        links = (
            RouteCommunity.objects
            .filter(route=obj)
            .select_related("community")
            .order_by("community__name")
        )
        communities = [rc.community for rc in links if rc.community_id]
        return CommunitySerializer(communities, many=True).data


# ==========================
# NOTIFICACIONES Y REPORTES
# ==========================
class NotificationSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Report
        fields = '__all__'


# ==========================
# FECHAS DE RUTA
# ==========================
class RouteDateSerializer(serializers.ModelSerializer):
    # ✅ Mostrar ruta embebida para que el frontend tenga name y communities si lo necesita
    route = RouteSerializer(read_only=True, allow_null=True)

    # ✅ Escribir por route_id (POST/PUT)
    route_id = serializers.PrimaryKeyRelatedField(
        source='route',
        queryset=Route.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = RouteDate
        fields = ['id', 'route', 'route_id', 'date', 'created_at']
        validators = []  # por unique_together (route, date)


# ==========================
# HORARIOS DE RUTA
# ==========================
class RouteScheduleSerializer(serializers.ModelSerializer):
    # ✅ GET: mostrar ruta embebida
    route = RouteSerializer(read_only=True, allow_null=True)

    # ✅ POST/PUT/PATCH: route_id para escribir
    route_id = serializers.PrimaryKeyRelatedField(
        source='route',
        queryset=Route.objects.all(),
        write_only=True,
        required=True
    )

    # ✅✅✅ FIX: devolver day_of_week (pero calculado desde la ruta)
    # Esto lo necesita el frontend para filtrar horarios por día.
    day_of_week = serializers.SerializerMethodField(read_only=True)

    def get_day_of_week(self, obj):
        try:
            return obj.route.day_of_week if obj.route else None
        except Exception:
            return None

    class Meta:
        model = RouteSchedule
        fields = [
            'id',
            'route',
            'route_id',
            'day_of_week',   # ✅ vuelve a venir para el frontend
            'start_time',
            'end_time',
            'created_at'
        ]
        validators = []  # evita conflictos con unique_together


# ==========================
# VEHÍCULOS
# ==========================
class VehicleSerializer(serializers.ModelSerializer):
    # ✅ allow_null por si el vehículo no tiene ruta asignada
    route = RouteSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Vehicle
        fields = [
            'id',
            'name',
            'latitude',
            'longitude',
            'last_update',
            'route'
        ]
