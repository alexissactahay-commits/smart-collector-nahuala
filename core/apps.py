from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Este método se ejecuta automáticamente cuando la app 'core' inicia.
        Aquí verificamos si ya existe el usuario admin; si no, lo creamos.
        """
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(username="admin").exists():
                User.objects.create_superuser(
                    username="admin",
                    email="jsactahay@gmail.com",
                    password="admin123"
                )
                print("✅ Superusuario 'admin' creado automáticamente.")
            else:
                print("⚠️ El usuario 'admin' ya existe, no se creó otro.")
        except Exception as e:
            print(f"❌ Error creando el superusuario: {e}")
