"""
Data seeding service.
Loads synthetic CSV data into the PostgreSQL database.
"""

import os
import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings


async def seed_database(session: AsyncSession):
    """
    Seed the database with synthetic business data from CSV.
    Skips seeding if data already exists.
    """
    settings = get_settings()
    
    # Check if data already exists
    result = await session.execute(text("SELECT COUNT(*) FROM business_data"))
    count = result.scalar()
    
    if count and count > 0:
        print(f"  Database already contains {count} records. Skipping seed.")
        return count
    
    # Find CSV file
    csv_path = os.path.join(settings.DATA_PATH, "synthetic_business_data.csv")
    if not os.path.exists(csv_path):
        print(f"  WARNING: Seed data not found at {csv_path}")
        return 0
    
    # Load CSV
    df = pd.read_csv(csv_path)
    print(f"  Loading {len(df)} records from {csv_path}...")
    
    # Insert rows
    for _, row in df.iterrows():
        await session.execute(
            text("""
                INSERT INTO business_data 
                (date, revenue, expenses, marketing_spend, inventory_level, 
                 units_sold, customer_count, customer_acquisition_cost, churn_rate, profit_margin)
                VALUES (:date, :revenue, :expenses, :marketing_spend, :inventory_level,
                        :units_sold, :customer_count, :customer_acquisition_cost, :churn_rate, :profit_margin)
            """),
            {
                "date": row["date"],
                "revenue": float(row["revenue"]),
                "expenses": float(row["expenses"]),
                "marketing_spend": float(row["marketing_spend"]),
                "inventory_level": int(row["inventory_level"]),
                "units_sold": int(row["units_sold"]),
                "customer_count": int(row["customer_count"]),
                "customer_acquisition_cost": float(row["customer_acquisition_cost"]),
                "churn_rate": float(row["churn_rate"]),
                "profit_margin": float(row["profit_margin"]),
            }
        )
    
    await session.commit()
    print(f"  Successfully seeded {len(df)} records.")
    return len(df)
