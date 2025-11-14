import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# =======================================
# 🔐 SECRET KEY
# =======================================
SECRET_KEY = config("SECRET_KEY")

# =======================================
# 🚀 DEBUG
# =======================================
DEBUG = config("DEBUG", default=False, cast=bool)

# =======================================
# 🌐 ALLOWED HOSTS
# =======================================
ALLOWED_HOSTS = [
    "smartcollectorolintepeque.com",
    "www.smartcollectorolintepeque.com",
    ".onrender.com",
]

# =======================================
# 📦 INSTALLED APPS
# =======================================
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.sites",

    # Allauth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",

    # Django Apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # DRF + JWT
    "rest_framework",
    "rest_framework_simplejwt",

    # Custom App
    "core",
]

# =======================================
# 🔧 MIDDLEWARE
# =======================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    # requerido por allauth
    "allauth.account.middleware.AccountMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "smart_collector.urls"

# =======================================
# 🎨 TEMPLATES (OBLIGATORIO para Admin + Allauth)
# =======================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # carpeta opcional
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",  # requerido por allauth
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# =======================================
# 🗃 DATABASE
# =======================================
DATABASES = {
    "default": dj_database_url.parse(
        config("DATABASE_URL"),
        conn_max_age=600,
        ssl_require=True
    )
}

# =======================================
# 🌎 CORS + CSRF
# =======================================
CORS_ALLOWED_ORIGINS = [
    "https://smartcollectorolintepeque.com",
    "https://www.smartcollectorolintepeque.com",
]

CSRF_TRUSTED_ORIGINS = [
    "https://smartcollectorolintepeque.com",
    "https://www.smartcollectorolintepeque.com",
    "https://*.onrender.com",
]

CORS_ALLOW_CREDENTIALS = True

# =======================================
# 📁 STATIC FILES
# =======================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# =======================================
# 📸 MEDIA FILES (FOTOS DE PERFIL)
# =======================================
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Para servir media en desarrollo
if DEBUG:
    from django.conf.urls.static import static
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# =======================================
# 🔑 JWT
# =======================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# =======================================
# 🔐 CUSTOM USER MODEL
# =======================================
AUTH_USER_MODEL = "core.User"

# =======================================
# 🔐 GOOGLE LOGIN
# =======================================
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID")

# =======================================
# AUTO FIELD
# =======================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Force Render to rebuild migrations