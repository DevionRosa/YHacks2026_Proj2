"""
Momma Agent — LLM Client
Supports: OpenRouter, direct K2Think API, or mock fallback.
All providers expose an OpenAI-compatible chat/completions interface.
"""

import os
import json
import logging
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("momma.llm")

# ── Provider resolution ───────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
K2THINK_API_KEY    = os.getenv("K2THINK_API_KEY", "")
LLM_MODEL          = os.getenv("LLM_MODEL", "llm360/k2-think-v2")

if OPENROUTER_API_KEY:
    _BASE_URL = "https://openrouter.ai/api/v1"
    _API_KEY  = OPENROUTER_API_KEY
    _PROVIDER = "openrouter"
elif K2THINK_API_KEY:
    _BASE_URL = "https://api.k2think.ai/v1"
    _API_KEY  = K2THINK_API_KEY
    _PROVIDER = "k2think"
else:
    _BASE_URL = None
    _API_KEY  = None
    _PROVIDER = "mock"

logger.info(f"LLM provider: {_PROVIDER}  model: {LLM_MODEL}")


# ── Mock Reasoning Engine ─────────────────────────────────────────────────────

MOCK_CLASSIFICATIONS = {
    "uber":     {"type": "finance",  "vendor": "Uber",       "amount": 24.50,  "category": "transport"},
    "delta":    {"type": "carbon",   "mode": "flight",       "distance_km": 3983, "amount": 0},
    "shell":    {"type": "carbon",   "mode": "gas",          "gallons": 12.4,  "amount": 48.24},
    "meeting":  {"type": "calendar", "title": "Q2 Planning Session", "start": "2026-03-30T15:00:00", "end": "2026-03-30T16:30:00", "location": "Conference Room B"},
    "amazon":   {"type": "finance",  "vendor": "Amazon",     "amount": 156.82, "category": "shopping"},
    "late":     {"type": "schedule_hint", "hint": "stay_late_office", "affected_event": "gym", "suggested_shift_hours": 1.5},
}

def _mock_classify(email_body: str) -> dict:
    """Rule-based mock classifier used when no LLM key is configured."""
    body_lower = email_body.lower()
    if "uber" in body_lower:
        return MOCK_CLASSIFICATIONS["uber"]
    if "delta" in body_lower or "flight" in body_lower:
        return MOCK_CLASSIFICATIONS["delta"]
    if "shell" in body_lower or "gallons" in body_lower:
        return MOCK_CLASSIFICATIONS["shell"]
    if "meeting" in body_lower or "invitation" in body_lower or "planning" in body_lower:
        return MOCK_CLASSIFICATIONS["meeting"]
    if "amazon" in body_lower:
        return MOCK_CLASSIFICATIONS["amazon"]
    if "staying late" in body_lower or "stay in the office" in body_lower:
        return MOCK_CLASSIFICATIONS["late"]
    return {"type": "other", "summary": "No actionable content detected."}


# ── System Prompt ─────────────────────────────────────────────────────────────

CLASSIFY_SYSTEM_PROMPT = """
You are Momma, an autonomous AI personal secretary. Your job is to read emails and 
classify them into structured JSON objects.

For each email, output ONLY valid JSON (no markdown wrapper, no explanation) matching 
ONE of these schemas:

1. Calendar event:
{"type":"calendar","title":"<string>","start":"<ISO8601>","end":"<ISO8601>","location":"<string or null>","description":"<string or null>"}

2. Financial transaction:
{"type":"finance","vendor":"<string>","amount":<float>,"category":"<transport|food|shopping|utilities|travel|other>","currency":"USD"}

3. Carbon emission:
{"type":"carbon","mode":"<flight|gas|rideshare|other>","distance_km":<float or null>,"gallons":<float or null>,"amount":<float>,"description":"<string>"}

4. Schedule hint (no action needed but affects schedule):
{"type":"schedule_hint","hint":"<string>","affected_event":"<string or null>","suggested_shift_hours":<float or null>}

5. Not actionable:
{"type":"other","summary":"<one sentence>"}

Today's date: {today}
""".strip()


