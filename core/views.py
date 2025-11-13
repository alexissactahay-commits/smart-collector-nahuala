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
from django.utils.http import urljoin
from django.utils import timezone
from .models import Route, RoutePoint, Notification, Report, User, RouteDate, RouteSchedule
from .serializers import RouteSerializer, NotificationSerializer, ReportSerializer, UserSerializer, RouteDateSerializer, RouteScheduleSerializer
# 👇 NUEVO: Importaciones para PDF
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch

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

# 👇 NUEVA VISTA: Recuperación de contraseña — ✅ CORREGIDA
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'El correo electrónico es obligatorio.'}, status=400)
    
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'message': 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'})

    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    # ✅ Usa la URL de la petición entrante si existe, sino usa tu dominio
    host = request.get_host()
    if 'localhost' in host:
        base_url = 'http://localhost:3000'
    else:
        base_url = 'https://smartcollectorolintepeque.com'  # o 'https://smart-collector.onrender.com'
    
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
    return Response({'message': 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'})

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
    except (ValueError, exceptions.GoogleAuthError):
        return JsonResponse({'error': 'Token de Google inválido'}, status=400)

# 👇 MODIFICADO: facebook_login ahora usa datos reales de Facebook
@api_view(['POST'])
@permission_classes([AllowAny])
def facebook_login(request):
    access_token = request.data.get('access_token')
    if not access_token:
        return JsonResponse({'error': 'Token de acceso requerido.'}, status=400)

    try:
        user_info_url = f'https://graph.facebook.com/v20.0/me?fields=id,name,email&access_token={access_token}'
        user_info_response = requests.get(user_info_url)
        user_info = user_info_response.json()

        if 'error' in user_info:
            return JsonResponse({'error': 'Error al obtener datos de Facebook.'}, status=400)

        email = user_info.get('email')
        name = user_info.get('name', 'Facebook User')

        if not email:
            email = f"fb_{user_info['id']}@facebook.com"

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': name.split()[0] if name else 'facebook_user',
                'role': 'ciudadano'
            }
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
    except Exception as e:
        return JsonResponse({'error': 'Error al autenticar con Facebook.'}, status=400)

@api_view(['GET', 'PUT'])
@permission_classes([IsAdminUser])
def admin_users_view(request):
    if request.method == 'GET':
        users = User.objects.all().values('id', 'username', 'email', 'role', 'is_active')
        return Response(list(users))
    elif request.method == 'PUT':
        user_id = request.data.get('id')
        new_role = request.data.get('role')
        is_active = request.data.get('is_active')
        if not user_id:
            return Response({'error': 'ID de usuario requerido.'}, status=400)
        try:
            user = User.objects.get(id=user_id)
            if new_role in ['admin', 'ciudadano']:
                user.role = new_role
                if new_role == 'admin':
                    user.is_staff = True
                    user.is_superuser = True
                else:
                    user.is_staff = False
                    user.is_superuser = False
            if is_active is not None:
                user.is_active = is_active
            user.save()
            return Response({'status': 'success', 'message': 'Usuario actualizado correctamente.'})
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=404)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_reports_view(request):
    reports = Report.objects.select_related('user').all()
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_report_detail_view(request, pk):
    """
    Editar (PUT) el estado de un reporte específico por su ID.
    """
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return Response({'error': 'Reporte no encontrado.'}, status=404)
    if request.method == 'PUT':
        new_status = request.data.get('status')
        valid_statuses = ['pending', 'resolved', 'unresolved']
        if new_status not in valid_statuses:
            return Response({'error': f'Estado inválido. Debe ser uno de: {", ".join(valid_statuses)}.'}, status=400)
        report.status = new_status
        report.save()
        return Response({
            'status': 'success',
            'message': f'Reporte actualizado a "{new_status}"',
            'report': {
                'id': report.id,
                'tipo': report.tipo,
                'detalle': report.detalle,
                'fecha': report.fecha.isoformat(),
                'user': report.user.username,
                'admin': report.admin.username if report.admin else None,
                'status': report.status
            }
        })

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_report_status(request, report_id):
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        return Response({'error': 'Reporte no encontrado.'}, status=404)

    new_status = request.data.get('status')
    valid_statuses = ['pending', 'resolved', 'unresolved']

    if new_status not in valid_statuses:
        return Response({'error': f'Estado inválido. Debe ser uno de: {", ".join(valid_statuses)}.'}, status=400)

    report.status = new_status
    report.save()

    return Response({'status': 'success', 'message': f'Reporte actualizado a "{new_status}".'})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def generate_reports_view(request):
    completed_routes = Route.objects.filter(completed=True).count()
    pending_routes = Route.objects.filter(completed=False).count()
    total_reports = Report.objects.count()
    resolved_reports = Report.objects.filter(status='resolved').count()
    unresolved_reports = Report.objects.filter(status='unresolved').count()
    pending_reports = Report.objects.filter(status='pending').count()
    first_report = Report.objects.order_by('fecha').first()
    days_since_first_report = 0
    if first_report:
        today = date.today()
        days_since_first_report = (today - first_report.fecha.date()).days
    power_bi_link = "https://app.powerbi.com/groups/me/reports/TU-REPORT-ID"
    pdf_download_url = f"{request.build_absolute_uri('/api/admin/reports/generate-pdf/')}"
    data = {
        "completed_routes": completed_routes,
        "pending_routes": pending_routes,
        "total_reports": total_reports,
        "resolved_reports": resolved_reports,
        "unresolved_reports": unresolved_reports,
        "pending_reports": pending_reports,
        "days_since_first_report": days_since_first_report,
        "power_bi_link": power_bi_link,
        "pdf_download_url": pdf_download_url,
    }
    return Response(data)

