import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

# ======================================================
# BASE
# ======================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# ======================================================
# SECRET KEY
# ======================================================
SECRET_KEY = config("SECRET_KEY", default="django-insecure-local-key")

# ======================================================
# DEBUG (EN LOCAL DEBE SER TRUE)
# ✅ 1.1: Controlado por variable de entorno
# ======================================================
DEBUG = config("DEBUG", default=True, cast=bool)

# ======================================================
# ✅ 1.2 ALLOWED HOSTS (POR VARIABLE DE ENTORNO)
# ======================================================
allowed_hosts_raw = config("ALLOWED_HOSTS", default="127.0.0.1,localhost")
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_raw.split(",") if h.strip()]

# Producción (Render): agrega hosts extra para evitar DisallowedHost
IS_PRODUCTION = not DEBUG  # regla simple: si DEBUG=False => producción

if IS_PRODUCTION:
    # Permite cualquier subdominio de Render
    if ".onrender.com" not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(".onrender.com")

    # Si Render provee hostname externo, lo agregamos
    render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME")
    if render_host and render_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(render_host)

# ======================================================
# INSTALLED APPS
# ======================================================
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.sites",

    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # DRF + JWT
    "rest_framework",
    "rest_framework_simplejwt",

    # Allauth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",

    # Local app
    "core",
]

SITE_ID = 1

# ======================================================
# MIDDLEWARE
# ✅ 1.4: WhiteNoise para servir estáticos en producción
# ======================================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",

    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "smart_collector.urls"

# ======================================================
# TEMPLATES
# ======================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ======================================================
# ✅ 1.5 DATABASE (LOCAL + PRODUCCIÓN RENDER)
# - Local: usa postgres local (ssl=False)
# - Render: DATABASE_URL viene de Render y se exige ssl=True
# ======================================================
DATABASE_URL = config(
    "DATABASE_URL",
    default="postgres://postgres:postgres@localhost:5432/smart_collector_nahuala"
)

DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        ssl_require=IS_PRODUCTION,  # Render requiere SSL
    )
}

# ======================================================
# ✅ 1.3 CORS / CSRF (SEGURO PARA LOCAL + PRODUCCIÓN)
# ======================================================
CORS_ALLOW_CREDENTIALS = True

# ORIGINS permitidos por ENV (default local)
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000",
).split(",")
CORS_ALLOWED_ORIGINS = [o.strip() for o in CORS_ALLOWED_ORIGINS if o.strip()]

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000",
).split(",")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in CSRF_TRUSTED_ORIGINS if o.strip()]

# ✅ FIX PRODUCCIÓN: agregar dominios reales si no vienen en ENV
if IS_PRODUCTION:
    prod_frontends = [
        "https://smartcollectornahuala.com",
        "https://www.smartcollectornahuala.com",
    ]
    for origin in prod_frontends:
        if origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)
        if origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)

    # Para evitar problemas con CSRF/HTTPS en algunas rutas
    api_origin = "https://api.smartcollectornahuala.com"
    if api_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(api_origin)

# Headers permitidos (incluye Authorization para JWT)
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ======================================================
# ✅ 1.4 STATIC FILES (WhiteNoise)
# ======================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Evita warning si la carpeta no existe en algún entorno
_static_dir = BASE_DIR / "static"
if _static_dir.exists():
    STATICFILES_DIRS = [_static_dir]
else:
    STATICFILES_DIRS = []

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# ======================================================
# MEDIA FILES
# ======================================================
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ======================================================
# AUTH / JWT
# ======================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# ======================================================
# CUSTOM USER
# ======================================================
AUTH_USER_MODEL = "core.User"

# ======================================================
# GOOGLE LOGIN (DESACTIVADO EN LOCAL)
# ======================================================
GOOGLE_CLIENT_ID = ""

# ======================================================
# DEFAULT FIELD
# ======================================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ======================================================
# EMAIL (LOCAL - DESARROLLO)
# ======================================================
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "no-reply@smartcollector.local"