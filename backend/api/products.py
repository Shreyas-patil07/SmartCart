"""
Product catalog management with Firestore integration.
"""
from .firebase_init import get_firestore_client

# In-memory cache
PRODUCTS = {}


def load_products_from_firestore():
    """Load products from Firestore into memory cache."""
    db = get_firestore_client()
    if db is None:
        print("⚠  Firestore not available — using empty product catalog.")
        return {}
    
    try:
        docs = db.collection("products").stream()
        catalog = {}
        for doc in docs:
            data = doc.to_dict()
            catalog[doc.id] = {
                "name": data.get("name", doc.id),
                "brand": data.get("brand", ""),
                "category": data.get("category", ""),
                "variant": data.get("variant", ""),
                "price": data.get("price", 0),
                "stock": data.get("stock", 0),
                "img": data.get("img", ""),
            }
        print(f"✅  Loaded {len(catalog)} products from Firestore.")
        PRODUCTS.update(catalog)
        return catalog
    except Exception as e:
        print(f"⚠  Failed to load products from Firestore: {e}")
        return {}


def get_product(barcode: str):
    """
    Look up a product. Falls back to a live Firestore read for
    products added after the server started.
    """
    if barcode in PRODUCTS:
        return PRODUCTS[barcode]
    
    db = get_firestore_client()
    if db is None:
        return None
    
    try:
        doc = db.collection("products").document(barcode).get()
        if doc.exists:
            data = doc.to_dict()
            PRODUCTS[barcode] = data  # cache for next time
            return data
    except Exception:
        pass
    
    return None


# Load products on module import
load_products_from_firestore()
