from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

# Importar vistas existentes
from core.views import (
    # AUTH
    login_view,
    register_view,
    change_password,
    forgot_password_view,

    # Ciudadano
    my_routes_view,
    my_reports_view,
    my_notifications_view,

    # Admin
    admin_users_view,
    admin_reports_view,
    admin_report_detail_view,
    generate_reports_view,
    generate_reports_pdf_view,   # 🔥 NECESARIO PARA PDF
    admin_routes_view,
    send_message_view,

    # Vehículos
    vehicle_detail,
    vehicle_update,

    # Home / Dashboard
    home_view,
    dashboard_view,

    # Otros
    create_default_vehicle,
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
    path('api/my-reports/', my_reports_view),
    path('api/my-notifications/', my_notifications_view),

    # ======================
    #     ADMIN
    # ======================
    path('api/admin/users/', admin_users_view),
    path('api/admin/reports/', admin_reports_view),
    path('api/admin/reports/<int:pk>/', admin_report_detail_view),

    # 🔥 **GENERAR INFORME JSON**
    path('api/admin/reports/generate/', generate_reports_view),

    # 🔥 **GENERAR PDF (FUNCIONA CON REPORTLAB)**
    path('api/admin/reports/generate-pdf/', generate_reports_pdf_view),

    # 🔥 ADMIN — RUTAS
    path('api/admin/routes/', admin_routes_view),

    # 🔥 NUEVO — mensajes del admin
    path('api/admin/messages/', send_message_view),

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
