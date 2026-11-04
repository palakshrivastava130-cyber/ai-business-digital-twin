-- ============================================
-- AI Business Digital Twin - Database Schema
-- ============================================

-- Create the database (run this separately if needed)
-- CREATE DATABASE digital_twin;

-- Business data table (historical metrics)
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
);

-- Simulation logs table
CREATE TABLE IF NOT EXISTS simulation_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scenario_name VARCHAR(255) NOT NULL DEFAULT 'Custom Scenario',
    parameters JSONB NOT NULL,
    baseline_prediction JSONB NOT NULL,
    scenario_prediction JSONB NOT NULL,
    llm_insights TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_business_data_date ON business_data(date);
CREATE INDEX IF NOT EXISTS idx_simulation_logs_timestamp ON simulation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_business_data_date_range ON business_data(date DESC);
