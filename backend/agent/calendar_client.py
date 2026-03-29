"""
Momma Agent — Google Calendar Client
Wraps Google Calendar API v3 with OAuth2 auth.
Falls back to an in-memory mock store when credentials are unavailable.
"""

import logging
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("momma.calendar")

CREDENTIALS_PATH = Path(os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials/google_credentials.json"))
CALENDAR_ID      = os.getenv("GOOGLE_CALENDAR_ID", "primary")
SCOPES           = ["https://www.googleapis.com/auth/calendar"]

# ── In-memory mock store (used when no Google credentials are present) ─────────
_MOCK_EVENTS: list[dict] = [
    {
        "id":         "mock_001",
        "title":      "Q2 Planning Session",
        "start":      "2026-03-30T15:00:00",
        "end":        "2026-03-30T16:30:00",
        "location":   "Conference Room B",
        "description":"Quarterly planning with the product team",
        "color":      "blue",
    },
    {
        "id":         "mock_002",
        "title":      "Team Standup",
        "start":      "2026-03-28T09:30:00",
        "end":        "2026-03-28T09:45:00",
        "location":   "Zoom",
        "description":"Daily standup",
        "color":      "green",
    },
    {
        "id":         "mock_003",
        "title":      "Gym — Leg Day",
        "start":      "2026-03-28T19:00:00",
        "end":        "2026-03-28T20:00:00",
        "location":   "Equinox 63rd St",
        "description":"Moved from 6 PM due to late office stay",
        "color":      "orange",
    },
    {
        "id":         "mock_004",
        "title":      "Client Call — Acme Corp",
        "start":      "2026-03-28T18:00:00",
        "end":        "2026-03-28T19:30:00",
        "location":   "Office",
        "description":"Critical client review — mandatory stay",
        "color":      "red",
    },
]


def _get_real_service():
    """Attempt to build a real Google Calendar API service."""
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build

        token_path = Path("credentials/token.json")
        creds = None

        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            elif CREDENTIALS_PATH.exists():
                flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
                creds = flow.run_local_server(port=0)
                token_path.parent.mkdir(parents=True, exist_ok=True)
                token_path.write_text(creds.to_json())
            else:
                return None

        return build("calendar", "v3", credentials=creds)
    except Exception as exc:
        logger.warning(f"Could not init Google Calendar service: {exc}")
        return None


_service = _get_real_service()
_USE_MOCK = _service is None
if _USE_MOCK:
    logger.info("Calendar: using in-memory mock store (no Google credentials found)")


# ── Public Interface ──────────────────────────────────────────────────────────

def list_events(days_ahead: int = 7) -> list[dict[str, Any]]:
    """List upcoming events for the next N days."""
    if _USE_MOCK:
        return sorted(_MOCK_EVENTS, key=lambda e: e["start"])

    now     = datetime.now(timezone.utc)
    end     = now + timedelta(days=days_ahead)
    result  = _service.events().list(
        calendarId=CALENDAR_ID,
        timeMin=now.isoformat(),
        timeMax=end.isoformat(),
        singleEvents=True,
        orderBy="startTime",
        maxResults=20,
    ).execute()

    events = []
    for item in result.get("items", []):
        start = item["start"].get("dateTime", item["start"].get("date", ""))
        end_t = item["end"].get("dateTime", item["end"].get("date", ""))
        events.append({
            "id":          item["id"],
            "title":       item.get("summary", "Untitled"),
            "start":       start,
            "end":         end_t,
            "location":    item.get("location"),
            "description": item.get("description"),
            "color":       "blue",
        })
    return events


def insert_event(title: str, start: str, end: str,
                 location: str | None = None,
                 description: str | None = None) -> dict[str, Any]:
    """Create a new calendar event."""
    if _USE_MOCK:
        import uuid
        ev = {
            "id":          f"mock_{uuid.uuid4().hex[:6]}",
            "title":       title,
            "start":       start,
            "end":         end,
            "location":    location,
            "description": description,
            "color":       "blue",
        }
        _MOCK_EVENTS.append(ev)
        logger.info(f"[Mock] Inserted event: {title}")
        return ev

    body = {
        "summary":     title,
        "location":    location,
        "description": description,
        "start":       {"dateTime": start, "timeZone": "America/New_York"},
        "end":         {"dateTime": end,   "timeZone": "America/New_York"},
    }
    created = _service.events().insert(calendarId=CALENDAR_ID, body=body).execute()
    logger.info(f"Inserted real calendar event: {created['id']}")
    return {"id": created["id"], "title": title, "start": start, "end": end}


def get_optimal_slot(task: str, duration_minutes: int = 60,
                     window_start_hour: int = 17,
                     window_end_hour: int = 21) -> dict[str, Any] | None:
    """
    Find the largest free gap in the calendar between window_start and window_end
    on today's date and return the start/end of the best slot.
    """
    today     = datetime.now().date()
    win_start = datetime.combine(today, datetime.min.time()).replace(hour=window_start_hour)
    win_end   = datetime.combine(today, datetime.min.time()).replace(hour=window_end_hour)

    # Collect today's busy intervals within the window
    all_events = list_events(days_ahead=1)
    busy: list[tuple[datetime, datetime]] = []
    for ev in all_events:
        try:
            s = datetime.fromisoformat(ev["start"])
            e = datetime.fromisoformat(ev["end"])
            # Clip to window
            s = max(s, win_start)
            e = min(e, win_end)
            if s < e:
                busy.append((s, e))
        except (ValueError, KeyError):
            continue

    busy.sort()

    # Merge overlapping intervals
    merged: list[tuple[datetime, datetime]] = []
    for s, e in busy:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))

    # Find gaps
    cursor = win_start
    best_slot: tuple[datetime, datetime] | None = None
    best_duration = timedelta(0)

    for bs, be in merged:
        gap_start = cursor
        gap_end   = bs
        gap_dur   = gap_end - gap_start
        if gap_dur > best_duration:
            best_duration = gap_dur
            best_slot = (gap_start, gap_end)
        cursor = be

    # Check trailing gap
    if cursor < win_end:
        gap_dur = win_end - cursor
        if gap_dur > best_duration:
            best_slot = (cursor, win_end)
            best_duration = gap_dur

    if best_slot and best_duration >= timedelta(minutes=duration_minutes):
        slot_start = best_slot[0]
        slot_end   = slot_start + timedelta(minutes=duration_minutes)
        return {
            "task":          task,
            "start":         slot_start.isoformat(),
            "end":           slot_end.isoformat(),
            "start_display": slot_start.strftime("%-I:%M %p") if os.name != "nt" else slot_start.strftime("%I:%M %p").lstrip("0"),
            "end_display":   slot_end.strftime("%-I:%M %p") if os.name != "nt" else slot_end.strftime("%I:%M %p").lstrip("0"),
            "gap_available_minutes": int(best_duration.total_seconds() / 60),
        }
    return None
