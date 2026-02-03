from django.contrib import admin
from .models import (
    User,
    Route,
    Notification,
    Report,
    RoutePoint,
    RouteDate,
    RouteSchedule,
    Community,
    RouteCommunity,
)

# =========================
# USUARIOS
# =========================
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active')
    search_fields = ('username', 'email')


# =========================
# RUTAS
# =========================
@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'day_of_week', 'start_time', 'end_time', 'completed')
    list_filter = ('day_of_week', 'completed')


# =========================
# NOTIFICACIONES
# =========================
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('message', 'usuario', 'sender', 'estado', 'created_at')
    list_filter = ('estado', 'created_at')
    search_fields = ('message', 'usuario__username')


# =========================
# REPORTES
# =========================
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'detalle', 'user', 'admin', 'status', 'fecha')
    list_filter = ('tipo', 'status', 'fecha')
    search_fields = ('detalle', 'user__username')


# =========================
# PUNTOS DE RUTA
# =========================
@admin.register(RoutePoint)
class RoutePointAdmin(admin.ModelAdmin):
    list_display = ('route', 'latitude', 'longitude', 'order')
    list_filter = ('route',)


# =========================
# FECHAS DE RUTA
# =========================
@admin.register(RouteDate)
class RouteDateAdmin(admin.ModelAdmin):
    list_display = ('route', 'date', 'created_at')
    list_filter = ('date', 'created_at')
    search_fields = ('route__name',)
    ordering = ('-date',)


# =========================
# HORARIOS DE RUTA
# =========================
@admin.register(RouteSchedule)
class RouteScheduleAdmin(admin.ModelAdmin):
    list_display = ('route', 'start_time', 'end_time', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('route__name',)
    ordering = ('-created_at',)


# =========================
# ✅ COMUNIDADES
# =========================
@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


# =========================
# ✅ COMUNIDADES POR RUTA (RELACIÓN)
# =========================
@admin.register(RouteCommunity)
class RouteCommunityAdmin(admin.ModelAdmin):
    list_display = ('id', 'route', 'community', 'created_at')
    list_filter = ('route', 'community')
    search_fields = ('route__name', 'community__name')
    ordering = ('-created_at',)