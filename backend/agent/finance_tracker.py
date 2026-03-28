"""
Momma Agent — Finance Tracker
Logs financial transactions to CSV and provides monthly summaries.
"""

import csv
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger("momma.finance")

DATA_DIR  = Path(__file__).parent.parent / "data"
SPEND_CSV = DATA_DIR / "spending_log.csv"
FIELDNAMES = ["timestamp", "vendor", "amount", "category", "currency", "email_id"]

CATEGORIES = {
    "transport": "🚗 Transport",
    "food":      "🍔 Food & Dining",
    "shopping":  "🛍️ Shopping",
    "utilities": "⚡ Utilities",
    "travel":    "✈️ Travel",
    "other":     "📦 Other",
}


def _ensure_csv() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SPEND_CSV.exists():
        with open(SPEND_CSV, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()


def log_transaction(vendor: str, amount: float, category: str = "other",
                    currency: str = "USD", email_id: str = "") -> dict[str, Any]:
    """Append a financial transaction to the spending log CSV."""
    _ensure_csv()
    row = {
        "timestamp": datetime.utcnow().isoformat(),
        "vendor":    vendor,
        "amount":    round(float(amount), 2),
        "category":  category,
        "currency":  currency,
        "email_id":  email_id,
    }
    with open(SPEND_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writerow(row)
    logger.info(f"Logged transaction: {vendor} ${amount:.2f} [{category}]")
    return row


def get_monthly_summary(year: int | None = None, month: int | None = None) -> dict[str, Any]:
    """Return aggregated spending for a given month (defaults to current month)."""
    _ensure_csv()
    now = datetime.utcnow()
    year  = year  or now.year
    month = month or now.month

    total      = 0.0
    by_category: dict[str, float] = {}
    transactions: list[dict] = []

    with open(SPEND_CSV, newline="") as f:
        for row in csv.DictReader(f):
            try:
                ts = datetime.fromisoformat(row["timestamp"])
                if ts.year == year and ts.month == month:
                    amt = float(row["amount"])
                    cat = row["category"]
                    total += amt
                    by_category[cat] = by_category.get(cat, 0.0) + amt
                    transactions.append({
                        "date":     ts.strftime("%b %d"),
                        "vendor":   row["vendor"],
                        "amount":   amt,
                        "category": cat,
                    })
            except (ValueError, KeyError):
                continue

    return {
        "year":         year,
        "month":        month,
        "total":        round(total, 2),
        "by_category":  {k: round(v, 2) for k, v in sorted(by_category.items(), key=lambda x: -x[1])},
        "transactions": transactions,
        "budget":       float(os.getenv("MONTHLY_SPEND_BUDGET", "2000")),
    }


def seed_demo_data() -> None:
    """Pre-populate spending_log.csv with prior-month entries so charts look nice."""
    _ensure_csv()
    # Only seed if file is essentially empty (just have the header)
    with open(SPEND_CSV) as f:
        rows = list(csv.DictReader(f))
    if rows:
        return  # Already has data

    demo = [
        ("Netflix",    15.99,  "utilities",  "USD"),
        ("Whole Foods",62.40,  "food",       "USD"),
        ("Uber",       18.20,  "transport",  "USD"),
        ("Amazon",     89.95,  "shopping",   "USD"),
        ("Delta",     320.00,  "travel",     "USD"),
        ("Starbucks",  24.30,  "food",       "USD"),
        ("Shell",      48.24,  "transport",  "USD"),
        ("Uber",       24.50,  "transport",  "USD"),
        ("Amazon",    156.82,  "shopping",   "USD"),
        ("NYC Transit", 33.00, "transport",  "USD"),
    ]
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(SPEND_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        now = datetime.utcnow()
        for vendor, amount, category, currency in demo:
            writer.writerow({
                "timestamp": now.replace(day=max(1, now.day - len(demo))).isoformat(),
                "vendor":    vendor,
                "amount":    amount,
                "category":  category,
                "currency":  currency,
                "email_id":  "seed",
            })
    logger.info("Demo spending data seeded.")
