# 🤖 M.O.M. AI

Management, Optimization, & Monitoring AI (M.O.M) — Personal Intelligence Dashboard

M.O.M is a high-fidelity personal ai agent and environmental tracker designed to streamline digital life while monitoring ecological impact. Built for the modern user, it combines an AI-driven email triage system, a conversational scheduling agent, and real-time carbon footprint analytics.

# 🌟 Key Features

Intelligence Feed: Automatically categorizes your inbox into "Important" and "Unimportant" using the MBZUAI K2-Think-v2 reasoning model, stripping away conversational filler to give you a clear daily briefing.

Scheduling Agent: A real-time conversational interface that extracts tasks, times, and locations from natural language and persists them to a structured SQLite database.

Carbon Intelligence: Visualizes weekly emission trends through an interactive AreaChart and provides AI-generated insights to help reduce your CO2 footprint.

Spending Breakdown: Parses financial logs to provide a categorized breakdown of expenses using professional, Shadcn-inspired data visualizations.

# 🚀 Tech Stack

Frontend: React (Vite), Recharts (Data Viz), Tailwind CSS, Lucide Icons.
Backend: FastAPI (Python), SQLAlchemy (ORM), Uvicorn.
AI Engine: MBZUAI K2-Think-v2 (Reasoning Model).
Database: SQLite (Relational Storage).

# 🛠️ Installation & Setup

1. Backend Setup
Navigate to the backend/ directory and configure your environment:
> cd backend

# Create and activate virtual environment
> python -m venv .venv
> source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
> pip install -r requirements.txt

# Initialize and seed the database
> python database.py

2. Frontend Setup

Navigate to the root or frontend/ directory:

# Install dependencies
> npm install

# Start the development server
> npm run dev
The application will be accessible at http://localhost:5173.

# 📂 Project Structure
backend/main.py: The core API handling AI requests and database interactions.
backend/database.py: SQLAlchemy models defining the DailyEmissions and Task schemas.
src/views/: Contains the primary dashboard views (Home, Calendar, Carbon, Spending).
src/hooks/useTodos.js: A custom React hook managing the synchronized state of your daily tasks.

# 📊 API Documentation
Endpoint	Method	Description
/dashboard-data	GET	Fetches the daily briefing and structured tasks for the current date.
/sync-emails	GET	Triggers the K2 model to parse the mock email dataset.
/parse-intent	POST	Extracts scheduling metadata (task, time, location) from user input.
/api/carbon-intelligence	GET	Returns weekly trend data and AI environmental tips.
