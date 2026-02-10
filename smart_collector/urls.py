from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from core.views import (
    # AUTH
    login_view,
    register_view,
    change_password,
    forgot_password_view,
    google_login,

    # Ciudadano
    my_routes_view,
    my_reports_view,
    my_notifications_view,
    citizen_routes_with_points_view,
    citizen_calendar_view,

    # ✅ Horarios ciudadano
    citizen_route_schedules_view,

    # Admin (API)
    admin_users_view,
    admin_reports_view,
    admin_report_detail_view,
    generate_reports_view,
    generate_reports_pdf_view,
    admin_routes_view,
    admin_route_detail_view,
    admin_route_dates_view,
    admin_route_schedules_view,
    admin_route_schedule_delete_view,
    send_message_view,

    # ✅✅✅ NUEVO: Comunidades y asignación a rutas
    communities_view,
    community_detail_view,
    route_communities_view,
    route_community_delete_view,

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

# ✅ Health check rápido (para verificar que está RUNNING)
def health_view(request):
    return JsonResponse({"status": "ok"}, status=200)

urlpatterns = [
    # ✅ Admin real de Django (dejar ambos para evitar confusión)
    path("dj-admin/", admin.site.urls),
    path("admin/", admin.site.urls),  # ✅ ahora /admin/ también funcionará

    # ✅ Health check
    path("health/", health_view, name="health"),

    # Home
    path("", home_view, name="home"),

    # ======================
    #       AUTH
    # ======================
    path("api/login/", login_view),
    path("api/register/", register_view),
    path("api/change-password/", change_password),
    path("api/forgot-password/", forgot_password_view),
    path("api/google-login/", google_login),

    # ======================
    #   DASHBOARDS
    # ======================
    path("admin-dashboard/", dashboard_view),
    path("user-dashboard/", dashboard_view),

    # ======================
    #   CIUDADANO
    # ======================
    path("api/my-routes/", my_routes_view),
    path("api/calendar/", citizen_calendar_view),
    path("api/my-reports/", my_reports_view),
    path("api/my-notifications/", my_notifications_view),

    # ✅ RUTAS CON PUNTOS (para mapa ciudadano)
    path("api/routes/", citizen_routes_with_points_view),

    # ✅ HORARIOS DEFINIDOS POR ADMIN (para HoursView y selector)
    path("api/citizen/route-schedules/", citizen_route_schedules_view),

    # ======================
    #     ADMIN (API)
    # ======================
    path("api/admin/users/", admin_users_view),
    path("api/admin/reports/", admin_reports_view),
    path("api/admin/reports/<int:pk>/", admin_report_detail_view),

    # 🔥 Generar informe JSON
    path("api/admin/reports/generate/", generate_reports_view),

    # 🔥 Generar PDF
    path("api/admin/reports/generate-pdf/", generate_reports_pdf_view),

    # 🔥 Rutas
    path("api/admin/routes/", admin_routes_view),
    path("api/admin/routes/<int:pk>/", admin_route_detail_view),

    # 🔥 Fechas de ruta
    path("api/admin/route-dates/", admin_route_dates_view),

    # 🔥 Horarios de ruta (admin)
    path("api/admin/route-schedules/", admin_route_schedules_view),
    path("api/admin/route-schedules/<int:pk>/", admin_route_schedule_delete_view),

    # 🔥 Mensajes
    path("api/admin/messages/", send_message_view),

    # ======================
    # ✅✅✅ NUEVO: COMUNIDADES (ADMIN)
    # ======================
    path("api/admin/communities/", communities_view),
    path("api/admin/communities/<int:pk>/", community_detail_view),

    # Asignación de comunidades a rutas
    # GET: /api/admin/route-communities/?route_id=1
    path("api/admin/route-communities/", route_communities_view),
    path("api/admin/route-communities/<int:pk>/", route_community_delete_view),

    # ======================
    #     VEHÍCULO
    # ======================
    path("api/vehicles/<int:vehicle_id>/", vehicle_detail),
    path("api/vehicles/<int:vehicle_id>/update-location/", vehicle_update),

    # Crear vehículo por defecto
    path("api/admin/create-default-vehicle/", create_default_vehicle),

    # ======================
    #   SUBIR FOTO PERFIL
    # ======================
    path("api/upload-profile-picture/", upload_profile_picture),
]

# ========================================
# 📸 SERVIR MEDIA EN DESARROLLO (SOLO DEBUG=True)
# En producción esto NO aplica (correcto).
# ========================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)