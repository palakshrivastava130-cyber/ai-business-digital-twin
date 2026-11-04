"""
Synthetic Business Data Generator
Generates 3 years of realistic business data with seasonal patterns,
growth trends, and correlated metrics for the Digital Twin platform.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os


def generate_synthetic_data(num_days: int = 1095, seed: int = 42) -> pd.DataFrame:
    """
    Generate realistic synthetic business data.
    
    Args:
        num_days: Number of days of data to generate (default: 3 years = 1095)
        seed: Random seed for reproducibility
    
    Returns:
        DataFrame with columns: date, revenue, expenses, marketing_spend,
        inventory_level, units_sold, customer_count, customer_acquisition_cost,
        churn_rate, profit_margin
    """
    np.random.seed(seed)
    
    # --- Date range ---
    start_date = datetime(2022, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(num_days)]
    
    # --- Base growth trajectory (slight upward trend) ---
    growth_factor = np.linspace(1.0, 1.45, num_days)
    
    # --- Seasonal patterns ---
    day_of_year = np.array([d.timetuple().tm_yday for d in dates])
    
    # Holiday spikes (Nov-Dec), summer dip (Jun-Jul), Q1 recovery
    seasonal = (
        0.15 * np.sin(2 * np.pi * day_of_year / 365 - np.pi / 2)  # Annual cycle
        + 0.08 * np.sin(4 * np.pi * day_of_year / 365)              # Semi-annual
        + 0.05 * np.where((day_of_year >= 320) & (day_of_year <= 365), 1.0, 0.0)  # Holiday boost
    )
    
    # --- Day of week effect (weekends = lower sales) ---
    day_of_week = np.array([d.weekday() for d in dates])
    weekend_effect = np.where(day_of_week >= 5, 0.7, 1.0)
    
    # --- Marketing spend (with budget cycles) ---
    base_marketing = 5000
    marketing_seasonal = 1 + 0.3 * np.sin(2 * np.pi * day_of_year / 365 + np.pi / 4)
    marketing_noise = np.random.normal(0, 500, num_days)
    marketing_spend = np.maximum(
        1000, 
        base_marketing * growth_factor * marketing_seasonal + marketing_noise
    ).round(2)
    
    # --- Revenue (correlated with marketing, seasonal, growth) ---
    base_revenue = 25000
    marketing_effect = 0.8 * (marketing_spend / base_marketing)  # Higher marketing -> higher revenue
    revenue_noise = np.random.normal(0, 2000, num_days)
    revenue = np.maximum(
        5000,
        base_revenue * growth_factor * (1 + seasonal) * weekend_effect * marketing_effect + revenue_noise
    ).round(2)
    
    # --- Units sold (derived from revenue with price variation) ---
    avg_price = np.linspace(45, 52, num_days) + np.random.normal(0, 2, num_days)
    units_sold = np.maximum(10, (revenue / avg_price).astype(int))
    
    # --- Inventory level (inverse relationship with sales velocity) ---
    base_inventory = 5000
    inventory_noise = np.random.normal(0, 200, num_days)
    # Restock cycles every ~30 days with gradual depletion
    restock_cycle = 800 * np.abs(np.sin(2 * np.pi * np.arange(num_days) / 30))
    inventory_level = np.maximum(
        500,
        (base_inventory - units_sold * 2 + restock_cycle + inventory_noise).astype(int)
    )
    
    # --- Expenses (correlated with revenue, includes fixed + variable) ---
    fixed_expenses = 12000
    variable_expense_ratio = 0.35
    expense_noise = np.random.normal(0, 1000, num_days)
    expenses = np.maximum(
        5000,
        fixed_expenses * growth_factor + variable_expense_ratio * revenue + expense_noise
    ).round(2)
    
    # --- Customer metrics ---
    base_customers = 2000
    customer_growth = np.cumsum(np.random.poisson(3, num_days))  # Gradual growth
    customer_churn = np.cumsum(np.random.poisson(1.5, num_days))  # Some churn
    customer_count = np.maximum(500, base_customers + customer_growth - customer_churn)
    
    # Customer acquisition cost (inverse of marketing efficiency)
    cac_base = 35
    cac_noise = np.random.normal(0, 5, num_days)
    customer_acquisition_cost = np.maximum(
        10,
        cac_base * (1 + 0.1 * np.sin(2 * np.pi * day_of_year / 365)) + cac_noise
    ).round(2)
    
    # Churn rate (slight upward pressure, seasonal variation)
    base_churn = 0.025
    churn_noise = np.random.normal(0, 0.005, num_days)
    churn_rate = np.clip(
        base_churn + 0.005 * np.sin(2 * np.pi * day_of_year / 365) + churn_noise,
        0.005, 0.08
    ).round(4)
    
    # --- Profit margin ---
    profit_margin = np.clip(
        ((revenue - expenses - marketing_spend) / revenue * 100),
        -15, 45
    ).round(2)
    
    # --- Build DataFrame ---
    df = pd.DataFrame({
        "date": dates,
        "revenue": revenue,
        "expenses": expenses,
        "marketing_spend": marketing_spend,
        "inventory_level": inventory_level,
        "units_sold": units_sold,
        "customer_count": customer_count,
        "customer_acquisition_cost": customer_acquisition_cost,
        "churn_rate": churn_rate,
        "profit_margin": profit_margin,
    })
    
    return df


if __name__ == "__main__":
    print("Generating synthetic business data...")
    df = generate_synthetic_data()
    
    # Save to CSV
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "synthetic_business_data.csv")
    df.to_csv(output_path, index=False)
    
    print(f"Generated {len(df)} rows of data")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Saved to: {output_path}")
    print("\nSample statistics:")
    print(df.describe().round(2))
