"""
Momma — Core Agent Orchestrator
Chains: email fetch → LLM classify → dispatch → briefing
"""

import asyncio
import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger("momma.core")

# Cumulative in-session log for the WebSocket stream
_PIPELINE_LOGS: list[dict] = []


def _log(msg: str, level: str = "info") -> None:
    entry = {"ts": datetime.utcnow().isoformat(), "level": level, "msg": msg}
    _PIPELINE_LOGS.append(entry)
    getattr(logger, level)(msg)


def get_pipeline_logs() -> list[dict]:
    return list(_PIPELINE_LOGS)


def clear_pipeline_logs() -> None:
    _PIPELINE_LOGS.clear()


async def run_pipeline(email_source: str = "mock") -> dict[str, Any]:
    """
    Full Momma pipeline:
    1. Seed demo data (if needed)
    2. Fetch emails
    3. Classify each email via LLM
    4. Dispatch: insert calendar events, log finance & carbon
    5. Find optimal gym slot
    6. Generate daily briefing
    Returns a results summary dict.
    """
    from agent import email_parser, finance_tracker, carbon_tracker, calendar_client
    from agent.llm_client import classify_email
    from agent.briefing import generate_daily_briefing

    clear_pipeline_logs()
    _log("🤖 Momma pipeline starting...")

    # ── Step 0: Seed demo data ──────────────────────────────────────────────
    finance_tracker.seed_demo_data()
    carbon_tracker.seed_demo_data()
    _log("📁 Demo data verified/seeded")

    # ── Step 1: Fetch emails ────────────────────────────────────────────────
    import os
    os.environ["EMAIL_SOURCE"] = email_source
    emails = email_parser.get_emails()
    _log(f"📬 Fetched {len(emails)} email(s) from [{email_source}]")

    # ── Step 2 & 3: Classify + Dispatch ────────────────────────────────────
    today       = datetime.now().strftime("%Y-%m-%d")
    results     = {"calendar": [], "finance": [], "carbon": [], "hints": [], "other": []}
    schedule_hint_text = ""

    for em in emails:
        _log(f"  📧 Processing: \"{em['subject']}\"")
        classification = await classify_email(em["subject"], em["body"], today)
        kind = classification.get("type", "other")

        if kind == "calendar":
            ev = calendar_client.insert_event(
                title=classification.get("title", em["subject"]),
                start=classification.get("start", ""),
                end=classification.get("end", ""),
                location=classification.get("location"),
                description=classification.get("description"),
            )
            results["calendar"].append(ev)
            _log(f"    📅 Calendar event added: {classification.get('title')}")

        elif kind == "finance":
            row = finance_tracker.log_transaction(
                vendor=classification.get("vendor", "Unknown"),
                amount=classification.get("amount", 0),
                category=classification.get("category", "other"),
                email_id=em["id"],
            )
            results["finance"].append(row)
            _log(f"    💳 Finance logged: {classification.get('vendor')} ${classification.get('amount'):.2f}")

        elif kind == "carbon":
            row = carbon_tracker.log_emission(
                mode=classification.get("mode", "other"),
                distance_km=classification.get("distance_km"),
                gallons=classification.get("gallons"),
                description=em["subject"],
                email_id=em["id"],
            )
            results["carbon"].append(row)
            _log(f"    🌱 CO₂ logged: {row['co2_kg']:.2f} kg ({classification.get('mode')})")

        elif kind == "schedule_hint":
            hint = classification.get("hint", "")
            affected = classification.get("affected_event", "")
            shift = classification.get("suggested_shift_hours", 0)
            schedule_hint_text = f"📌 Due to a late office commitment, your **{affected}** session should be shifted ~{shift:.0f}h later."
            results["hints"].append(classification)
            _log(f"    💡 Schedule hint: {hint}")

        else:
            results["other"].append({"subject": em["subject"]})
            _log(f"    ℹ️ No actionable content in: {em['subject']}")

    # ── Step 4: Optimal slot finder ─────────────────────────────────────────
    optimal = calendar_client.get_optimal_slot("Gym Session", duration_minutes=60,
                                               window_start_hour=17, window_end_hour=21)
    if optimal:
        _log(f"    🏋️ Optimal gym slot: {optimal['start_display']} – {optimal['end_display']}")
    else:
        _log("    ⚠️ No optimal gym slot found in 5–9 PM window")

    # ── Step 5: Fetch updated data + generate briefing ─────────────────────
    events   = calendar_client.list_events(days_ahead=7)
    spending = finance_tracker.get_monthly_summary()
    carbon_s = carbon_tracker.get_monthly_co2()
    briefing = await generate_daily_briefing(events, spending, carbon_s,
                                              schedule_hint_text, optimal)
    _log("✅ Daily briefing generated")

    return {
        "pipeline_results": results,
        "briefing":         briefing,
        "events":           events,
        "spending":         spending,
        "carbon":           carbon_s,
        "optimal_slot":     optimal,
        "logs":             get_pipeline_logs(),
    }
