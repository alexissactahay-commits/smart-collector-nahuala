from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# SOLO importamos lo que SÍ existe en views.py
from core.views import (
    login_view,
    register_view,
    change_password,
    forgot_password_view,

    # Ciudadanos
    my_notifications_view,
    my_reports_view,
    my_routes_view,

    # Admin
    admin_users_view,
    admin_reports_view,
    admin_routes_view,
    admin_report_detail_view,
    admin_route_detail_view,
    generate_reports_view,

    # Fechas y horarios
    admin_route_dates_view,
    admin_route_date_detail_view,
    admin_route_schedules_view,
    admin_route_schedule_detail_view,

    # Vehículo
    vehicle_detail,
    vehicle_update,

    # Home
    home_view,
    dashboard_view,

    # Viewsets
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

    # API base
    path('api/', include(router.urls)),

    # Auth
    path('api/login/', login_view),
    path('api/register/', register_view),
    path('api/change-password/', change_password),
    path('api/forgot-password/', forgot_password_view),

    # Dashboards
    path('admin-dashboard/', dashboard_view),
    path('user-dashboard/', dashboard_view),

    # Ciudadanos
    path('api/my-notifications/', my_notifications_view),
    path('api/my-reports/', my_reports_view),
    path('api/my-routes/', my_routes_view),

    # Admin
    path('api/admin/users/', admin_users_view),
    path('api/admin/reports/', admin_reports_view),
    path('api/admin/reports/<int:pk>/', admin_report_detail_view),
    path('api/admin/reports/generate/', generate_reports_view),
    path('api/admin/routes/', admin_routes_view),
    path('api/admin/routes/<int:pk>/', admin_route_detail_view),

    # Fechas y horarios
    path('api/admin/route-dates/', admin_route_dates_view),
    path('api/admin/route-dates/<int:pk>/', admin_route_date_detail_view),
    path('api/admin/route-schedules/', admin_route_schedules_view),
    path('api/admin/route-schedules/<int:pk>/', admin_route_schedule_detail_view),

    # Recolector
    path('api/vehicles/<int:vehicle_id>/', vehicle_detail),
    path('api/vehicles/<int:vehicle_id>/update-location/', vehicle_update),

    # Social auth
    path('accounts/', include('allauth.urls')),
]



