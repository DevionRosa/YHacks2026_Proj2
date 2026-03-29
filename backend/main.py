import logging, json, csv, os, sys
from datetime import date
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Standard Flat Structure path fix
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from secretary import SYSTEM_PROMPTS, client
from database import session, DailyEmissions
from add_task import add_task_to_db, load_mock_emails

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s — %(message)s")
logger = logging.getLogger("momma.api")
_CACHE = {"briefing": "Sync your inbox to generate your briefing."}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🤖 Momma API Initializing...")
    yield

app = FastAPI(title="Momma AI", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/dashboard-data")
async def get_dashboard():
    # Use date.today() instead of a hardcoded string to stay in sync
    today_date = date.today() 
    day_entry = session.query(DailyEmissions).filter_by(date=today_date).first()
    
    return {
        "briefing": _CACHE["briefing"],
        "total_kg": day_entry.total_kg if day_entry else 0.0,
        "tasks": [
            {
                "text": t.task_name, 
                "time": t.time_period, 
                "location": t.location, 
                "done": False, 
                "id": t.id
            } for t in day_entry.tasks
        ] if day_entry else []
    }

@app.get("/api/spending")
async def get_spending():
    categories = {}
    transactions = []
    total = 0
    try:
        with open('spending_log.csv', mode='r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                amt = float(row['amount'])
                cat = row['category']
                categories[cat] = categories.get(cat, 0) + amt
                transactions.append({
                    "vendor": row['vendor'], 
                    "category": cat, 
                    "amount": amt, 
                    "date": row['timestamp'].split('T')[0]
                })
                total += amt
        graph_data = [{"category": k.capitalize(), "amount": v} for k, v in categories.items()]
        transactions.sort(key=lambda x: x['date'], reverse=True)
        return {"graph_data": graph_data, "transactions": transactions[:15], "total": total}
    except Exception as e:
        return {"graph_data": [], "transactions": [], "total": 0}

@app.get("/api/carbon-intelligence")
async def carbon_intelligence():
    """Generates weekly carbon trend data and AI analysis blurb."""
    mock_weekly = [
        {"day": "Mon", "kg": 12.4}, {"day": "Tue", "kg": 15.1},
        {"day": "Wed", "kg": 8.2}, {"day": "Thu", "kg": 22.5},
        {"day": "Fri", "kg": 14.8}, {"day": "Sat", "kg": 18.2},
        {"day": "Today", "kg": 4.2}
    ]
    prompt = "Compare today's 4.2kg emissions to the weekly average and provide a 1-sentence reduction tip."
    
    try:
        response = client.chat.completions.create(
            model="MBZUAI-IFM/K2-Think-v2", # Correct model name
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content
        
        # Clean out thinking tokens if present
        if "</think>" in content:
            content = content.split("</think>")[-1].strip()
            
        return {"weekly": mock_weekly, "analysis": content}
    except Exception as e:
        logger.error(f"Carbon AI Error: {e}")
        return {
            "weekly": mock_weekly, 
            "analysis": "Compare your daily usage to the weekly average to identify spikes in your footprint."
        }

@app.post("/parse-intent")
async def parse_intent(request: Request):
    body = await request.json()
    response = client.chat.completions.create(
        model="MBZUAI-IFM/K2-Think-v2",
        messages=[{"role": "system", "content": SYSTEM_PROMPTS["calendar_maker"]}, {"role": "user", "content": body.get("text", "")}],
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content
    if "</think>" in content: content = content.split("</think>")[-1]
    return json.loads(content)

@app.get("/sync-emails")
async def sync_emails():
    emails = load_mock_emails()
    response = client.chat.completions.create(
        model="MBZUAI-IFM/K2-Think-v2",
        messages=[{"role": "system", "content": SYSTEM_PROMPTS["email_parser"]}, {"role": "user", "content": json.dumps(emails)}]
    )
    content = response.choices[0].message.content
    if "</think>" in content: content = content.split("</think>")[-1]
    _CACHE["briefing"] = content
    return {"analysis": content}

@app.post("/add-task")
async def add_task_endpoint(request: Request):
    body = await request.json()
    success = add_task_to_db(body['date'], body['task'])
    return {"status": "success" if success else "failed"}