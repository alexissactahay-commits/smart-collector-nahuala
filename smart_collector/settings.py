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
# ======================================================
DEBUG = True

# ======================================================
# ALLOWED HOSTS
# ======================================================
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]

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
# ======================================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",

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
# DATABASE (LOCAL POSTGRES)
# ======================================================
DATABASES = {
    "default": dj_database_url.parse(
        config(
            "DATABASE_URL",
            default="postgres://postgres:postgres@localhost:5432/smart_collector_nahuala"
        ),
        conn_max_age=600,
        ssl_require=False,
    )
}

# ======================================================
# CORS / CSRF (CLAVE PARA REACT)
# ======================================================
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ======================================================
# STATIC FILES
# ======================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

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
# ✅ NO intenta conectarse a SMTP, imprime el correo en consola
# ======================================================
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "no-reply@smartcollector.local"