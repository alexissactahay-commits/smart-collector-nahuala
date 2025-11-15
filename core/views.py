import requests
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import update_session_auth_hash
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# MODELOS
from .models import (
    Route, RoutePoint, Notification, Report, User,
    RouteDate, RouteSchedule, Vehicle
)

# SERIALIZERS
from .serializers import (
    RouteSerializer, NotificationSerializer, ReportSerializer,
    UserSerializer, RouteDateSerializer, RouteScheduleSerializer,
    VehicleSerializer
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
        routes = Route.objects.prefetch_related("points").order_by("day_of_week")
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = RouteSerializer(data=request.data)

        if serializer.is_valid():
            route = serializer.save()

            points = request.data.get("points", [])
            for p in points:
                RoutePoint.objects.create(
                    route=route,
                    latitude=p["latitude"],
                    longitude=p["longitude"],
                    order=p.get("order", 0),
                )

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

# =====================================================
#   🚀 ADMIN – FECHAS DE RUTAS (AddDate.js)
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_route_dates_view(request):

    if request.method == "GET":
        fechas = RouteDate.objects.select_related("route").order_by("date")
        data = [
            {
                "id": f.id,
                "date": f.date,
                "route": {
                    "id": f.route.id,
                    "name": f.route.name,
                    "day_of_week": f.route.day_of_week,
                }
            }
            for f in fechas
        ]
        return Response(data, status=200)

    if request.method == "POST":
        route_id = request.data.get("route_id")
        date = request.data.get("date")

        if not route_id or not date:
            return Response({"error": "route_id y date son obligatorios"}, status=400)

        try:
            route = Route.objects.get(id=route_id)
        except Route.DoesNotExist:
            return Response({"error": "Ruta no encontrada"}, status=404)

        nueva_fecha = RouteDate.objects.create(
            route=route,
            date=date
        )

        return Response({
            "message": "Fecha agregada correctamente",
            "id": nueva_fecha.id,
            "date": nueva_fecha.date,
            "route_id": route_id
        }, status=201)

# =====================================================
#   🚀 ADMIN – HORARIOS DE RUTAS (AddSchedule.js)
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_route_schedules_view(request):

    if request.method == "GET":
        horarios = RouteSchedule.objects.select_related("route").order_by("day_of_week", "start_time")

        data = [
            {
                "id": h.id,
                "day_of_week": h.day_of_week,
                "start_time": h.start_time,
                "end_time": h.end_time,
                "route": {
                    "id": h.route.id,
                    "name": h.route.name,
                    "day_of_week": h.route.day_of_week
                }
            }
            for h in horarios
        ]

        return Response(data, status=200)

    if request.method == "POST":
        route_id = request.data.get("route")
        day_of_week = request.data.get("day_of_week")
        start_time = request.data.get("start_time")
        end_time = request.data.get("end_time")

        if not route_id or not day_of_week or not start_time or not end_time:
            return Response({"error": "Todos los campos son obligatorios"}, status=400)

        try:
            route = Route.objects.get(id=route_id)
        except Route.DoesNotExist:
            return Response({"error": "Ruta no encontrada"}, status=404)

        nuevo = RouteSchedule.objects.create(
            route=route,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time
        )

        return Response({
            "message": "Horario agregado correctamente",
            "id": nuevo.id
        }, status=201)


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
#   CIUDADANO – RUTAS
# ====================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_routes_view(request):
    routes = Route.objects.prefetch_related("points").all()
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data)


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

    mensajes = Notification.objects.filter(usuario=user).order_by("-created_at")

    data = [
        {
            "id": m.id,
            "message": m.message,
            "estado": m.estado,
            "created_at": m.created_at,
        }
        for m in mensajes
    ]

    return Response(data, status=200)


# ====================================
#   🚀 FUNCIÓN EXTRA PARA RENDER — GENERAR REPORTES
# ====================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def generate_reports_view(request):
    """
    Esta función existe para evitar errores en Render.
    Retorna todos los reportes generados en el sistema.
    """
    reports = Report.objects.select_related("user").order_by("-fecha")
    serializer = ReportSerializer(reports, many=True)
    return Response({
        "message": "Reporte general generado correctamente.",
        "total": len(serializer.data),
        "reports": serializer.data
    }, status=200)


