"""
Firebase authentication for Django REST Framework.
"""
from rest_framework import authentication, exceptions
from firebase_admin import auth as firebase_auth
import firebase_admin


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class that verifies Firebase ID tokens.
    """
    
    def authenticate(self, request):
        """
        Authenticate the request using Firebase ID token.
        Returns (user_dict, token) if successful, None otherwise.
        """
        # Skip auth if Firebase not initialized with credentials (dev mode)
        if not firebase_admin._apps:
            return ({'uid': 'dev-user'}, None)
        
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        id_token = auth_header.split('Bearer ')[1]
        
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            return (decoded_token, id_token)
        except Exception as e:
            raise exceptions.AuthenticationFailed('Invalid or expired token')
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate
        header in a 401 Unauthenticated response.
        """
        return 'Bearer'
