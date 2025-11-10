from django.contrib import admin
from .models import User, Route, Notification, Report, RoutePoint, RouteDate, RouteSchedule

# Configuración personalizada para modelos (opcional pero útil)
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active')
    search_fields = ('username', 'email')

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'day_of_week', 'start_time', 'end_time', 'completed')
    list_filter = ('day_of_week', 'completed')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('message', 'usuario', 'sender', 'estado', 'created_at')
    list_filter = ('estado', 'created_at')
    search_fields = ('message', 'usuario__username')

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'detalle', 'user', 'admin', 'status', 'fecha')
    list_filter = ('tipo', 'status', 'fecha')
    search_fields = ('detalle', 'user__username')

@admin.register(RoutePoint)
class RoutePointAdmin(admin.ModelAdmin):
    list_display = ('route', 'latitude', 'longitude', 'order')
    list_filter = ('route',)

# 👇 NUEVOS REGISTROS: Fechas y Horarios de Rutas
@admin.register(RouteDate)
class RouteDateAdmin(admin.ModelAdmin):
    list_display = ('route', 'date', 'created_at')
    list_filter = ('date', 'created_at')
    search_fields = ('route__name',)
    ordering = ('-date',)

@admin.register(RouteSchedule)
class RouteScheduleAdmin(admin.ModelAdmin):
    list_display = ('route', 'start_time', 'end_time', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('route__name',)
    ordering = ('-created_at',)