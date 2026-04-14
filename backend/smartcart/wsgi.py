"""
WSGI config for SmartCart project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartcart.settings')

application = get_wsgi_application()
