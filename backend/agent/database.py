from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import date

Base = declarative_base()

# 1. Define the Tables
class DailyEmissions(Base):
    __tablename__ = 'daily_emissions'
    id = Column(Integer, primary_key=True)
    date = Column(Date, unique=True, nullable=False)
    total_kg = Column(Float, default=0.0)
    tasks = relationship("Task", back_populates="day")

class Task(Base):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String) # 'transport', 'food', etc.
    value = Column(Float)      # miles driven or meals eaten
    day_id = Column(Integer, ForeignKey('daily_emissions.id'))
    day = relationship("DailyEmissions", back_populates="tasks")

# 2. Create the SQLite file
engine = create_engine('sqlite:///carbon_tracker.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# 3. Seed Existing Tasks for Today (March 28, 2026)
today = date(2026, 3, 28)

# Check if today exists, if not, create it
day_entry = session.query(DailyEmissions).filter_by(date=today).first()
if not day_entry:
    day_entry = DailyEmissions(date=today, total_kg=4.2) # Initial estimate
    session.add(day_entry)
    session.commit()

    # Add initial mock tasks
    initial_tasks = [
        Task(name="Commute to Campus", category="transport", value=12.0, day=day_entry),
        Task(name="Lunch - Chicken Salad", category="food", value=1.0, day=day_entry)
    ]
    session.add_all(initial_tasks)
    session.commit()
    print("Database created and seeded with today's tasks!")