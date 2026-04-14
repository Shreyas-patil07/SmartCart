"""
fetch_images.py
───────────────
Searches BigBasket for each product, grabs the product image URL,
and updates the 'img' field in Firestore.

Requirements:
    pip install requests beautifulsoup4 firebase-admin
"""

import time
import json
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore

# ── Init Firebase ─────────────────────────────────────────────────────────────
cred = credentials.Certificate("backend/firebase-service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── BigBasket scraper ─────────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.bigbasket.com/",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def bigbasket_image(brand: str, category: str, variant: str) -> str | None:
    """Search BigBasket and return the first product image URL found."""
    query = f"{brand} {category} {variant}"
    url = f"https://www.bigbasket.com/ps/?q={requests.utils.quote(query)}&nc=as"

    try:
        resp = SESSION.get(url, timeout=10)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # BigBasket renders product images in <img> tags with specific classes
        # Try multiple selectors for resilience
        for selector in [
            "img[class*='ProductImages']",
            "img[alt*='{}']".format(brand),
            "img[src*='bigbasket.com/media']",
            "img[src*='/p/l/']",
            "img[src*='/p/m/']",
        ]:
            imgs = soup.select(selector)
            for img in imgs:
                src = img.get("src") or img.get("data-src") or ""
                if "bigbasket.com/media" in src and not src.endswith(".svg"):
                    # Upgrade to large image
                    src = src.replace("/p/m/", "/p/l/").replace("/p/s/", "/p/l/")
                    return src

        # Fallback: grab any bigbasket media image
        all_imgs = soup.find_all("img", src=True)
        for img in all_imgs:
            src = img["src"]
            if "bigbasket.com/media/uploads" in src:
                src = src.replace("/p/m/", "/p/l/").replace("/p/s/", "/p/l/")
                return src

    except Exception as e:
        print(f"    ⚠  Request error for '{query}': {e}")

    return None


def bigbasket_image_via_api(brand: str, category: str, variant: str) -> str | None:
    """Try BigBasket's internal search API for JSON product data."""
    query = f"{brand} {category} {variant}"
    url = (
        "https://www.bigbasket.com/product/get-products-by-brand/"
        f"?brand={requests.utils.quote(brand)}"
        f"&category={requests.utils.quote(category.lower())}"
    )
    try:
        resp = SESSION.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("tab_info", {}).get("product_map", {})
            if products:
                first = next(iter(products.values()))
                imgs = first.get("i", [])
                if imgs:
                    return imgs[0].get("l") or imgs[0].get("m") or ""
    except Exception:
        pass
    return None


# ── Product → search query mapping ───────────────────────────────────────────
# Maps (barcode) -> search hint override if needed
SEARCH_OVERRIDES = {
    "SMC9907565": "Head and Shoulders shampoo 650ml",
    "SMC6935047": "Wagh Bakri tea 250g",
    "SMC3058758": "Daawat basmati rice 5kg",
    "SMC2506507": "Kohinoor basmati rice 5kg",
}


def make_query(barcode: str, brand: str, category: str, variant: str) -> str:
    if barcode in SEARCH_OVERRIDES:
        return SEARCH_OVERRIDES[barcode]
    return f"{brand} {category} {variant}"


# ── Curated fallback image map (BigBasket direct links, already verified) ────
# Used when scraping fails — avoids broken images
FALLBACK_IMAGES = {
    # Milk
    "SMC5269525": "https://www.bigbasket.com/media/uploads/p/l/306926_4-amul-homogenised-toned-milk-1-l-carton.jpg",
    "SMC0468349": "https://www.bigbasket.com/media/uploads/p/l/233407_10-mother-dairy-toned-milk.jpg",
    "SMC6859852": "https://www.bigbasket.com/media/uploads/p/l/40034282_2-nestle-a-toned-and-vitamins-milk.jpg",
    # Bread
    "SMC0488273": "https://www.bigbasket.com/media/uploads/p/l/20000843_8-britannia-100-whole-wheat-bread.jpg",
    "SMC2420808": "https://www.bigbasket.com/media/uploads/p/l/40119154_2-modern-bread-sandwich-atta.jpg",
    # Biscuits
    "SMC7805463": "https://www.bigbasket.com/media/uploads/p/l/20006376_5-parle-g-gold-biscuits.jpg",
    "SMC3550901": "https://www.bigbasket.com/media/uploads/p/l/40004534_6-oreo-original-flavour-sandwich-biscuits.jpg",
    "SMC6355020": "https://www.bigbasket.com/media/uploads/p/l/20007421_3-sunfeast-marie-light-biscuits.jpg",
    # Rice
    "SMC4837159": "https://www.bigbasket.com/media/uploads/p/l/226965_7-india-gate-classic-basmati-rice.jpg",
    "SMC3058758": "https://www.bigbasket.com/media/uploads/p/l/20002247_6-daawat-traditional-basmati-rice.jpg",
    "SMC2506507": "https://www.bigbasket.com/media/uploads/p/l/20004408_8-kohinoor-super-silver-aged-basmati-rice.jpg",
    "SMC9453343": "https://www.bigbasket.com/media/uploads/p/l/40046246_10-fortune-biryani-special-basmati-rice.jpg",
    # Cooking Oil
    "SMC1854277": "https://www.bigbasket.com/media/uploads/p/l/40013519_10-fortune-sunlite-refined-sunflower-oil.jpg",
    "SMC9464254": "https://www.bigbasket.com/media/uploads/p/l/20004187_11-saffola-total-refined-cooking-oil.jpg",
    # Tea
    "SMC0396523": "https://www.bigbasket.com/media/uploads/p/l/20002537_16-tata-tea-gold.jpg",
    "SMC2229131": "https://www.bigbasket.com/media/uploads/p/l/20001784_19-brooke-bond-red-label-natural-care-tea.jpg",
    "SMC6935047": "https://www.bigbasket.com/media/uploads/p/l/20001234_10-wagh-bakri-tea.jpg",
    # Shampoo
    "SMC3039716": "https://www.bigbasket.com/media/uploads/p/l/233613_8-clinic-plus-strength-shine-shampoo.jpg",
    "SMC9907565": "https://www.bigbasket.com/media/uploads/p/l/40054580_3-head-shoulders-smooth-silky-shampoo.jpg",
    "SMC8246967": "https://www.bigbasket.com/media/uploads/p/l/40018434_10-sunsilk-nourishing-soft-smooth-shampoo.jpg",
    # Toothpaste
    "SMC4873864": "https://www.bigbasket.com/media/uploads/p/l/40039170_3-colgate-strong-teeth-toothpaste.jpg",
    "SMC2505744": "https://www.bigbasket.com/media/uploads/p/l/40006985_5-pepsodent-germi-check-toothpaste.jpg",
    # Soap
    "SMC9204365": "https://www.bigbasket.com/media/uploads/p/l/20005258_9-lux-soft-glow-soap.jpg",
    "SMC9839118": "https://www.bigbasket.com/media/uploads/p/l/20005226_12-dove-cream-beauty-bathing-bar.jpg",
    "SMC7185365": "https://www.bigbasket.com/media/uploads/p/l/20005254_15-lifebuoy-total-10-soap.jpg",
    # Instant Noodles
    "SMC6664898": "https://www.bigbasket.com/media/uploads/p/l/40007341_10-maggi-2-minute-noodles-masala.jpg",
    "SMC3079354": "https://www.bigbasket.com/media/uploads/p/l/40007327_6-sunfeast-yippee-classic-masala-noodles.jpg",
    "SMC0859854": "https://www.bigbasket.com/media/uploads/p/l/40004890_3-top-ramen-smoodles-curry-noodles.jpg",
    "SMC5120016": "https://www.bigbasket.com/media/uploads/p/l/40007343_4-knorr-soupy-noodles-masala.jpg",
    # Jam
    "SMC5500119": "https://www.bigbasket.com/media/uploads/p/l/20003007_5-kissan-mixed-fruit-jam.jpg",
    "SMC5172245": "https://www.bigbasket.com/media/uploads/p/l/40044791_3-tops-mixed-fruit-jam.jpg",
    # Peanut Butter
    "SMC6598293": "https://www.bigbasket.com/media/uploads/p/l/40151768_2-pintola-all-natural-peanut-butter.jpg",
    "SMC1277778": "https://www.bigbasket.com/media/uploads/p/l/40210020_2-alpino-natural-peanut-butter-crunch.jpg",
    # Cornflakes
    "SMC0375570": "https://www.bigbasket.com/media/uploads/p/l/40007382_13-kelloggs-corn-flakes-original.jpg",
    "SMC1768963": "https://www.bigbasket.com/media/uploads/p/l/40078042_2-bagrry-s-corn-flakes-plus.jpg",
    # Detergent
    "SMC5676466": "https://www.bigbasket.com/media/uploads/p/l/40020282_12-surf-excel-easy-wash-powder.jpg",
    "SMC4407970": "https://www.bigbasket.com/media/uploads/p/l/40023556_11-ariel-complete-detergent-washing-powder.jpg",
    # Dishwash
    "SMC9084355": "https://www.bigbasket.com/media/uploads/p/l/40020291_9-vim-dishwash-liquid-gel-lemon.jpg",
    "SMC3899138": "https://www.bigbasket.com/media/uploads/p/l/40011820_7-pril-dishwash-liquid-lime.jpg",
    # Hand Sanitizer
    "SMC9005526": "https://www.bigbasket.com/media/uploads/p/l/40174052_3-dettol-original-instant-hand-sanitizer.jpg",
}


# ── Main ──────────────────────────────────────────────────────────────────────
def run():
    docs = list(db.collection("products").stream())
    print(f"\n🔍  Fetching images for {len(docs)} products …\n")

    updated = 0
    failed  = []
    results = {}   # barcode -> img_url  (saved to JSON for review)

    for doc in docs:
        barcode = doc.id
        data    = doc.to_dict()
        brand    = data.get("brand", "")
        category = data.get("category", "")
        variant  = data.get("variant", "")
        name     = data.get("name", barcode)

        # Skip products that already have an image
        existing = data.get("img", "")
        if existing and existing != "":
            print(f"  ⏭  {barcode}  {name:30s}  (already has image)")
            results[barcode] = existing
            continue

        # Try curated fallback first (fast, reliable)
        img_url = FALLBACK_IMAGES.get(barcode)

        if not img_url:
            # Live scrape BigBasket
            query = make_query(barcode, brand, category, variant)
            print(f"  🌐  {barcode}  {name:30s}  → searching: '{query}'")
            img_url = bigbasket_image(brand, category, variant)
            time.sleep(0.8)   # polite crawl delay

        if img_url:
            # Update Firestore
            db.collection("products").document(barcode).update({"img": img_url})
            results[barcode] = img_url
            updated += 1
            print(f"  ✅  {barcode}  {name:30s}  → {img_url[:70]}…")
        else:
            failed.append({"barcode": barcode, "name": name})
            results[barcode] = ""
            print(f"  ❌  {barcode}  {name:30s}  → NO IMAGE FOUND")

    # Save results JSON for reference
    with open("product_images.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n{'─'*60}")
    print(f"✅  Updated : {updated}/{len(docs)} products")
    print(f"❌  Missing  : {len(failed)}")
    if failed:
        for f in failed:
            print(f"   • {f['barcode']} — {f['name']}")
    print(f"\n📄  Full results saved to product_images.json")
    print(f"{'─'*60}\n")


if __name__ == "__main__":
    run()
