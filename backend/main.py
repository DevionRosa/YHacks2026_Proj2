"""
Momma — FastAPI Backend
Exposes all agent capabilities via REST endpoints + WebSocket log stream.
"""

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("momma.api")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── Startup ────────────────────────────────────────────────────────────────────

# Cache for last pipeline run (avoids re-running on every dashboard load)
_CACHE: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🤖 Momma API starting — running initial pipeline...")
    from agent.momma import run_pipeline
    result = await run_pipeline(email_source=os.getenv("EMAIL_SOURCE", "mock"))
    _CACHE.update(result)
    logger.info("✅ Initial pipeline complete")
    yield


app = FastAPI(
    title="Momma — Personal Secretary API",
    description="Autonomous AI personal secretary: email parsing, calendar management, finance & carbon tracking.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["system"])
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat(), "agent": "Momma v1.0"}


# ── Briefing ───────────────────────────────────────────────────────────────────

@app.get("/api/briefing", tags=["briefing"])
async def get_briefing():
    """Return the cached daily briefing Markdown string."""
    return JSONResponse({"briefing": _CACHE.get("briefing", ""), "generated_at": datetime.utcnow().isoformat()})


# ── Calendar ───────────────────────────────────────────────────────────────────

@app.get("/api/events", tags=["calendar"])
async def get_events(days: int = 7):
    """List upcoming calendar events."""
    from agent.calendar_client import list_events
    return JSONResponse({"events": list_events(days_ahead=days)})


@app.post("/api/events", tags=["calendar"])
async def create_event(title: str, start: str, end: str,
                       location: str | None = None, description: str | None = None):
    """Manually create a calendar event."""
    from agent.calendar_client import insert_event
    ev = insert_event(title, start, end, location, description)
    return JSONResponse({"event": ev})


@app.get("/api/optimal-slot", tags=["calendar"])
async def optimal_slot(task: str = "Gym Session", duration: int = 60,
                       window_start: int = 17, window_end: int = 21):
    """Find the optimal free slot for a task today."""
    from agent.calendar_client import get_optimal_slot
    slot = get_optimal_slot(task, duration, window_start, window_end)
    return JSONResponse({"slot": slot})


# ── Finance ────────────────────────────────────────────────────────────────────

@app.get("/api/spending", tags=["finance"])
async def get_spending(year: int | None = None, month: int | None = None):
    """Get monthly spending summary."""
    from agent.finance_tracker import get_monthly_summary
    return JSONResponse(get_monthly_summary(year, month))


# ── Carbon ─────────────────────────────────────────────────────────────────────

@app.get("/api/carbon", tags=["carbon"])
async def get_carbon(year: int | None = None, month: int | None = None):
    """Get monthly CO2 emission summary."""
    from agent.carbon_tracker import get_monthly_co2
    return JSONResponse(get_monthly_co2(year, month))


# ── Pipeline ───────────────────────────────────────────────────────────────────

@app.post("/api/run-pipeline", tags=["pipeline"])
async def run_pipeline_endpoint(email_source: str = "mock"):
    """Trigger a full email processing pipeline run."""
    from agent.momma import run_pipeline
    result = await run_pipeline(email_source=email_source)
    _CACHE.update(result)
    return JSONResponse({
        "status": "complete",
        "emails_processed": sum(
            len(v) for v in result["pipeline_results"].values()
        ),
        "briefing_preview": result["briefing"][:200] + "...",
        "logs": result["logs"],
    })


# ── WebSocket Log Stream ────────────────────────────────────────────────────────

_ws_clients: list[WebSocket] = []


@app.websocket("/ws/logs")
async def websocket_logs(ws: WebSocket):
    """Stream real-time pipeline logs to the frontend."""
    await ws.accept()
    _ws_clients.append(ws)
    try:
        from agent.momma import get_pipeline_logs
        # Send existing logs immediately
        for log in get_pipeline_logs():
            await ws.send_text(json.dumps(log))
        # Keep alive — broadcast future logs
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        _ws_clients.remove(ws)


# ── Dashboard Summary ──────────────────────────────────────────────────────────

@app.get("/api/dashboard", tags=["dashboard"])
async def dashboard_summary():
    """All-in-one endpoint for the frontend dashboard."""
    from agent.calendar_client import list_events
    from agent.finance_tracker import get_monthly_summary
    from agent.carbon_tracker import get_monthly_co2
    from agent.calendar_client import get_optimal_slot

    events   = list_events(days_ahead=7)
    spending = get_monthly_summary()
    carbon   = get_monthly_co2()
    slot     = get_optimal_slot()

    return JSONResponse({
        "briefing":     _CACHE.get("briefing", ""),
        "events":       events,
        "spending":     spending,
        "carbon":       carbon,
        "optimal_slot": slot,
        "stats": {
            "events_today": sum(
                1 for e in events
                if e["start"].startswith(datetime.now().strftime("%Y-%m-%d"))
            ),
            "monthly_spend":    spending.get("total", 0),
            "spend_budget":     spending.get("budget", 2000),
            "monthly_co2_kg":   carbon.get("total_kg", 0),
            "co2_target_kg":    float(os.getenv("MONTHLY_CO2_TARGET_KG", "200")),
        },
    })
