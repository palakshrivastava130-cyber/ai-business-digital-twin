/**
 * TypeScript interfaces matching the FastAPI backend Pydantic schemas.
 */

export interface KPISummary {
  total_revenue: number;
  avg_daily_revenue: number;
  total_expenses: number;
  avg_profit_margin: number;
  total_customers: number;
  avg_churn_rate: number;
  total_units_sold: number;
  avg_inventory_level: number;
  avg_cac: number;
  total_marketing_spend: number;
  data_points: number;
  date_range_start: string | null;
  date_range_end: string | null;
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  expenses: number;
  marketing_spend: number;
  inventory_level: number;
  units_sold: number;
  customer_count: number;
  churn_rate: number;
  profit_margin: number;
}

export interface SimulationRequest {
  scenario_name: string;
  marketing_spend_change: number;
  price_change: number;
  inventory_change: number;
  cac_change: number;
  expense_change: number;
}

export interface PredictionMetrics {
  predicted_revenue: number;
  predicted_inventory: number;
  predicted_churn_probability: number;
  predicted_profit_margin: number;
}

export interface SimulationResponse {
  id: number | null;
  scenario_name: string;
  parameters: SimulationRequest;
  baseline: PredictionMetrics;
  scenario: PredictionMetrics;
  deltas: Record<string, number>;
  timestamp: string | null;
}

export interface LLMInsight {
  executive_summary: string;
  key_risks: string[];
  recommendations: string[];
  confidence: 'Low' | 'Medium' | 'High';
  confidence_rationale: string;
  raw_response?: string;
}
