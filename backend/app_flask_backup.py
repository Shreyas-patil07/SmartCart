"""
SmartCart Backend — Flask API
Auth is now handled entirely by Firebase on the frontend.
This backend verifies Firebase ID tokens on protected routes.
"""

import os
import uuid
from datetime import datetime, timezone
from functools import wraps

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, firestore
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")

def _cors_origins():
    base = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        r"https://.*\.ngrok-free\.app",
        r"https://.*\.ngrok\.io",
    ]
    # Accept a single URL or comma-separated URLs via FRONTEND_URL.
    extra = [u.strip() for u in os.getenv("FRONTEND_URL", "").split(",") if u.strip()]
    return base + extra

CORS(app, origins=_cors_origins())

# ─── Firebase Admin SDK ────────────────────────────────────────────────────────
# Set FIREBASE_CREDENTIALS env var to the path of your service account JSON file.
# Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key

_cred_path = os.getenv("FIREBASE_CREDENTIALS")
if _cred_path and os.path.exists(_cred_path):
    cred = credentials.Certificate(_cred_path)
    firebase_admin.initialize_app(cred)
    _db = firestore.client()   # Firestore client available
else:
    # Fallback for local dev without credentials — auth will be skipped
    print("⚠  FIREBASE_CREDENTIALS not set — token verification is disabled (dev mode only)")
    firebase_admin.initialize_app()   # uses GOOGLE_APPLICATION_CREDENTIALS if set
    _db = None

# ─── In-memory stores (replace with Firestore in production) ──────────────────

sessions_db = {}   # session_id -> { storeId, userId, items: [], status, createdAt }
orders_db   = {}   # session_id -> { items, total, paymentMethod, qrCode, paidAt }

# ─── Firestore product catalog ────────────────────────────────────────────────
# Loaded once at startup from Firestore 'products' collection.

def _load_products_from_firestore():
    if _db is None:
        print("⚠  Firestore not available — using empty product catalog.")
        return {}
    try:
        docs = _db.collection("products").stream()
        catalog = {}
        for doc in docs:
            data = doc.to_dict()
            catalog[doc.id] = {
                "name":     data.get("name",     doc.id),
                "brand":    data.get("brand",    ""),
                "category": data.get("category", ""),
                "variant":  data.get("variant",  ""),
                "price":    data.get("price",    0),
                "stock":    data.get("stock",    0),
                "img":      data.get("img",      ""),
            }
        print(f"✅  Loaded {len(catalog)} products from Firestore.")
        return catalog
    except Exception as e:
        print(f"⚠  Failed to load products from Firestore: {e}")
        return {}

PRODUCTS = _load_products_from_firestore()


def _get_product(barcode: str):
    """Look up a product. Falls back to a live Firestore read for
    products added after the server started."""
    if barcode in PRODUCTS:
        return PRODUCTS[barcode]
    if _db is None:
        return None
    try:
        doc = _db.collection("products").document(barcode).get()
        if doc.exists:
            data = doc.to_dict()
            PRODUCTS[barcode] = data   # cache for next time
            return data
    except Exception:
        pass
    return None

# ─── Store catalog ────────────────────────────────────────────────────────────

STORES = [
    {
        "id": "city-supermarket-downtown",
        "name": "City Supermarket Downtown",
        "address": "SIGCE, Ghansoli, Maharashtra",
        "coordinates": {"lat": 19.120401, "lng": 72.998200},
        "boundary": [
            {"lat": 19.12010946577491, "lng": 72.9982844390916},
            {"lat": 19.119805,         "lng": 72.998051},
            {"lat": 19.119904,         "lng": 72.997657},
            {"lat": 19.120251,         "lng": 72.997579},
        ],
        "hours": "8:00 AM - 10:00 PM",
        "phone": "+91-22-1234-5678",
        "features": ["Parking Available", "Express Checkout", "Fresh Produce"],
    },
    {
        "id": "city-supermarket-north",
        "name": "City Supermarket North Plaza",
        "address": "Dombivli East, Maharashtra",
        "coordinates": {"lat": 19.203350, "lng": 73.093064},
        "boundary": None,
        "hours": "7:00 AM - 11:00 PM",
        "phone": "+91-22-2345-6789",
        "features": ["24/7 Pharmacy", "Food Court", "Kids Play Area"],
    },
    {
        "id": "city-supermarket-south",
        "name": "City Supermarket South Mall",
        "address": "Near Ghansoli Station, Maharashtra",
        "coordinates": {"lat": 19.116210, "lng": 73.006696},
        "boundary": None,
        "hours": "9:00 AM - 9:00 PM",
        "phone": "+91-22-3456-7890",
        "features": ["Organic Section", "Bakery", "Home Delivery"],
    },
]

STORE_IDS = {s["id"] for s in STORES}


# ─── Auth middleware ───────────────────────────────────────────────────────────

