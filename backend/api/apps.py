from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Initialize Firebase Admin SDK when Django starts."""
        from . import firebase_init
        firebase_init.initialize_firebase()
