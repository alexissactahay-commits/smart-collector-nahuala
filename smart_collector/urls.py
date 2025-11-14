# urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importamos solo las vistas que realmente existen
from core.views import (
    login_view,
    register_view,
    change_password,

    # Admin
    admin_users_view,
    admin_reports_view,
    admin_routes_view,
    send_message_view,
    generate_reports_view,
    admin_route_detail_view,
    admin_report_detail_view,

    # Ciudadanos
    my_notifications_view,
    my_reports_view,
    my_routes_view,

    # Recuperar contraseña
    forgot_password_view,

    # Fechas y horarios
    admin_route_dates_view,
    admin_route_date_detail_view,
    admin_route_schedules_view,
    admin_route_schedule_detail_view,

    # Vehículo (Recolector)
    vehicle_detail,
    vehicle_update,

    # Home y dashboards
    dashboard_view,
    home_view,
)

# ViewSets
from core.views import (
    RouteViewSet,
    NotificationViewSet,
    ReportViewSet,
)

# Router
router = DefaultRouter()
router.register(r'routes', RouteViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'reports', ReportViewSet)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),
    path('api/', include(router.urls)),

    # Auth
    path('api/login/', login_view, name='login_custom'),
    path('api/register/', register_view, name='register'),
    path('api/change-password/', change_password, name='change_password'),
    path('api/forgot-password/', forgot_password_view, name='forgot-password'),

    # Dashboards
    path('admin-dashboard/', dashboard_view),
    path('user-dashboard/', dashboard_view),

    # Admin
    path('api/admin/users/', admin_users_view),
    path('api/admin/reports/', admin_reports_view),
    path('api/admin/reports/<int:pk>/', admin_report_detail_view),
    path('api/admin/reports/generate/', generate_reports_view),
    path('api/admin/routes/', admin_routes_view),
    path('api/admin/routes/<int:pk>/', admin_route_detail_view),
    path('api/admin/messages/', send_message_view),

    # Fechas
    path('api/admin/route-dates/', admin_route_dates_view),
    path('api/admin/route-dates/<int:pk>/', admin_route_date_detail_view),
    path('api/admin/route-schedules/', admin_route_schedules_view),
    path('api/admin/route-schedules/<int:pk>/', admin_route_schedule_detail_view),

    # Ciudadanos
    path('api/my-notifications/', my_notifications_view),
    path('api/my-reports/', my_reports_view),
    path('api/my-routes/', my_routes_view),

    # Recolector
    path('api/vehicles/<int:vehicle_id>/', vehicle_detail),
    path('api/vehicles/<int:vehicle_id>/update-location/', vehicle_update),

    # Social auth (si lo activás luego)
    path('accounts/', include('allauth.urls')),
]