# 👇 NUEVA VISTA: Generar PDF de informes
@api_view(['GET'])
@permission_classes([IsAdminUser])
def generate_pdf_report(request):
    completed_routes = Route.objects.filter(completed=True).count()
    pending_routes = Route.objects.filter(completed=False).count()
    total_reports = Report.objects.count()
    resolved_reports = Report.objects.filter(status='resolved').count()
    unresolved_reports = Report.objects.filter(status='unresolved').count()
    pending_reports = Report.objects.filter(status='pending').count()
    first_report = Report.objects.order_by('fecha').first()
    days_since_first_report = 0
    if first_report:
        today = date.today()
        days_since_first_report = (today - first_report.fecha.date()).days

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    p.setFont("Helvetica-Bold", 16)
    p.drawString(1 * inch, height - 1 * inch, "Informe de Gestión - Smart Collector")
    p.setFont("Helvetica", 12)
    y = height - 1.5 * inch
    p.drawString(1 * inch, y, f"Rutas Completadas: {completed_routes}")
    y -= 0.3 * inch
    p.drawString(1 * inch, y, f"Rutas Pendientes: {pending_routes}")
    y -= 0.3 * inch
    p.drawString(1 * inch, y, f"Reportes Recibidos: {total_reports}")
    y -= 0.3 * inch
    p.drawString(1 * inch, y, f"Reportes Resueltos: {resolved_reports}")
    y -= 0.3 * inch
    p.drawString(1 * inch, y, f"Reportes No Resueltos: {unresolved_reports + pending_reports}")
    y -= 0.3 * inch
    p.drawString(1 * inch, y, f"Días desde primer reporte: {days_since_first_report} días")
    p.showPage()
    p.save()
    pdf = buffer.getvalue()
    buffer.close()
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="informe_smart_collector.pdf"'
    return response

