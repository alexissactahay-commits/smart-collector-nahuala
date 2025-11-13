import os
from decouple import config
from pathlib import Path
from datetime import timedelta
import dj_database_url

# Google OAuth
# NOTA: Asegúrate de que este ID sea el que tienes en Google Cloud
GOOGLE_CLIENT_ID = '954992204322-2ubdebhj8126lk22v2isa1lmjqv4hc1k.apps.googleusercontent.com'

BASE_DIR = Path(__file__).resolve().parent.parent

# 🔐 SECRET_KEY: ahora lee desde la variable de entorno 'SECRET_KEY'
SECRET_KEY = config('SECRET_KEY')

# ✅ Usuario personalizado
AUTH_USER_MODEL = 'core.User'

# 🚫 DEBUG = False en producción
DEBUG = config('DEBUG', default=False, cast=bool)

# 🌐 ALLOWED_HOSTS (Incluyendo el dominio de Render y el tuyo)
ALLOWED_HOSTS = [
    'smartcollectorolintepeque.com',
    'www.smartcollectorolintepeque.com',
    '.onrender.com',  # Acepta cualquier subdominio de Render (ej: smart-collector.onrender.com)
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
    # 📌 Render requiere WhiteNoise para archivos estáticos, agrégalo aquí:
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

# 🗃️ DATABASE
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    # (opcional) fallback para desarrollo local con SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# 🔒 Password validation
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

# 📁 Archivos estáticos
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# 📌 Configuración WhiteNoise para servir archivos estáticos eficientemente en Render
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 🆔 Clave primaria
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 🔄 CORS: ¡LA SOLUCIÓN A TU ERROR!
# Al usar la lista, le dices a Django: "Solo estos dominios son seguros y pueden llamarme."
CORS_ALLOWED_ORIGINS = [
    "https://www.smartcollectorolintepeque.com",
    "https://smartcollectorolintepeque.com",
    "http://localhost:3000", # Para pruebas locales del frontend
]

# 💡 Permitir métodos POST para tu API (ya que el login es un POST)
# Esto no es estrictamente necesario si solo usas el default, pero es buena práctica de seguridad
# y garantiza que no haya otra regla bloqueando.
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# 🔑 REST Framework + JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        # Considera cambiar a AllowAny para el login, si estás usando JWT
        'rest_framework.permissions.IsAuthenticated', 
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
}