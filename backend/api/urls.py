"""
URL routing for SmartCart API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Session
    path('session/start', views.session_start, name='session_start'),
    path('session/<str:session_id>', views.session_get, name='session_get'),
    
    # Scanning
    path('scan', views.scan_barcode, name='scan_barcode'),
    
    # Cart
    path('cart/<str:session_id>', views.cart_get, name='cart_get'),
    path('cart/<str:session_id>/item', views.cart_update_item, name='cart_update_item'),
    path('cart/<str:session_id>/item/<str:barcode>', views.cart_remove_item, name='cart_remove_item'),
    
    # Payment & QR
    path('generate-qr', views.generate_qr, name='generate_qr'),
    path('order-status/<str:session_id>', views.order_status, name='order_status'),
    
    # Guard
    path('guard/verify', views.guard_verify, name='guard_verify'),
    
    # Health & Stores
    path('stores', views.list_stores, name='list_stores'),
    path('health', views.health, name='health'),
]
