"""
Firebase Admin SDK initialization.
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings

_db = None
_initialized = False


def initialize_firebase():
    """Initialize Firebase Admin SDK once."""
    global _db, _initialized
    
    if _initialized:
        return _db
    
    cred_path = settings.FIREBASE_CREDENTIALS
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _db = firestore.client()
        print("✅  Firebase Admin SDK initialized with credentials.")
    else:
        print("⚠  FIREBASE_CREDENTIALS not set — token verification is disabled (dev mode only)")
        firebase_admin.initialize_app()
        _db = None
    
    _initialized = True
    return _db


def get_firestore_client():
    """Get the Firestore client instance."""
    global _db
    if not _initialized:
        initialize_firebase()
    return _db
