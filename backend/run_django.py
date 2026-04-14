#!/usr/bin/env python
"""
Simple script to run the Django development server.
"""
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartcart.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    print("\n  🛒  SmartCart Django API running at http://localhost:5000\n")
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:5000'])
