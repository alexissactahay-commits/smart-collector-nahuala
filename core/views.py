import requests
from django.shortcuts import render, get_object_or_404
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

# ✅✅✅ FIX PDF: agregar renderer_classes
from rest_framework.decorators import api_view, permission_classes, renderer_classes

from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import update_session_auth_hash
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# 🚀 IMPORTS EXTRA PARA RENDER (PDF)
from reportlab.pdfgen import canvas
from io import BytesIO

# ✅✅✅ FIX PDF: BaseRenderer para evitar 406 Accept header
from rest_framework.renderers import BaseRenderer

# ✅✅✅ FIX: para parsear HH:MM a time y evitar 500
from datetime import datetime

# MODELOS
from .models import (
    Route, RoutePoint, Notification, Report, User,
    RouteDate, RouteSchedule, Vehicle,
    Community, RouteCommunity
)

# SERIALIZERS
from .serializers import (
    RouteSerializer, NotificationSerializer, ReportSerializer,
    UserSerializer, RouteDateSerializer, RouteScheduleSerializer,
    VehicleSerializer, CommunitySerializer, RouteCommunitySerializer
)

# ====================================
#   LOGIN Y REGISTRO
# ====================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        token["user_id"] = user.id
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    identifier = request.data.get("identifier")
    password = request.data.get("password")

    if not identifier or not password:
        return Response({"error": "Todos los campos son obligatorios."}, status=400)

    try:
        user = User.objects.get(email__iexact=identifier)
    except User.DoesNotExist:
        try:
            user = User.objects.get(username__iexact=identifier)
        except User.DoesNotExist:
            return Response({"error": "Credenciales inválidas."}, status=401)

    if not user.check_password(password):
        return Response({"error": "Credenciales inválidas."}, status=401)

    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username
    refresh["user_id"] = user.id

    access = refresh.access_token
    access["role"] = user.role
    access["username"] = user.username
    access["user_id"] = user.id

    return Response({
        "access": str(access),
        "refresh": str(refresh),
        "role": user.role,
        "username": user.username,
        "user_id": user.id,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    role = request.data.get("role", "ciudadano")

    if not username or not email or not password:
        return Response({"error": "Todos los campos son obligatorios."}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "El correo ya está registrado."}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password, role=role)

    if role == "admin":
        user.is_staff = True
        user.is_superuser = True
        user.save()

    return Response({"message": "Usuario registrado correctamente."}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not user.check_password(old_password):
        return Response({"error": "Contraseña actual incorrecta."}, status=400)

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)

    return Response({"message": "Contraseña actualizada correctamente."})


# ====================================
#   RECUPERAR CONTRASEÑA
# ====================================

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password_view(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "El correo es obligatorio."}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"message": "Si el correo está registrado, recibirás instrucciones."})

    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    host = request.get_host()
    base_url = "https://smartcollectorolintepeque.com" if "localhost" not in host else "http://localhost:3000"

    reset_url = f"{base_url}/reset-password/{uidb64}/{token}/"

    subject = "Restablecimiento de contraseña - Smart Collector"
    message = render_to_string("password_reset_email.html", {"user": user, "reset_url": reset_url})

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

    return Response({"message": "Si el correo existe, recibirás instrucciones."})


# ====================================
#   GOOGLE LOGIN
# ====================================

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    token = request.data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), getattr(settings, "GOOGLE_CLIENT_ID", "")
        )

        email = idinfo["email"]
        username = idinfo.get("name", email.split("@")[0])

        user, created = User.objects.get_or_create(
            email=email, defaults={"username": username, "role": "ciudadano"}
        )

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["username"] = user.username
        refresh["user_id"] = user.id

        access = refresh.access_token
        access["role"] = user.role
        access["username"] = user.username
        access["user_id"] = user.id

        return JsonResponse({
            "access": str(access),
            "refresh": str(refresh),
            "role": user.role,
            "username": user.username,
            "user_id": user.id,
        })

    except Exception:
        return JsonResponse({"error": "Token de Google inválido"}, status=400)


