# core/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Permite autenticar usando email o username.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            return None

        # Si el 'username' contiene '@', lo tratamos como email
        if '@' in username:
            kwargs = {'email': username}
        else:
            kwargs = {'username': username}

        try:
            # Buscamos al usuario por email o username
            user = User.objects.get(**kwargs)
            # Verificamos la contraseña
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None