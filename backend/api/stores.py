"""
Store catalog data.
"""

STORES = [
    {
        "id": "city-supermarket-downtown",
        "name": "City Supermarket Downtown",
        "address": "SIGCE, Ghansoli, Maharashtra",
        "coordinates": {"lat": 19.120401, "lng": 72.998200},
        "boundary": [
            {"lat": 19.12010946577491, "lng": 72.9982844390916},
            {"lat": 19.119805, "lng": 72.998051},
            {"lat": 19.119904, "lng": 72.997657},
            {"lat": 19.120251, "lng": 72.997579},
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
