"""
SQLAlchemy ORM models for business data and simulation logs.
"""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, JSON, UniqueConstraint
from app.database import Base


class BusinessData(Base):
    """Historical business metrics stored per day."""
    __tablename__ = "business_data"
    __table_args__ = (
        UniqueConstraint("date", name="uq_business_data_date"),
    )
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    revenue = Column(Float, nullable=False)
    expenses = Column(Float, nullable=False)
    marketing_spend = Column(Float, nullable=False)
    inventory_level = Column(Integer, nullable=False)
    units_sold = Column(Integer, nullable=False)
    customer_count = Column(Integer, nullable=False)
    customer_acquisition_cost = Column(Float, nullable=False)
    churn_rate = Column(Float, nullable=False)
    profit_margin = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SimulationLog(Base):
    """Log of What-If simulation runs and their results."""
    __tablename__ = "simulation_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    scenario_name = Column(String(255), default="Custom Scenario")
    parameters = Column(JSON, nullable=False)
    baseline_prediction = Column(JSON, nullable=False)
    scenario_prediction = Column(JSON, nullable=False)
    llm_insights = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
