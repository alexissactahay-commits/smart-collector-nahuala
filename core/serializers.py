from rest_framework import serializers
from .models import (
    User,
    Route,
    RoutePoint,
    Notification,
    Report,
    RouteDate,
    RouteSchedule,
    Vehicle
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active']


class RoutePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutePoint
        fields = ['id', 'latitude', 'longitude', 'order']


class RouteSerializer(serializers.ModelSerializer):
    points = RoutePointSerializer(many=True, read_only=True)

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
            'points'
        ]


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


class RouteDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteDate
        fields = '__all__'


class RouteScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteSchedule
        fields = '__all__'


# 👇 NUEVO SERIALIZER PARA VEHÍCULO (camión recolector en tiempo real)
class VehicleSerializer(serializers.ModelSerializer):
    route = RouteSerializer(read_only=True)  # opcional, sólo lectura

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
