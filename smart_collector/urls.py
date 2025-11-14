# urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importamos todas las vistas necesarias
from core.views import (
    login_view,
    register_view,
    change_password,
    google_login,
    facebook_login,
    admin_users_view,
    admin_reports_view,
    admin_routes_view,
    mark_route_completed_view,
    send_message_view,
    generate_reports_view,
    
    # Vistas para ciudadanos
    my_notifications_view,
    my_reports_view,
    my_routes_view,

    # Recuperación de contraseña
    forgot_password_view,

    # Fechas y horarios de rutas
    admin_route_dates_view,
    admin_route_date_detail_view,
    admin_route_schedules_view,
    admin_route_schedule_detail_view,

    # Editar/Eliminar Ruta
    admin_route_detail_view,

    # ViewSets
    RouteViewSet,
    NotificationViewSet,
    ReportViewSet,

    # Vistas adicionales
    dashboard_view,
    admin_report_detail_view,
    home_view,

    # 👇 NUEVAS VISTAS PARA VEHICLE (inciso D)
    vehicle_detail,
    vehicle_update,
)

# Router para ViewSets
router = DefaultRouter()
router.register(r'routes', RouteViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),
    path('api/', include(router.urls)),

    # Autenticación
    path('api/login/', login_view, name='login_custom'),
    path('api/register/', register_view, name='register'),
    path('api/change-password/', change_password, name='change_password'),
    path('api/google-login/', google_login, name='google_login'),
    path('api/facebook-login/', facebook_login, name='facebook_login'),

    # Recuperación de contraseña
    path('api/forgot-password/', forgot_password_view, name='forgot-password'),

    # Dashboards del frontend
    path('admin-dashboard/', dashboard_view, name='admin_dashboard'),
    path('user-dashboard/', dashboard_view, name='user_dashboard'),

    # Rutas de administrador
    path('api/admin/users/', admin_users_view, name='admin-users'),
    path('api/admin/reports/', admin_reports_view, name='admin-reports'),
    path('api/admin/reports/generate/', generate_reports_view, name='generate-reports'),
    path('api/admin/routes/', admin_routes_view, name='admin-routes'),
    path('api/admin/routes/<int:route_id>/completed/', mark_route_completed_view, name='mark-route-completed'),
    path('api/admin/routes/<int:pk>/', admin_route_detail_view, name='admin-route-detail'),
    path('api/admin/reports/<int:pk>/', admin_report_detail_view, name='admin-report-detail'),
    path('api/admin/messages/', send_message_view, name='send-message'),

    # Fechas y horarios de rutas
    path('api/admin/route-dates/', admin_route_dates_view, name='admin-route-dates'),
    path('api/admin/route-dates/<int:pk>/', admin_route_date_detail_view, name='admin-route-date-detail'),
    path('api/admin/route-schedules/', admin_route_schedules_view, name='admin-route-schedules'),
    path('api/admin/route-schedules/<int:pk>/', admin_route_schedule_detail_view, name='admin-route-schedule-detail'),

    # Rutas para ciudadanos
    path('api/my-notifications/', my_notifications_view, name='my-notifications'),
    path('api/my-reports/', my_reports_view, name='my-reports'),
    path('api/my-routes/', my_routes_view, name='my-routes'),

    # 👇 INCISO D — RUTAS PARA VEHÍCULO (NUEVAS)
    path('api/vehicle/<int:vehicle_id>/', vehicle_detail, name='vehicle-detail'),
    path('api/vehicle/<int:vehicle_id>/update/', vehicle_update, name='vehicle-update'),

    # Autenticación social
    path('accounts/', include('allauth.urls')),
]
