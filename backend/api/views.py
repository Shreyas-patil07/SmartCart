"""
Django REST Framework views for SmartCart API.
"""
import uuid
from datetime import datetime, timezone

from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response
from rest_framework import status

from .authentication import FirebaseAuthentication
from .storage import sessions_db, orders_db
from .products import get_product, PRODUCTS
from .stores import STORES, STORE_IDS


# ═══════════════════════════════════════════════════════════════════════════════
# SESSION
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@authentication_classes([FirebaseAuthentication])
def session_start(request):
    """Start a new shopping session."""
    store_id = request.data.get("storeId", "city-supermarket-downtown")
    
    if store_id not in STORE_IDS:
        return Response(
            {"error": f"Unknown store: {store_id}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    sid = f"SC-{uuid.uuid4().hex[:6].upper()}"
    sessions_db[sid] = {
        "storeId": store_id,
        "userId": request.user["uid"],
        "items": [],
        "status": "active",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    return Response(
        {"sessionId": sid, "status": "active"}, 
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@authentication_classes([FirebaseAuthentication])
def session_get(request, session_id):
    """Get session details."""
    s = sessions_db.get(session_id)
    if not s:
        return Response(
            {"error": "Session not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    return Response({"sessionId": session_id, **s})


# ═══════════════════════════════════════════════════════════════════════════════
# SCANNING
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@authentication_classes([FirebaseAuthentication])
def scan_barcode(request):
    """Scan a product barcode."""
    barcode = request.data.get("barcode", "")
    product = get_product(barcode)
    if not product:
        return Response(
            {"error": "Product not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    return Response({"barcode": barcode, **product})


# ═══════════════════════════════════════════════════════════════════════════════
# CART
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@authentication_classes([FirebaseAuthentication])
def cart_get(request, session_id):
    """Get cart items for a session."""
    s = sessions_db.get(session_id)
    if not s:
        return Response(
            {"error": "Session not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    return Response({"sessionId": session_id, "items": s["items"]})


@api_view(['PATCH'])
@authentication_classes([FirebaseAuthentication])
def cart_update_item(request, session_id):
    """Update or add an item to the cart."""
    s = sessions_db.get(session_id)
    if not s:
        return Response(
            {"error": "Session not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    barcode = request.data.get("barcode", request.data.get("itemId", ""))
    qty = request.data.get("qty", 1)
    
    # Check if item already exists
    for item in s["items"]:
        if item["barcode"] == barcode:
            item["qty"] = qty
            return Response({"message": "Updated", "item": item})
    
    # Add new item
    product = PRODUCTS.get(barcode)
    if not product:
        return Response(
            {"error": "Product not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_item = {"barcode": barcode, "qty": qty, **product}
    s["items"].append(new_item)
    return Response(
        {"message": "Added", "item": new_item}, 
        status=status.HTTP_201_CREATED
    )


@api_view(['DELETE'])
@authentication_classes([FirebaseAuthentication])
def cart_remove_item(request, session_id, barcode):
    """Remove an item from the cart."""
    s = sessions_db.get(session_id)
    if not s:
        return Response(
            {"error": "Session not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    s["items"] = [i for i in s["items"] if i["barcode"] != barcode]
    return Response({"message": "Removed"})


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT & QR
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@authentication_classes([FirebaseAuthentication])
def generate_qr(request):
    """Generate QR code for payment."""
    sid = request.data.get("sessionId", "")
    s = sessions_db.get(sid, {})
    
    items = s.get("items", [])
    total = sum(i.get("price", 0) * i.get("qty", 1) for i in items)
    qr_code = f"SMARTCART-{uuid.uuid4().hex[:12].upper()}"
    
    orders_db[sid] = {
        "items": items,
        "total": total,
        "paymentMethod": request.data.get("paymentMethod", "upi"),
        "qrCode": qr_code,
        "paidAt": datetime.now(timezone.utc).isoformat(),
        "status": "paid",
    }
    
    if sid in sessions_db:
        sessions_db[sid]["status"] = "completed"
    
    return Response({"qrCode": qr_code, "total": total, "status": "paid"})


@api_view(['GET'])
@authentication_classes([FirebaseAuthentication])
def order_status(request, session_id):
    """Get order status."""
    order = orders_db.get(session_id)
    if not order:
        return Response(
            {"status": "not_found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    return Response({"sessionId": session_id, **order})


# ═══════════════════════════════════════════════════════════════════════════════
# GUARD (public — guard devices don't have user accounts)
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
def guard_verify(request):
    """Verify QR code at store exit (public endpoint)."""
    qr_code = request.data.get("qrCode", "")
    
    for sid, order in orders_db.items():
        if order.get("qrCode") == qr_code:
            return Response({
                "valid": True,
                "sessionId": sid,
                "total": order["total"],
                "itemCount": len(order["items"]),
                "paidAt": order["paidAt"],
                "status": order["status"],
            })
    
    return Response(
        {"valid": False, "error": "Invalid QR code"}, 
        status=status.HTTP_404_NOT_FOUND
    )


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH & STORES
# ═══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
def list_stores(request):
    """Return all available stores (public endpoint)."""
    return Response({"stores": STORES})


@api_view(['GET'])
def health(request):
    """Health check endpoint."""
    return Response({"status": "ok", "service": "smartcart-api"})
