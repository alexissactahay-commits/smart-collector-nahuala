from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

# Importamos SOLO lo que SÍ existe en views.py
from core.views import (
    login_view,
    register_view,
    change_password,
    forgot_password_view,

    # Ciudadanos
    my_routes_view,

    # Admin
    admin_users_view,
    admin_reports_view,
    admin_report_detail_view,
    generate_reports_view,
    admin_routes_view,

    # Vehículos
    vehicle_detail,
    vehicle_update,

    # Home
    home_view,
    dashboard_view,

    create_default_vehicle,

    # NUEVO 👉 subir foto de perfil
    upload_profile_picture,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),

    # ======================
    #       AUTH
    # ======================
    path('api/login/', login_view),
    path('api/register/', register_view),
    path('api/change-password/', change_password),
    path('api/forgot-password/', forgot_password_view),

    # ======================
    #   DASHBOARDS
    # ======================
    path('admin-dashboard/', dashboard_view),
    path('user-dashboard/', dashboard_view),

    # ======================
    #   CIUDADANO
    # ======================
    path('api/my-routes/', my_routes_view),

    # ======================
    #     ADMIN
    # ======================
    path('api/admin/users/', admin_users_view),
    path('api/admin/reports/', admin_reports_view),
    path('api/admin/reports/<int:pk>/', admin_report_detail_view),
    path('api/admin/reports/generate/', generate_reports_view),
    path('api/admin/routes/', admin_routes_view),

    # ======================
    #     VEHÍCULO
    # ======================
    path('api/vehicles/<int:vehicle_id>/', vehicle_detail),
    path('api/vehicles/<int:vehicle_id>/update-location/', vehicle_update),

    # Crear vehículo por defecto
    path('api/admin/create-default-vehicle/', create_default_vehicle),

    # ======================
    #   SUBIR FOTO DE PERFIL
    # ======================
    path('api/upload-profile-picture/', upload_profile_picture),
]

# ========================================
# 📸 SERVIR MEDIA EN DESARROLLO
# ========================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)