# ====================================
#   VEHICLES
# ====================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vehicle_detail(request, vehicle_id):
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({"error": "Vehículo no encontrado."}, status=404)

    serializer = VehicleSerializer(vehicle)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def vehicle_update(request, vehicle_id):
    if request.user.role != "recolector":
        return Response({"error": "Solo recolectores pueden actualizar."}, status=403)

    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({"error": "Vehículo no encontrado."}, status=404)

    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")

    if latitude is None or longitude is None:
        return Response({"error": "Latitud y longitud requeridas."}, status=400)

    vehicle.latitude = latitude
    vehicle.longitude = longitude
    vehicle.last_update = timezone.now()
    vehicle.save()

    return Response({"message": "Ubicación actualizada correctamente."})


# ====================================
#   ADMIN – USUARIOS Y REPORTES
# ====================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users_view(request):
    users = User.objects.all().values("id", "username", "email", "role", "is_active")
    return Response(list(users))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_reports_view(request):
    reports = Report.objects.select_related("user").all()
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def admin_report_detail_view(request, pk):
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return Response({"error": "Reporte no encontrado."})

    new_status = request.data.get("status")
    if new_status not in ["pending", "resolved", "unresolved"]:
        return Response({"error": "Estado inválido."})

    report.status = new_status
    report.save()

    return Response({"message": "Reporte actualizado."})


