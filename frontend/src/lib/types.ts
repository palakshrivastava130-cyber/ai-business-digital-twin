/**
 * TypeScript type definitions matching backend Pydantic schemas.
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
  revenue_p10?: number;
  revenue_p50?: number;
  revenue_p90?: number;
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
  revenue_p10?: number;
  revenue_p50?: number;
  revenue_p90?: number;
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

export interface ExecutivePersonaInsight {
  role: "CFO" | "CMO" | "COO" | string;
  title: string;
  perspective: string;
  analysis: string;
  key_risks: string[];
  action_items: string[];
  confidence: "Low" | "Medium" | "High" | string;
  impact_score: number;
}

export interface LLMInsight {
  executive_summary: string;
  key_risks: string[];
  recommendations: string[];
  confidence: "Low" | "Medium" | "High";
  confidence_rationale: string;
  cfo_viewpoint?: ExecutivePersonaInsight;
  cmo_viewpoint?: ExecutivePersonaInsight;
  coo_viewpoint?: ExecutivePersonaInsight;
  raw_response?: string;
}

export interface AdvisorRequest {
  simulation_result: SimulationResponse;
  additional_context?: string;
}

export interface SensitivityCell {
  price_change: number;
  marketing_spend_change: number;
  revenue: number;
  profit_margin: number;
}

export interface SensitivityResponse {
  grid: SensitivityCell[];
  optimal: SensitivityCell;
}

export interface CompetitorReactionResponse {
  competitor_strategy_name: string;
  counter_moves: string[];
  market_share_erosion_risk: "Low" | "Medium" | "High" | "Critical" | string;
  risk_score: number;
  defense_recommendations: string[];
}