def verify_token(f):
    """
    Decorator that verifies the Firebase ID token from the Authorization header.
    Attaches the decoded token to request.firebase_user.
    Skips verification if Firebase Admin was not initialised with credentials (dev mode).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not firebase_admin._apps:
            request.firebase_user = {"uid": "dev-user"}
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        id_token = auth_header.split("Bearer ")[1]
        try:
            decoded = firebase_auth.verify_id_token(id_token)
            request.firebase_user = decoded
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return decorated


# ═══════════════════════════════════════════════════════════════════════════════
# SESSION
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/session/start")
@verify_token
def session_start():
    data = request.get_json(force=True)
    store_id = data.get("storeId", "city-supermarket-downtown")

    # Validate store ID
    if store_id not in STORE_IDS:
        return jsonify({"error": f"Unknown store: {store_id}"}), 400

    sid = f"SC-{uuid.uuid4().hex[:6].upper()}"
    sessions_db[sid] = {
        "storeId":   store_id,
        "userId":    request.firebase_user["uid"],
        "items":     [],
        "status":    "active",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    return jsonify({"sessionId": sid, "status": "active"}), 201


@app.get("/session/<session_id>")
@verify_token
def session_get(session_id):
    s = sessions_db.get(session_id)
    if not s:
        return jsonify({"error": "Session not found"}), 404
    return jsonify({"sessionId": session_id, **s}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# SCANNING
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/scan")
@verify_token
def scan_barcode():
    data    = request.get_json(force=True)
    barcode = data.get("barcode", "")
    product = _get_product(barcode)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"barcode": barcode, **product}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# CART
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/cart/<session_id>")
@verify_token
def cart_get(session_id):
    s = sessions_db.get(session_id)
    if not s:
        return jsonify({"error": "Session not found"}), 404
    return jsonify({"sessionId": session_id, "items": s["items"]}), 200


@app.patch("/cart/<session_id>/item")
@verify_token
def cart_update_item(session_id):
    s = sessions_db.get(session_id)
    if not s:
        return jsonify({"error": "Session not found"}), 404

    data    = request.get_json(force=True)
    barcode = data.get("barcode", data.get("itemId", ""))
    qty     = data.get("qty", 1)

    for item in s["items"]:
        if item["barcode"] == barcode:
            item["qty"] = qty
            return jsonify({"message": "Updated", "item": item}), 200

    product = PRODUCTS.get(barcode)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    new_item = {"barcode": barcode, "qty": qty, **product}
    s["items"].append(new_item)
    return jsonify({"message": "Added", "item": new_item}), 201


@app.delete("/cart/<session_id>/item/<barcode>")
@verify_token
def cart_remove_item(session_id, barcode):
    s = sessions_db.get(session_id)
    if not s:
        return jsonify({"error": "Session not found"}), 404
    s["items"] = [i for i in s["items"] if i["barcode"] != barcode]
    return jsonify({"message": "Removed"}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT & QR
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/generate-qr")
@verify_token
def generate_qr():
    data = request.get_json(force=True)
    sid  = data.get("sessionId", "")
    s    = sessions_db.get(sid, {})

    items   = s.get("items", [])
    total   = sum(i.get("price", 0) * i.get("qty", 1) for i in items)
    qr_code = f"SMARTCART-{uuid.uuid4().hex[:12].upper()}"

    orders_db[sid] = {
        "items":         items,
        "total":         total,
        "paymentMethod": data.get("paymentMethod", "upi"),
        "qrCode":        qr_code,
        "paidAt":        datetime.now(timezone.utc).isoformat(),
        "status":        "paid",
    }
    if sid in sessions_db:
        sessions_db[sid]["status"] = "completed"

    return jsonify({"qrCode": qr_code, "total": total, "status": "paid"}), 200


@app.get("/order-status/<session_id>")
@verify_token
def order_status(session_id):
    order = orders_db.get(session_id)
    if not order:
        return jsonify({"status": "not_found"}), 404
    return jsonify({"sessionId": session_id, **order}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# GUARD  (public — guard devices don't have user accounts)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/guard/verify")
def guard_verify():
    data    = request.get_json(force=True)
    qr_code = data.get("qrCode", "")

    for sid, order in orders_db.items():
        if order.get("qrCode") == qr_code:
            return jsonify({
                "valid":      True,
                "sessionId":  sid,
                "total":      order["total"],
                "itemCount":  len(order["items"]),
                "paidAt":     order["paidAt"],
                "status":     order["status"],
            }), 200

    return jsonify({"valid": False, "error": "Invalid QR code"}), 404


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/stores")
def list_stores():
    """Return all available stores (public endpoint — no auth required)."""
    return jsonify({"stores": STORES}), 200


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "smartcart-api"}), 200


if __name__ == "__main__":
    print("\n  🛒  SmartCart API running at http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