# ====================================
#   ADMIN – RUTAS
# ====================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_routes_view(request):

    if request.method == "GET":
        routes = Route.objects.prefetch_related("points").order_by("id")
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = RouteSerializer(data=request.data)

        if serializer.is_valid():
            route = serializer.save()

            points = request.data.get("points", [])
            if isinstance(points, list):
                for idx, p in enumerate(points):
                    RoutePoint.objects.create(
                        route=route,
                        latitude=p.get("latitude"),
                        longitude=p.get("longitude"),
                        order=p.get("order", idx),
                    )

            return Response(RouteSerializer(route).data, status=201)

        return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def admin_route_detail_view(request, pk):

    route = get_object_or_404(Route.objects.prefetch_related("points"), pk=pk)

    if request.method == "GET":
        return Response(RouteSerializer(route).data, status=200)

    if request.method in ["PUT", "PATCH"]:
        partial = request.method == "PATCH"

        serializer = RouteSerializer(route, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        route = serializer.save()

        points = request.data.get("points", None)
        if points is not None:
            if not isinstance(points, list):
                return Response({"points": "Debe ser una lista."}, status=400)

            RoutePoint.objects.filter(route=route).delete()
            for idx, p in enumerate(points):
                RoutePoint.objects.create(
                    route=route,
                    latitude=p.get("latitude"),
                    longitude=p.get("longitude"),
                    order=p.get("order", idx),
                )

        return Response(RouteSerializer(route).data, status=200)

    if request.method == "DELETE":
        route.delete()
        return Response({"message": "Ruta eliminada correctamente."}, status=200)


# =====================================================
#   🚀 ADMIN – FECHAS DE RUTAS
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_route_dates_view(request):

    if request.method == "GET":
        fechas = RouteDate.objects.select_related("route").order_by("date")
        serializer = RouteDateSerializer(fechas, many=True)
        return Response(serializer.data, status=200)

    if request.method == "POST":
        route_id = request.data.get("route_id")
        date = request.data.get("date")

        if not route_id or not date:
            return Response({"error": "route_id y date son obligatorios"}, status=400)

        try:
            route = Route.objects.get(id=route_id)
        except Route.DoesNotExist:
            return Response({"error": "Ruta no encontrada"}, status=404)

        if RouteDate.objects.filter(route=route, date=date).exists():
            return Response({"error": "Esa fecha ya está asignada a esta ruta."}, status=400)

        nueva_fecha = RouteDate.objects.create(
            route=route,
            date=date
        )

        return Response(RouteDateSerializer(nueva_fecha).data, status=201)


# ✅✅✅ NUEVO: DELETE FECHAS (para que no dé 404 al eliminar)
@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_route_date_delete_view(request, pk):
    try:
        fecha = RouteDate.objects.get(pk=pk)
    except RouteDate.DoesNotExist:
        return Response({"error": "Fecha no encontrada"}, status=404)

    fecha.delete()
    return Response({"message": "Fecha eliminada correctamente"}, status=200)


# =====================================================
#   🚀 ADMIN – HORARIOS DE RUTAS
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_route_schedules_view(request):

    if request.method == "GET":
        horarios = RouteSchedule.objects.select_related("route").order_by("id")
        serializer = RouteScheduleSerializer(horarios, many=True)
        return Response(serializer.data, status=200)

    payload = request.data.copy()

    route_val = payload.get("route_id", None)
    if route_val is None:
        route_val = payload.get("route", None)

    if isinstance(route_val, dict):
        route_val = route_val.get("id")

    if route_val is not None:
        payload["route_id"] = route_val

    def _parse_time(value):
        if value is None:
            return None
        if hasattr(value, "hour"):
            return value
        s = str(value).strip()
        if not s:
            return None
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return datetime.strptime(s, fmt).time()
            except ValueError:
                continue
        return None

    payload["start_time"] = _parse_time(payload.get("start_time"))
    payload["end_time"] = _parse_time(payload.get("end_time"))

    serializer = RouteScheduleSerializer(data=payload)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    nuevo = serializer.save()
    return Response(RouteScheduleSerializer(nuevo).data, status=201)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_route_schedule_delete_view(request, pk):

    try:
        horario = RouteSchedule.objects.get(pk=pk)
    except RouteSchedule.DoesNotExist:
        return Response({"error": "Horario no encontrado"}, status=404)

    horario.delete()

    return Response({"message": "Horario eliminado correctamente"}, status=200)


# ====================================
#   ✅ ADMIN – COMUNIDADES (NUEVO)
# ====================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def communities_view(request):
    if request.method == "GET":
        communities = Community.objects.all().order_by("name")
        serializer = CommunitySerializer(communities, many=True)
        return Response(serializer.data, status=200)

    name = request.data.get("name")
    if not name or not str(name).strip():
        return Response({"error": "El nombre de la comunidad es obligatorio."}, status=400)

    name = str(name).strip()

    if Community.objects.filter(name__iexact=name).exists():
        return Response({"error": "Esa comunidad ya existe."}, status=400)

    c = Community.objects.create(name=name)
    return Response(CommunitySerializer(c).data, status=201)


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def community_detail_view(request, pk):
    community = get_object_or_404(Community, pk=pk)

    if request.method in ["PUT", "PATCH"]:
        name = request.data.get("name")
        if not name or not str(name).strip():
            return Response({"error": "El nombre de la comunidad es obligatorio."}, status=400)

        name = str(name).strip()

        if Community.objects.filter(name__iexact=name).exclude(pk=community.pk).exists():
            return Response({"error": "Ya existe otra comunidad con ese nombre."}, status=400)

        community.name = name
        community.save()
        return Response(CommunitySerializer(community).data, status=200)

    community.delete()
    return Response({"message": "Comunidad eliminada correctamente."}, status=200)


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def route_communities_view(request):
    if request.method == "GET":
        route_id = request.query_params.get("route_id")
        if not route_id:
            return Response({"error": "route_id es obligatorio en query params."}, status=400)

        qs = RouteCommunity.objects.select_related("route", "community").filter(route_id=route_id).order_by("community__name")
        serializer = RouteCommunitySerializer(qs, many=True)
        return Response(serializer.data, status=200)

    route_id = request.data.get("route_id")
    community_id = request.data.get("community_id")

    if not route_id or not community_id:
        return Response({"error": "route_id y community_id son obligatorios."}, status=400)

    try:
        route = Route.objects.get(pk=route_id)
    except Route.DoesNotExist:
        return Response({"error": "Ruta no encontrada."}, status=404)

    try:
        community = Community.objects.get(pk=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Comunidad no encontrada."}, status=404)

    if RouteCommunity.objects.filter(route=route, community=community).exists():
        return Response({"error": "Esa comunidad ya está asignada a esta ruta."}, status=400)

    rc = RouteCommunity.objects.create(route=route, community=community)
    return Response(RouteCommunitySerializer(rc).data, status=201)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def route_community_delete_view(request, pk):
    rc = get_object_or_404(RouteCommunity, pk=pk)
    rc.delete()
    return Response({"message": "Comunidad quitada de la ruta correctamente."}, status=200)


# ====================================
#   CIUDADANO – CALENDARIO (RouteDate)
# ====================================

def _prefetch_route_communities(qs):
    try:
        return qs.prefetch_related("route__route_communities__community")
    except Exception:
        return qs.prefetch_related("route__community_routes__community")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_routes_view(request):
    fechas = RouteDate.objects.select_related("route").order_by("date")
    fechas = _prefetch_route_communities(fechas)
    serializer = RouteDateSerializer(fechas, many=True)
    return Response(serializer.data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def citizen_calendar_view(request):
    fechas = RouteDate.objects.select_related("route").order_by("date")
    fechas = _prefetch_route_communities(fechas)
    serializer = RouteDateSerializer(fechas, many=True)
    return Response(serializer.data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def citizen_route_schedules_view(request):
    try:
        horarios = (
            RouteSchedule.objects
            .select_related("route")
            .filter(route__isnull=False)
            .order_by("route_id", "start_time")
        )

        serializer = RouteScheduleSerializer(horarios, many=True)
        return Response(serializer.data, status=200)

    except Exception as e:
        print("ERROR citizen_route_schedules_view:", repr(e))
        return Response({"error": "Error interno cargando horarios."}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def citizen_routes_with_points_view(request):
    routes = Route.objects.prefetch_related("points").order_by("id")
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data, status=200)


# ====================================
#   CIUDADANO – REPORTES
# ====================================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_reports_view(request):
    user = request.user

    if request.method == "GET":
        reports = Report.objects.filter(user=user).order_by("-fecha")
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        detalle = request.data.get("detalle")
        tipo = request.data.get("tipo")

        if not detalle:
            return Response({"error": "El campo detalle es requerido."}, status=400)

        report = Report.objects.create(
            user=user,
            detalle=detalle,
            tipo=tipo or "incidencias",
            status="pending",
        )

        serializer = ReportSerializer(report)
        return Response(serializer.data, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def my_report_delete_view(request, pk):
    """
    Permite eliminar un reporte:
    - Ciudadano: solo puede eliminar sus propios reportes
    - Admin: puede eliminar cualquier reporte
    """
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return Response({"error": "Reporte no encontrado."}, status=404)

    if request.user.role == "admin":
        report.delete()
        return Response({"message": "Reporte eliminado por admin."}, status=200)

    if report.user_id != request.user.id:
        return Response({"error": "No tienes permisos para eliminar este reporte."}, status=403)

    report.delete()
    return Response({"message": "Reporte eliminado correctamente."}, status=200)


# ====================================
#   OTROS
# ====================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_default_vehicle(request):
    if Vehicle.objects.filter(id=1).exists():
        return Response({"message": "El vehículo ID 1 ya existe."})

    Vehicle.objects.create(
        id=1,
        latitude=14.886351,
        longitude=-91.514472,
    )

    return Response({"message": "Vehículo creado correctamente."})


def home_view(request):
    return HttpResponse("¡Bienvenido a Smart Collector!")


def dashboard_view(request):
    return HttpResponse(status=200)


# ====================================
#   SUBIR FOTO
# ====================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    user = request.user

    if "profile_picture" not in request.FILES:
        return Response({"error": "No se envió ninguna imagen."}, status=400)

    image = request.FILES["profile_picture"]

    filename = f"profile_pics/user_{user.id}.jpg"
    path = default_storage.save(filename, ContentFile(image.read()))

    user.photo = filename
    user.save()

    full_url = request.build_absolute_uri(settings.MEDIA_URL + filename)

    return Response({
        "message": "Foto actualizada correctamente.",
        "photo_url": full_url,
    })


# ====================================
#   NOTIFICACIONES CIUDADANO
# ====================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_notifications_view(request):
    user = request.user

    mensajes = (
        Notification.objects
        .filter(
            usuario=user,
            deleted_globally=False,
            deleted_by_user=False
        )
        .select_related("sender")
        .order_by("-created_at")
    )

    data = [
        {
            "id": m.id,
            "message": m.message,
            "estado": m.estado,
            "created_at": m.created_at,
            "sender": {
                "id": m.sender.id,
                "username": m.sender.username,
                "email": m.sender.email
            } if m.sender else None
        }
        for m in mensajes
    ]

    return Response(data, status=200)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def my_notification_delete_view(request, pk):
    user = request.user

    n = get_object_or_404(Notification, pk=pk, usuario=user)

    if getattr(n, "deleted_globally", False):
        return Response({"message": "El mensaje ya fue eliminado por administración."}, status=200)

    n.deleted_by_user = True
    if not n.deleted_at:
        n.deleted_at = timezone.now()
    n.save(update_fields=["deleted_by_user", "deleted_at"])

    return Response({"message": "Mensaje eliminado correctamente."}, status=200)


# ====================================
#   🚀 FUNCIÓN EXTRA 1 — LISTA DE REPORTES
# ====================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def generate_reports_view(request):
    reports = Report.objects.select_related("user").order_by("-fecha")
    serializer = ReportSerializer(reports, many=True)
    return Response({
        "message": "Reporte general generado correctamente.",
        "total": len(serializer.data),
        "reports": serializer.data
    }, status=200)


# ====================================
#   🚀 FUNCIÓN EXTRA 2 — PDF DE REPORTES
# ====================================

class PDFRenderer(BaseRenderer):
    media_type = "application/pdf"
    format = "pdf"
    charset = None
    render_style = "binary"

    def render(self, data, media_type=None, renderer_context=None):
        return data


@api_view(["GET"])
@permission_classes([IsAdminUser])
@renderer_classes([PDFRenderer])
def generate_reports_pdf_view(request):
    reports = Report.objects.select_related("user").order_by("-fecha")

    buffer = BytesIO()
    p = canvas.Canvas(buffer)

    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 800, "Reporte General – Smart Collector")
    p.setFont("Helvetica", 10)

    y = 770
    for r in reports:
        text = f"{r.fecha} — {r.user.username}: {r.detalle[:60]}..."
        p.drawString(50, y, text)
        y -= 20

        if y < 50:
            p.showPage()
            p.setFont("Helvetica", 10)
            y = 800

    p.save()
    buffer.seek(0)

    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="reporte_smart_collector.pdf"'
    return response


# ====================================
#   🚀 FUNCIÓN EXTRA 3 — ENVIAR MENSAJE (ADMIN)
# ====================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def send_message_view(request):
    if request.method == "GET":
        try:
            limit = int(request.query_params.get("limit", 50))
        except ValueError:
            limit = 50

        mensajes = (
            Notification.objects
            .select_related("usuario", "sender")
            .filter(deleted_globally=False)
            .order_by("-created_at")[:limit]
        )

        data = []
        for m in mensajes:
            usuario_obj = None
            if m.usuario:
                usuario_obj = {
                    "id": m.usuario.id,
                    "username": m.usuario.username,
                    "email": m.usuario.email
                }

            data.append({
                "id": m.id,
                "user_id": m.usuario.id if m.usuario else None,
                "username": m.usuario.username if m.usuario else None,
                "usuario": usuario_obj,
                "message": m.message,
                "estado": m.estado,
                "created_at": m.created_at,
                "sender": {
                    "id": m.sender.id,
                    "username": m.sender.username,
                    "email": m.sender.email
                } if m.sender else None,
            })

        return Response(data, status=200)

    user_id = request.data.get("user_id")
    message = request.data.get("message")

    if not message:
        return Response({"error": "message es obligatorio."}, status=400)

    message = str(message).strip()
    if not message:
        return Response({"error": "message no puede ir vacío."}, status=400)

    sender_user = request.user

    if user_id in [None, "", "all", "ALL", "todos", "TODOS"]:
        users = User.objects.filter(is_active=True)

        sent = 0
        for u in users:
            Notification.objects.create(
                usuario=u,
                sender=sender_user,
                message=message,
                estado="pendiente"
            )
            sent += 1

        return Response(
            {"message": "Mensaje enviado a todos correctamente.", "sent_to": sent},
            status=201
        )

    try:
        user = User.objects.get(id=int(user_id))
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({"error": "Usuario no encontrado."}, status=404)

    Notification.objects.create(
        usuario=user,
        sender=sender_user,
        message=message,
        estado="pendiente"
    )

    return Response({"message": "Mensaje enviado correctamente."}, status=201)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_message_delete_view(request, pk):
    n = get_object_or_404(Notification, pk=pk)

    n.deleted_globally = True
    if not n.deleted_at:
        n.deleted_at = timezone.now()
    n.save(update_fields=["deleted_globally", "deleted_at"])

    return Response({"message": "Mensaje eliminado globalmente."}, status=200)


# ======================================================
# ✅✅✅ ENDPOINT DE SALUD (HEALTH CHECK)
# ======================================================
@api_view(["GET"])
@permission_classes([AllowAny])
def health_view(request):
    return Response({
        "status": "ok",
        "service": "smart-collector-backend",
        "time": timezone.now().isoformat()
    }, status=200)