# ========== VISTAS PARA PUNTOS DE RECOLECCIÓN ==========
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_routes_view(request):
    if request.method == 'GET':
        routes = Route.objects.prefetch_related('points').order_by('day_of_week', 'start_time')
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = RouteSerializer(data=request.data)
        if serializer.is_valid():
            route = serializer.save()
            points_data = request.data.get('points', [])
            for point in points_data:
                RoutePoint.objects.create(
                    route=route,
                    latitude=point.get('latitude'),
                    longitude=point.get('longitude'),
                    order=point.get('order', 0)
                )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def mark_route_completed_view(request, route_id):
    try:
        route = Route.objects.get(id=route_id)
        route.completed = True
        route.save()
        return Response({'status': 'success', 'message': 'Ruta marcada como completada.'})
    except Route.DoesNotExist:
        return Response({'error': 'Ruta no encontrada.'}, status=404)

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def send_message_view(request):
    if request.method == 'GET':
        notifications = Notification.objects.filter(sender=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        message = request.data.get('message')
        user_id = request.data.get('user_id')
        if not message or len(message.strip()) == 0:
            return Response({'error': 'El mensaje no puede estar vacío.'}, status=400)
        try:
            if user_id:
                recipient = User.objects.get(id=user_id)
                Notification.objects.create(
                    message=message.strip(),
                    usuario=recipient,
                    sender=request.user,
                    estado='enviada'
                )
                return Response({'status': 'success', 'message': f'Mensaje enviado a {recipient.username}.'})
            else:
                all_users = User.objects.all()
                for user in all_users:
                    Notification.objects.create(
                        message=message.strip(),
                        usuario=user,
                        sender=request.user,
                        estado='enviada'
                    )
                return Response({'status': 'success', 'message': 'Mensaje enviado a todos los usuarios.'})
        except User.DoesNotExist:
            return Response({'error': 'Usuario destinatario no encontrado.'}, status=404)

# ========== VISTAS PARA CIUDADANOS ==========

# 👇 NUEVA VISTA: Calendario del ciudadano
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_calendar_view(request):
    """
    Devuelve todas las fechas de rutas programadas (RouteDate) para que el ciudadano las vea en su calendario.
    """
    route_dates = RouteDate.objects.select_related('route').all().order_by('date')
    serializer = RouteDateSerializer(route_dates, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications_view(request):
    notifications = Notification.objects.filter(
        usuario=request.user,
        sender__role='admin'
    ).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_reports_view(request):
    if request.method == 'GET':
        reports = Report.objects.filter(user=request.user).order_by('-fecha')
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = ReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_routes_view(request):
    routes = Route.objects.prefetch_related('points').order_by('day_of_week', 'start_time')
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data)

# 👇 NUEVA VISTA: Rutas por día específico
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_routes_by_day_view(request):
    """
    Devuelve las rutas del ciudadano filtradas por día de la semana.
    Ejemplo: /api/my-routes/day/?day=Lunes
    """
    day = request.query_params.get('day', None)
    if not day:
        return Response({'error': 'Debe especificar un día (Lunes, Martes, etc.).'}, status=400)
    
    # Validar que el día sea válido
    valid_days = [choice[0] for choice in Route.DIA_SEMANA]
    if day not in valid_days:
        return Response({'error': f'Día inválido. Debe ser uno de: {", ".join(valid_days)}.'}, status=400)

    routes = Route.objects.filter(day_of_week=day).prefetch_related('points').order_by('start_time')
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data)

# ========== NUEVAS VISTAS: AGREGAR FECHA Y AGREGAR HORARIO ==========
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_route_dates_view(request):
    if request.method == 'GET':
        dates = RouteDate.objects.select_related('route').all()
        serializer = RouteDateSerializer(dates, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = RouteDateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_route_date_detail_view(request, pk):
    try:
        route_date = RouteDate.objects.get(pk=pk)
    except RouteDate.DoesNotExist:
        return Response({'error': 'Fecha de ruta no encontrada.'}, status=404)
    if request.method == 'PUT':
        serializer = RouteDateSerializer(route_date, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        route_date.delete()
        return Response({'status': 'success', 'message': 'Fecha de ruta eliminada.'})

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_route_schedules_view(request):
    if request.method == 'GET':
        schedules = RouteSchedule.objects.select_related('route').all()
        serializer = RouteScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = RouteScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_route_schedule_detail_view(request, pk):
    try:
        route_schedule = RouteSchedule.objects.get(pk=pk)
    except RouteSchedule.DoesNotExist:
        return Response({'error': 'Horario de ruta no encontrado.'}, status=404)
    if request.method == 'PUT':
        serializer = RouteScheduleSerializer(route_schedule, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        route_schedule.delete()
        return Response({'status': 'success', 'message': 'Horario de ruta eliminado.'})

# ========== VISTAS PARA EDITAR Y ELIMINAR RUTAS ==========
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_route_detail_view(request, pk):
    """
    Editar (PUT) o eliminar (DELETE) una ruta específica por su ID.
    """
    try:
        route = Route.objects.get(pk=pk)
    except Route.DoesNotExist:
        return Response({'error': 'Ruta no encontrada.'}, status=404)
    
    if request.method == 'PUT':
        serializer = RouteSerializer(route, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        route.delete()
        return Response({'status': 'success', 'message': 'Ruta eliminada correctamente.'}, status=204)

# ========== ViewSets ==========
class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

def home_view(request):
    return HttpResponse("¡Bienvenido a Smart Collector! Esta es la página de inicio.")

def dashboard_view(request):
    return HttpResponse(status=200)