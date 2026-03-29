import json
from flask import Flask, request, jsonify
from openai import OpenAI
from config import config
from secretary import SYSTEM_PROMPTS, get_k2_completion
from database import session, DailyEmissions, Task # Import from your DB file
from datetime import datetime
import os

app = Flask(__name__)
client = OpenAI(api_key=config.K2_API_KEY, base_url=config.K2_BASE_URL)

def load_mock_emails():
    # 1. Get the absolute path of the current file (add_task.py)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Go up to 'backend/' then into 'data/mock_emails.json'
    # Path: backend/agent/ -> .. -> data/mock_emails.json
    file_path = os.path.join(current_dir, '..', 'data', 'mock_emails.json')
    
    # 3. Standardize the path for the OS (Windows vs Mac/Linux)
    normalized_path = os.path.normpath(file_path)
    
    with open(normalized_path, 'r') as f:
        return json.load(f)

@app.route('/sync-emails', methods=['GET'])
def sync_emails():
    """Loads mock emails from the data folder and returns an AI summary."""
    try:
        # Uses your existing load_mock_emails() to find the file in ../data/
        emails = load_mock_emails()
        
        # Pass the email list to K2
        ai_analysis = get_k2_completion(json.dumps(emails), case_type="email_parser")
        
        return jsonify({
            "status": "success",
            "analysis": ai_analysis
        }), 200
    except FileNotFoundError:
        return jsonify({"error": "mock_emails.json not found in backend/data/"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_k2_calculation(day_tasks):
    """Calls K2 to calculate total based on the list of tasks."""
    response = client.chat.completions.create(
        model="MBZUAI-IFM/K2-Think-v2",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPTS["daily_carbon_calculator"]},
            {"role": "user", "content": json.dumps(day_tasks)}
        ],
        response_format={ "type": "json_object" }
    )
    return json.loads(response.choices[0].message.content)

@app.route('/add-task', methods=['POST'])
def add_task():
    data = request.json
    # Parse date string to a date object
    date_str = data.get("date", "2026-03-28")
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    new_task_data = data.get("task") # e.g. {"name": "Drive", "category": "transport", "value": 10}

    try:
        # 1. Get or Create the day entry in SQLite
        day_entry = session.query(DailyEmissions).filter_by(date=target_date).first()
        if not day_entry:
            day_entry = DailyEmissions(date=target_date, total_kg=0.0)
            session.add(day_entry)
            session.commit()

        # 2. Add the NEW task to SQLite
        new_task = Task(
            name=new_task_data['name'], 
            category=new_task_data['category'], 
            value=new_task_data['value'], 
            day=day_entry
        )
        session.add(new_task)
        session.commit()

        # 3. Pull ALL tasks for this day from SQLite to send to K2
        all_tasks_objs = session.query(Task).filter_by(day_id=day_entry.id).all()
        tasks_for_ai = [
            {"name": t.name, "category": t.category, "value": t.value} 
            for t in all_tasks_objs
        ]

        # 4. Get AI Calculation
        calculation_results = get_k2_calculation(tasks_for_ai)
        new_total = calculation_results.get("day_total_kg")

        # 5. Update the daily total in SQLite
        day_entry.total_kg = new_total
        session.commit()

        return jsonify({
            "status": "success",
            "new_daily_total": new_total,
            "breakdown": calculation_results.get("breakdown"),
            "all_tasks_count": len(tasks_for_ai)
        }), 200

    except Exception as e:
        session.rollback() # Undo DB changes if AI fails
        return jsonify({"error": str(e)}), 500

@app.route('/parse-intent', methods=['POST'])
def parse_intent():
    user_text = request.json.get("text")
    # Use the function from secretary.py
    ai_response = get_k2_completion(user_text, case_type="calendar_maker")
    
    # K2 returns a string that looks like JSON, convert it to a real dict
    try:
        structured_data = json.loads(ai_response)
        return jsonify(structured_data), 200
    except:
        return jsonify({"error": "AI could not format the task correctly"}), 400

@app.route('/parse-emails', methods=['POST'])
def parse_emails():
    # In a real app, you'd fetch this from the Gmail API
    # For the hackathon, we'll pass the mock_emails.json content here
    emails = request.json.get("emails") 
    
    try:
        # Call K2 using the email_parser logic from secretary.py
        # We pass the whole list of emails as a string
        ai_analysis = get_k2_completion(json.dumps(emails), case_type="email_parser")
        
        return jsonify({
            "status": "success",
            "analysis": ai_analysis
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)