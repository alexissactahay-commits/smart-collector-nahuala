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
# 🚀 DEBUG (Render = False)
# =======================================
DEBUG = config("DEBUG", default=False, cast=bool)

# =======================================
# 🌐 ALLOWED HOSTS
# =======================================
ALLOWED_HOSTS = [
    "smartcollectorolintepeque.com",
    "www.smartcollectorolintepeque.com",
    ".onrender.com"
]

# =======================================
# 📦 INSTALLED APPS
# =======================================
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
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
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "smart_collector.urls"

# =======================================
# 🗃 DATABASE (Render PostgreSQL)
# =======================================
DATABASES = {
    "default": dj_database_url.parse(
        config("DATABASE_URL"),
        conn_max_age=600,
        ssl_require=True
    )
}

# =======================================
# 🌎 CORS & CSRF
# =======================================
CORS_ALLOWED_ORIGINS = [
    "https://www.smartcollectorolintepeque.com",
    "https://smartcollectorolintepeque.com",
]

CSRF_TRUSTED_ORIGINS = [
    "https://smartcollectorolintepeque.com",
    "https://www.smartcollectorolintepeque.com",
    "https://*.onrender.com",
]

CORS_ALLOW_CREDENTIALS = True

# =======================================
# 📁 STATIC FILES (Render + Whitenoise)
# =======================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

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
# 🔐 GOOGLE LOGIN
# =======================================
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID")

# =======================================
# AUTO FIELD
# =======================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


