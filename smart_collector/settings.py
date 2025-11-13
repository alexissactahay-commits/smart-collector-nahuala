import os
from pathlib import Path
from datetime import timedelta

# BASE_DIR: ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# 🔐 SECRET_KEY: clave secreta (puedes dejar una fija en local)
SECRET_KEY = os.getenv('SECRET_KEY', 'clave-super-secreta-smart-collector')

# ✅ Usuario personalizado
AUTH_USER_MODEL = 'core.User'

# 🚫 DEBUG: debe ser False en producción
DEBUG = False

# 🌐 ALLOWED_HOSTS (Incluyendo Render y tu dominio)
ALLOWED_HOSTS = [
    'smartcollectorolintepeque.com',
    'www.smartcollectorolintepeque.com',
    'smart-collector.onrender.com',   # 👈 backend en Render
    '.onrender.com',
    'localhost',
    '127.0.0.1',
]

# 👇 django-allauth
SITE_ID = 1

INSTALLED_APPS = [
    # 📌 CORS debe estar instalado
    'corsheaders',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework_simplejwt',
    'rest_framework',
    'core',
]

MIDDLEWARE = [
    # 📌 CORS MIDDLEWARE DEBE IR LO MÁS ARRIBA POSIBLE
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # 📌 Render requiere WhiteNoise para archivos estáticos
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'smart_collector.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'core' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smart_collector.wsgi.application'

# 🗃️ CONFIGURACIÓN DIRECTA DE BASE DE DATOS (Render PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'smart_collector_db',
        'USER': 'smart_collector_user',
        'PASSWORD': 'dmthdP2VHZKHEBK0w0sqLd2XmqC5ZcTj',
        'HOST': 'dpg-d49j9p8gjchc73fe8m2g-a.oregon-postgres.render.com',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# 🔒 Validación de contraseñas
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# 🌍 Internacionalización
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Guatemala'
USE_I18N = True
USE_TZ = True

# 📁 Archivos estáticos (WhiteNoise)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 🆔 Clave primaria
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 🌐 CSRF_TRUSTED_ORIGINS (necesario para Render y tu dominio)
CSRF_TRUSTED_ORIGINS = [
    'https://www.smartcollectorolintepeque.com',
    'https://smartcollectorolintepeque.com',
    'https://smart-collector.onrender.com',
    'https://*.onrender.com',
]

# 🔄 CORS: configuración completa
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    "https://www.smartcollectorolintepeque.com",
    "https://smartcollectorolintepeque.com",
    "https://smart-collector.onrender.com",  # 👈 backend Render
    "http://localhost:3000",                 # para pruebas locales
]

CORS_ALLOW_CREDENTIALS = True

# Métodos permitidos
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Cabeceras permitidas
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "x-csrftoken",
    "user-agent",
]

# Cabeceras que el navegador puede leer
CORS_EXPOSE_HEADERS = [
    "Content-Type",
    "X-CSRFToken",
]

# 🔑 REST Framework + JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# 🔧 Google OAuth (si lo usas)
GOOGLE_CLIENT_ID = '954992204322-2ubdebhj8126lk22v2isa1lmjqv4hc1k.apps.googleusercontent.com'
