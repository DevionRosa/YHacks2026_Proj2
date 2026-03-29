"""
Momma Agent — Carbon Tracker
Estimates CO2 emissions from emails (flights, gas, rideshare) using
simple multiplier-based logic and logs to CSV.
"""

import csv
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger("momma.carbon")

DATA_DIR   = Path(__file__).parent.parent / "data"
CARBON_CSV = DATA_DIR / "carbon_log.csv"
FIELDNAMES = ["timestamp", "mode", "distance_km", "gallons", "co2_kg", "description", "email_id"]

# ── CO2 Multipliers ───────────────────────────────────────────────────────────
# Sources: EPA, ICAO, Our World in Data
CO2_FACTORS = {
    "flight":    0.255,   # kg CO2 per passenger-km (short/medium haul economy)
    "gas":       2.421,   # kg CO2 per liter of gasoline (EPA: 8.887 kg/gallon ÷ 3.785)
    "rideshare": 0.171,   # kg CO2 per km (Uber/Lyft, includes empty miles)
    "car":       0.192,   # kg CO2 per km (average passenger car)
    "train":     0.041,   # kg CO2 per km
    "other":     0.100,   # generic fallback
}

GALLONS_TO_LITERS = 3.785411784
MILES_TO_KM       = 1.60934


def _ensure_csv() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not CARBON_CSV.exists():
        with open(CARBON_CSV, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()


def estimate_co2(mode: str, distance_km: float | None = None,
                 gallons: float | None = None) -> float:
    """
    Estimate kg of CO2 for a given travel event.
    - Flights / rideshare: use distance_km × factor
    - Gas receipts: use gallons × 8.887 (kg CO2 per US gallon)
    """
    mode = mode.lower()
    factor = CO2_FACTORS.get(mode, CO2_FACTORS["other"])

    if mode == "gas" and gallons is not None:
        liters = gallons * GALLONS_TO_LITERS
        co2 = liters * CO2_FACTORS["gas"]
    elif distance_km is not None:
        co2 = distance_km * factor
    else:
        co2 = 0.0

    return round(co2, 2)


def log_emission(mode: str, distance_km: float | None, gallons: float | None,
                 description: str = "", email_id: str = "") -> dict[str, Any]:
    """Compute and log a CO2 emission event."""
    _ensure_csv()
    co2_kg = estimate_co2(mode, distance_km, gallons)
    row = {
        "timestamp":   datetime.utcnow().isoformat(),
        "mode":        mode,
        "distance_km": round(distance_km, 2) if distance_km else "",
        "gallons":     round(gallons, 3) if gallons else "",
        "co2_kg":      co2_kg,
        "description": description,
        "email_id":    email_id,
    }
    with open(CARBON_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writerow(row)
    logger.info(f"Logged CO2: {mode} → {co2_kg:.2f} kg")
    return row


def get_monthly_co2(year: int | None = None, month: int | None = None) -> dict[str, Any]:
    """Return aggregated CO2 for a given month."""
    _ensure_csv()
    now   = datetime.utcnow()
    year  = year  or now.year
    month = month or now.month

    total    = 0.0
    by_mode: dict[str, float] = {}
    entries: list[dict] = []

    with open(CARBON_CSV, newline="") as f:
        for row in csv.DictReader(f):
            try:
                ts = datetime.fromisoformat(row["timestamp"])
                if ts.year == year and ts.month == month:
                    kg   = float(row["co2_kg"])
                    mode = row["mode"]
                    total += kg
                    by_mode[mode] = by_mode.get(mode, 0.0) + kg
                    entries.append({
                        "date":        ts.strftime("%b %d"),
                        "mode":        mode,
                        "co2_kg":      kg,
                        "description": row["description"],
                    })
            except (ValueError, KeyError):
                continue

    return {
        "year":    year,
        "month":   month,
        "total_kg": round(total, 2),
        "by_mode":  {k: round(v, 2) for k, v in sorted(by_mode.items(), key=lambda x: -x[1])},
        "entries":  entries,
    }


def seed_demo_data() -> None:
    """Pre-populate carbon_log.csv with sample data."""
    _ensure_csv()
    with open(CARBON_CSV) as f:
        rows = list(csv.DictReader(f))
    if rows:
        return

    demo = [
        ("flight",    3983,  None,  "DL 1847 JFK→LAX"),
        ("gas",       None,  12.4,  "Shell gas station"),
        ("rideshare", 13.4,  None,  "Uber trip"),
        ("rideshare", 8.3,   None,  "Uber receipt $24.50"),
        ("car",       45.0,  None,  "Weekend drive"),
    ]
    now = datetime.utcnow()
    with open(CARBON_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for mode, dist, gals, desc in demo:
            co2 = estimate_co2(mode, dist, gals)
            writer.writerow({
                "timestamp":   now.isoformat(),
                "mode":        mode,
                "distance_km": round(dist, 2) if dist else "",
                "gallons":     round(gals, 3) if gals else "",
                "co2_kg":      co2,
                "description": desc,
                "email_id":    "seed",
            })
    logger.info("Demo carbon data seeded.")
