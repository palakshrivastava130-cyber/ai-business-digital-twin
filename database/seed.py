"""
Database Seeder Script
Loads synthetic business data from CSV into PostgreSQL.
Can be run independently: python database/seed.py
"""

import os
import sys
import csv

# Add parent directory to path so we can import from backend
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))


def seed_sync():
    """Synchronous database seeding using psycopg2."""
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2
    
    # Database connection
    db_url = os.environ.get(
        "DATABASE_URL_SYNC",
        "postgresql://postgres:password@localhost:5432/digital_twin"
    )
    
    print(f"Connecting to: {db_url}")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Create table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS business_data (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            revenue DECIMAL(12, 2) NOT NULL,
            expenses DECIMAL(12, 2) NOT NULL,
            marketing_spend DECIMAL(12, 2) NOT NULL,
            inventory_level INTEGER NOT NULL,
            units_sold INTEGER NOT NULL,
            customer_count INTEGER NOT NULL,
            customer_acquisition_cost DECIMAL(8, 2) NOT NULL,
            churn_rate DECIMAL(6, 4) NOT NULL,
            profit_margin DECIMAL(6, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    # Check if data exists
    cur.execute("SELECT COUNT(*) FROM business_data")
    count = cur.fetchone()[0]
    if count > 0:
        print(f"Database already contains {count} records. Skipping seed.")
        cur.close()
        conn.close()
        return
    
    # Find CSV
    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "ml", "data", "synthetic_business_data.csv"
    )
    
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV not found at {csv_path}")
        print("Run 'python ml/generate_synthetic_data.py' first.")
        sys.exit(1)
    
    # Insert data
    print(f"Loading data from {csv_path}...")
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        inserted = 0
        for row in reader:
            cur.execute(
                """INSERT INTO business_data 
                (date, revenue, expenses, marketing_spend, inventory_level,
                 units_sold, customer_count, customer_acquisition_cost, churn_rate, profit_margin)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    row["date"], float(row["revenue"]), float(row["expenses"]),
                    float(row["marketing_spend"]), int(row["inventory_level"]),
                    int(row["units_sold"]), int(row["customer_count"]),
                    float(row["customer_acquisition_cost"]),
                    float(row["churn_rate"]), float(row["profit_margin"]),
                )
            )
            inserted += 1
    
    conn.commit()
    print(f"Successfully inserted {inserted} records.")
    
    cur.close()
    conn.close()


if __name__ == "__main__":
    seed_sync()
