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

    # ✅ Campo VIRTUAL para el frontend (siempre texto: Lunes/Miércoles/etc)
    # NO lo amarramos directo al modelo para evitar defaults/choices raros.
    day_of_week = serializers.CharField(required=False, allow_blank=True)

    # (Opcional) ver también el día de la ruta
    route_day_of_week = serializers.SerializerMethodField(read_only=True)

    def get_route_day_of_week(self, obj):
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
            'day_of_week',        # ✅ siempre sale como texto bonito
            'route_day_of_week',  # ✅ extra (no rompe)
            'start_time',
            'end_time',
            'created_at'
        ]
        validators = []  # evita conflictos con unique_together

    # -----------------------------
    # Helpers internos
    # -----------------------------
    def _real_day_field_name(self):
        """
        Detecta el nombre real del campo del día en el modelo RouteSchedule.
        """
        model_fields = {f.name for f in RouteSchedule._meta.fields}
        if 'day_of_week' in model_fields:
            return 'day_of_week'
        if 'day' in model_fields:
            return 'day'
        if 'weekday' in model_fields:
            return 'weekday'
        return None

    def _to_canonical_es(self, value):
        if value is None:
            return None
        s = str(value).strip()
        if not s:
            return None

        low = (
            s.lower()
             .replace("á","a").replace("é","e").replace("í","i")
             .replace("ó","o").replace("ú","u").replace("ü","u")
             .replace(".","")
             .strip()
        )

        mapping = {
            "lunes":"Lunes",
            "martes":"Martes",
            "miercoles":"Miércoles",
            "miércoles":"Miércoles",
            "jueves":"Jueves",
            "viernes":"Viernes",
            "sabado":"Sábado",
            "sábado":"Sábado",
            "domingo":"Domingo",
            "monday":"Lunes",
            "tuesday":"Martes",
            "wednesday":"Miércoles",
            "thursday":"Jueves",
            "friday":"Viernes",
            "saturday":"Sábado",
            "sunday":"Domingo",
        }

        # Si viene numérico 0-6 (asumimos 0=Lunes)
        if low.isdigit():
            n = int(low)
            order = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
            if 0 <= n <= 6:
                return order[n]
            return None

        return mapping.get(low)

    # -----------------------------
    # GET: representación segura
    # -----------------------------
    def to_representation(self, instance):
        data = super().to_representation(instance)

        field_name = self._real_day_field_name()
        if field_name:
            raw_value = getattr(instance, field_name, None)

            # si el modelo tiene choices, Django expone get_FIELD_display()
            try:
                display = getattr(instance, f"get_{field_name}_display")()
            except Exception:
                display = None

            day_text = self._to_canonical_es(display or raw_value)
            data["day_of_week"] = day_text
        else:
            data["day_of_week"] = None

        return data

    # -----------------------------
    # POST: crear y luego forzar guardado del día en el campo real
    # -----------------------------
    def create(self, validated_data):
        incoming_day = self.initial_data.get("day_of_week")
        day_text = self._to_canonical_es(incoming_day)

        obj = super().create(validated_data)

        field_name = self._real_day_field_name()
        if field_name and day_text:
            field = RouteSchedule._meta.get_field(field_name)
            internal = field.get_internal_type()

            # si el campo es numérico, convertir a número (y respetar choices si existen)
            if internal in ("IntegerField", "SmallIntegerField", "PositiveSmallIntegerField"):
                mapping_num = {"Lunes":0,"Martes":1,"Miércoles":2,"Jueves":3,"Viernes":4,"Sábado":5,"Domingo":6}
                val_to_set = mapping_num.get(day_text, 0)

                if field.choices:
                    for v, lbl in field.choices:
                        if str(lbl) == str(day_text):
                            val_to_set = v
                            break

                setattr(obj, field_name, val_to_set)
            else:
                setattr(obj, field_name, day_text)

            obj.save(update_fields=[field_name])

        return obj


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