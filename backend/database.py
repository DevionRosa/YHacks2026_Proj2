from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import date

Base = declarative_base()

class DailyEmissions(Base):
    __tablename__ = 'daily_emissions'
    id = Column(Integer, primary_key=True)
    date = Column(Date, unique=True, nullable=False)
    total_kg = Column(Float, default=0.0)
    tasks = relationship("Task", back_populates="day")

class Task(Base):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True)
    task_name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    time_period = Column(String, nullable=True)
    category = Column(String) 
    value = Column(Float, default=0.0)
    day_id = Column(Integer, ForeignKey('daily_emissions.id'))
    day = relationship("DailyEmissions", back_populates="tasks")

engine = create_engine('sqlite:///carbon_tracker.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Seed Today (March 28, 2026)
today = date.today()
day_entry = session.query(DailyEmissions).filter_by(date=today).first()
if not day_entry:
    day_entry = DailyEmissions(date=today, total_kg=4.2)
    session.add(day_entry)
    session.commit()

    initial_tasks = [
        Task(task_name="Commute to Campus", location="University", time_period="8:30 AM", category="transport", value=12.0, day=day_entry),
        Task(task_name="Lunch - Chicken Salad", location="Dining Hall", time_period="12:30 PM", category="food", value=1.0, day=day_entry)
    ]
    session.add_all(initial_tasks)
    session.commit()
    print("Database seeded with structured tasks.")