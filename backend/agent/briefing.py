"""
Momma Agent — Daily Briefing Generator
Composes the Markdown daily briefing from all data sources.
"""

import logging
import os
from datetime import datetime
from typing import Any

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("momma.briefing")

SPEND_BUDGET  = float(os.getenv("MONTHLY_SPEND_BUDGET", "2000"))
CO2_TARGET_KG = float(os.getenv("MONTHLY_CO2_TARGET_KG", "200"))


async def generate_daily_briefing(
    events: list[dict],
    spending: dict[str, Any],
    carbon: dict[str, Any],
    schedule_hint: str = "",
    optimal_slot: dict | None = None,
) -> str:
    """
    Build the daily briefing. Tries the LLM first, falls back to the local template.
    """
    from agent.llm_client import generate_briefing

    context = {
        "today":           datetime.now().strftime("%A, %B %d, %Y"),
        "events":          _format_events_for_llm(events),
        "monthly_spend":   spending.get("total", 0),
        "spend_budget":    SPEND_BUDGET,
        "monthly_co2_kg":  carbon.get("total_kg", 0),
        "co2_target_kg":   CO2_TARGET_KG,
        "top_categories":  list(spending.get("by_category", {}).keys())[:3],
        "schedule_hint":   schedule_hint,
        "optimal_slot":    optimal_slot,
    }

    return await generate_briefing(context)


def _format_events_for_llm(events: list[dict]) -> list[dict]:
    """Strip large fields for the LLM context window."""
    out = []
    for ev in events[:5]:
        try:
            dt = datetime.fromisoformat(ev["start"])
            time_str = dt.strftime("%I:%M %p").lstrip("0")
        except Exception:
            time_str = ev.get("start", "")
        out.append({
            "title":      ev.get("title", "Event"),
            "start_time": time_str,
            "location":   ev.get("location"),
        })
    return out
