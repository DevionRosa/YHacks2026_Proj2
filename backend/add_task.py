import json
import os
from datetime import datetime
from secretary import client, SYSTEM_PROMPTS
from database import session, DailyEmissions, Task 

def add_task_to_db(date_str, task_data):
    """
    Adds a task to the database and asks K2 to calculate the new daily carbon total.
    """
    try:
        # 1. Ensure the Day entry exists
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        day_entry = session.query(DailyEmissions).filter_by(date=target_date).first()
        
        if not day_entry:
            day_entry = DailyEmissions(date=target_date, total_kg=0.0)
            session.add(day_entry)
            session.commit()

        # 2. Save the New Task
        new_task = Task(
            task_name=task_data['name'], # Changed key
            location=task_data.get('location'), # New
            time_period=task_data.get('time'),  # New
            category=task_data.get('category', 'other'),
            value=task_data.get('value', 0.0),
            day=day_entry
        )
        session.add(new_task)
        session.flush()

        # 3. Recalculate Daily Carbon with AI
        all_tasks = session.query(Task).filter_by(day_id=day_entry.id).all()
        tasks_for_ai = [{"name": t.name, "category": t.category} for t in all_tasks]
        
        ai_response = client.chat.completions.create(
            model="k2",
            messages=[
                {"role": "system", "content": "You are a Carbon Calculator. Return JSON: {'day_total_kg': float}"},
                {"role": "user", "content": json.dumps(tasks_for_ai)}
            ],
            response_format={"type": "json_object"}
        )
        
        try:
            results = json.loads(ai_response.choices[0].message.content)
            day_entry.total_kg = float(results.get("day_total_kg", day_entry.total_kg))
        except:
            day_entry.total_kg += 0.5 # Fallback increment
        
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Database Error: {e}")
        return False

def load_mock_emails():
    """Helper to find and load your mock email JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), 'mock_emails.json')
    if not os.path.exists(file_path):
        file_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_emails.json')
    
    with open(file_path, 'r') as f:
        return json.load(f)