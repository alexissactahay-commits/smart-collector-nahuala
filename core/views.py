import requests
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.contrib.auth import update_session_auth_hash
from google.auth import exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date
from urllib.parse import urljoin
from django.utils import timezone

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

# PDF
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch


# =======================
#    LOGIN Y REGISTRO
# =======================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['user_id'] = user.id
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    if not identifier or not password:
        return JsonResponse({'error': 'Todos los campos son obligatorios'}, status=400)

    user = None
    try:
        user = User.objects.get(email__iexact=identifier)
    except User.DoesNotExist:
        try:
            user = User.objects.get(username__iexact=identifier)
        except User.DoesNotExist:
            pass

    if user and user.check_password(password):
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'username': user.username,
            'user_id': user.id
        })
    else:
        return JsonResponse({'error': 'Credenciales inválidas'}, status=401)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'ciudadano')

    if not username or not email or not password:
        return Response({'error': 'Todos los campos son obligatorios.'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'El correo electrónico ya está registrado.'}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role
    )

    if role == 'admin':
        user.is_staff = True
        user.is_superuser = True
        user.save()

    return Response({
        'message': 'Usuario registrado correctamente.',
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not user.check_password(old_password):
        return Response({'error': 'La contraseña actual es incorrecta.'}, status=400)

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)
    return Response({'message': 'Contraseña actualizada correctamente.'})


# =======================
#   RECUPERAR CONTRASEÑA
# =======================

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'El correo electrónico es obligatorio.'}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'message': 'Si el correo está registrado, recibirás instrucciones.'})

    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    host = request.get_host()
    if 'localhost' in host:
        base_url = 'http://localhost:3000'
    else:
        base_url = 'https://smartcollectorolintepeque.com'

    reset_url = f"{base_url}/reset-password/{uidb64}/{token}/"

    subject = "Restablecimiento de contraseña - Smart Collector"
    message = render_to_string('password_reset_email.html', {
        'user': user,
        'reset_url': reset_url,
    })
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    return Response({'message': 'Si el correo existe, recibirás instrucciones.'})


# =======================
#   GOOGLE LOGIN
# =======================

from google.auth import exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    token = request.data.get('token')
    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), getattr(settings, 'GOOGLE_CLIENT_ID', '')
        )
        email = idinfo['email']
        username = idinfo.get('name', email.split('@')[0])

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': username, 'role': 'ciudadano'}
        )
        if created:
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'username': user.username,
            'user_id': user.id
        })
    except Exception:
        return JsonResponse({'error': 'Token de Google inválido'}, status=400)


# ===========================
#   C) VEHICLE ENDPOINTS
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vehicle_detail(request, vehicle_id):
    """Obtener ubicación del camión (todos los usuarios autenticados)."""
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehículo no encontrado.'}, status=404)

    serializer = VehicleSerializer(vehicle)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def vehicle_update(request, vehicle_id):
    """Actualizar ubicación del camión (solo recolector)."""

    if request.user.role != "recolector":
        return Response({'error': 'Solo recolectores pueden actualizar.'}, status=403)

    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehículo no encontrado.'}, status=404)

    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')

    if latitude is None or longitude is None:
        return Response({'error': 'Latitud y longitud requeridas.'}, status=400)

    vehicle.latitude = latitude
    vehicle.longitude = longitude
    vehicle.last_update = timezone.now()
    vehicle.save()

    return Response({'message': 'Ubicación actualizada correctamente.'})


# ============================================================
#   🔥🔥🔥 TODO EL RESTO DE TU CÓDIGO ORIGINAL SIGUE AQUÍ ↓↓↓
# ============================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_view(request):
    users = User.objects.all().values('id', 'username', 'email', 'role', 'is_active')
    return Response(list(users))


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_reports_view(request):
    reports = Report.objects.select_related('user').all()
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_report_detail_view(request, pk):
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return Response({'error': 'Reporte no encontrado.'})

    new_status = request.data.get('status')
    valid = ['pending', 'resolved', 'unresolved']

    if new_status not in valid:
        return Response({'error': 'Estado inválido.'})

    report.status = new_status
    report.save()
    return Response({'message': 'Reporte actualizado.'})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def generate_reports_view(request):
    completed = Route.objects.filter(completed=True).count()
    pending = Route.objects.filter(completed=False).count()
    total = Report.objects.count()

    return Response({
        'completed_routes': completed,
        'pending_routes': pending,
        'total_reports': total,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_routes_view(request):
    if request.method == 'GET':
        routes = Route.objects.prefetch_related('points').order_by('day_of_week')
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = RouteSerializer(data=request.data)
        if serializer.is_valid():
            route = serializer.save()

            points = request.data.get('points', [])
            for p in points:
                RoutePoint.objects.create(
                    route=route,
                    latitude=p['latitude'],
                    longitude=p['longitude'],
                    order=p.get('order', 0)
                )
            return Response(serializer.data)
        return Response(serializer.errors)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_routes_view(request):
    routes = Route.objects.prefetch_related('points').all()
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data)


# =====================
#  VISTAS DE SISTEMA
# =====================

def home_view(request):
    return HttpResponse("¡Bienvenido a Smart Collector! Esta es la página de inicio.")


def dashboard_view(request):
    return HttpResponse(status=200)
