"""
upload_products.py
──────────────────
Parses the SmartCart product list and uploads every item to Firestore.

Collection : products
Document ID: the barcode (e.g. "SMC5269525")

Fields uploaded per document:
  barcode   : str   – the SMC barcode
  category  : str   – e.g. "Milk"
  brand     : str   – e.g. "Amul"
  variant   : str   – e.g. "1L"
  price     : int   – in ₹
  stock     : int   – units available
  name      : str   – "Brand Variant"  (for display in the app)
  img       : str   – "" (placeholder; add images later)
"""

import firebase_admin
from firebase_admin import credentials, firestore

# ── Init Firebase Admin ───────────────────────────────────────────────────────
cred = credentials.Certificate("backend/firebase-service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── Raw product data ──────────────────────────────────────────────────────────
# Format: BARCODE | CATEGORY | BRAND | VARIANT | PRICE | STOCK
RAW = """
SMC5269525 | Milk | Amul | 1L | 61 | 22
SMC0468349 | Milk | Mother Dairy | 1L | 57 | 18
SMC6859852 | Milk | Nestle A+ | 1L | 63 | 12

SMC0488273 | Bread | Britannia | 400g | 42 | 28
SMC2420808 | Bread | Modern | 400g | 37 | 19

SMC7805463 | Biscuits | Parle-G | 300g | 34 | 55
SMC3550901 | Biscuits | Oreo | 300g | 62 | 20
SMC6355020 | Biscuits | Sunfeast | 300g | 44 | 30

SMC4837159 | Rice | India Gate | 5kg | 455 | 9
SMC3058758 | Rice | Daawat | 5kg | 428 | 7
SMC2506507 | Rice | Kohinoor | 5kg | 472 | 5
SMC9453343 | Rice | Fortune | 5kg | 418 | 11

SMC1854277 | Cooking Oil | Fortune | 1L | 182 | 17
SMC9464254 | Cooking Oil | Saffola | 1L | 212 | 13

SMC0396523 | Tea | Tata Tea | 250g | 142 | 24
SMC2229131 | Tea | Red Label | 250g | 148 | 19
SMC6935047 | Tea | Wagh Bakri | 250g | 156 | 14

SMC3039716 | Shampoo | Clinic Plus | 650ml | 278 | 11
SMC9907565 | Shampoo | Head & Shoulders | 650ml | 325 | 8
SMC8246967 | Shampoo | Sunsilk | 650ml | 298 | 10

SMC4873864 | Toothpaste | Colgate | 200g | 118 | 21
SMC2505744 | Toothpaste | Pepsodent | 200g | 112 | 16

SMC9204365 | Soap | Lux | 100g | 36 | 38
SMC9839118 | Soap | Dove | 100g | 56 | 20
SMC7185365 | Soap | Lifebuoy | 100g | 29 | 33

SMC6664898 | Instant Noodles | Maggi | 280g | 61 | 27
SMC3079354 | Instant Noodles | Yippee | 280g | 54 | 22
SMC0859854 | Instant Noodles | Top Ramen | 280g | 57 | 19
SMC5120016 | Instant Noodles | Knorr | 280g | 63 | 15

SMC5500119 | Jam | Kissan | 500g | 138 | 13
SMC5172245 | Jam | Tops | 500g | 130 | 9

SMC6598293 | Peanut Butter | Pintola | 350g | 252 | 8
SMC1277778 | Peanut Butter | Alpino | 350g | 245 | 6

SMC0375570 | Cornflakes | Kellogg's | 475g | 212 | 10
SMC1768963 | Cornflakes | Bagrry's | 475g | 205 | 7

SMC5676466 | Detergent | Surf Excel | 1kg | 222 | 14
SMC4407970 | Detergent | Ariel | 1kg | 215 | 12

SMC9084355 | Dishwash Liquid | Vim | 500ml | 118 | 16
SMC3899138 | Dishwash Liquid | Pril | 500ml | 125 | 11

SMC9005526 | Hand Sanitizer | Dettol | 200ml | 102 | 18
"""

# ── Parse ─────────────────────────────────────────────────────────────────────
def parse_products(raw: str) -> list[dict]:
    products = []
    for line in raw.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) != 6:
            print(f"  ⚠  Skipping malformed line: {line!r}")
            continue
        barcode, category, brand, variant, price, stock = parts
        products.append({
            "barcode":  barcode,
            "category": category,
            "brand":    brand,
            "variant":  variant,
            "price":    int(price),
            "stock":    int(stock),
            "name":     f"{brand} {variant}",   # e.g. "Amul 1L"
            "img":      "",                      # fill in image URLs later
        })
    return products

# ── Upload ────────────────────────────────────────────────────────────────────
def upload(products: list[dict]):
    col = db.collection("products")
    batch = db.batch()
    batch_size = 0

    print(f"\n📦  Uploading {len(products)} products to Firestore …\n")

    for p in products:
        ref = col.document(p["barcode"])
        batch.set(ref, p)
        batch_size += 1
        print(f"  ✓  {p['barcode']}  │  {p['category']:20s}  │  {p['name']:30s}  │  ₹{p['price']:>4}  │  stock: {p['stock']}")

        # Firestore batch limit is 500 writes
        if batch_size == 499:
            batch.commit()
            batch = db.batch()
            batch_size = 0

    if batch_size:
        batch.commit()

    print(f"\n✅  Done — {len(products)} products uploaded to Firestore collection 'products'.\n")


if __name__ == "__main__":
    products = parse_products(RAW)
    upload(products)