# ── Public Interface ──────────────────────────────────────────────────────────

async def classify_email(subject: str, body: str, today: str) -> dict:
    """
    Send an email to the LLM and return a typed classification dict.
    Falls back to mock classifier if no API key is configured.
    """
    if _PROVIDER == "mock":
        logger.info("Using mock classifier (no LLM key configured)")
        result = _mock_classify(body)
        logger.info(f"Mock result → {result}")
        return result

    system = CLASSIFY_SYSTEM_PROMPT.replace("{today}", today)
    user_msg = f"Subject: {subject}\n\nBody:\n{body}"

    headers = {
        "Authorization": f"Bearer {_API_KEY}",
        "Content-Type": "application/json",
    }
    if _PROVIDER == "openrouter":
        headers["HTTP-Referer"] = "https://momma-agent.dev"
        headers["X-Title"] = "Momma Personal Secretary"

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user_msg},
        ],
        "temperature": 0.1,
        "max_tokens": 512,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            # Strip accidental markdown code fences
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content)
    except Exception as exc:
        logger.error(f"LLM call failed: {exc} — falling back to mock")
        return _mock_classify(body)


async def generate_briefing(context: dict) -> str:
    """
    Ask the LLM to write the daily briefing narrative.
    Falls back to a template if no key is configured.
    """
    if _PROVIDER == "mock":
        return _mock_briefing(context)

    prompt = f"""
Write a warm, concise morning briefing for a personal secretary app called "Momma".
Use the following data and write in second person ("You have...").
Output clean Markdown with no extra commentary.

Data:
{json.dumps(context, indent=2)}

Include:
- Greeting with today's date
- Calendar summary (meetings count, first/last event)
- Financial summary (monthly spend vs budget)
- Carbon footprint summary (monthly CO2 vs target)
- Any smart schedule suggestion if relevant
- Closing motivational sentence
""".strip()

    headers = {"Authorization": f"Bearer {_API_KEY}", "Content-Type": "application/json"}
    if _PROVIDER == "openrouter":
        headers.update({"HTTP-Referer": "https://momma-agent.dev", "X-Title": "Momma"})

    payload = {
        "model": LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 800,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{_BASE_URL}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        logger.error(f"Briefing LLM call failed: {exc}")
        return _mock_briefing(context)


def _mock_briefing(ctx: dict) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%A, %B %-d, %Y") if os.name != "nt" else datetime.now().strftime("%A, %B %d, %Y").replace(" 0", " ")
    events = ctx.get("events", [])
    spend  = ctx.get("monthly_spend", 0)
    budget = ctx.get("spend_budget", 2000)
    co2    = ctx.get("monthly_co2_kg", 0)
    co2_target = ctx.get("co2_target_kg", 200)
    hint   = ctx.get("schedule_hint", "")

    lines = [
        f"# 🌅 Good morning! — {today}",
        "",
        f"## 📅 Your Calendar",
        f"You have **{len(events)} event(s)** scheduled today." if events else "You have a clear calendar today — enjoy the breathing room.",
    ]
    for ev in events[:3]:
        lines.append(f"- **{ev.get('title', 'Event')}** at {ev.get('start_time', 'TBD')}")

    lines += [
        "",
        f"## 💳 Finances",
        f"You've spent **${spend:,.2f}** this month out of your **${budget:,.0f}** budget "
        f"({(spend/budget*100):.0f}% used).",
        "",
        f"## 🌱 Carbon Footprint",
        f"Your estimated CO₂ this month is **{co2:.1f} kg** against your **{co2_target} kg** target "
        f"({(co2/co2_target*100):.0f}% of target).",
    ]

    if hint:
        lines += ["", f"## 💡 Smart Suggestion", hint]

    lines += ["", "---", "*Momma is on it. Have a great day! 💪*"]
    return "\n".join(lines)
