"""
In-memory storage for sessions and orders.
Replace with database models in production.
"""

sessions_db = {}  # session_id -> { storeId, userId, items: [], status, createdAt }
orders_db = {}    # session_id -> { items, total, paymentMethod, qrCode, paidAt }
