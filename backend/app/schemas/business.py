"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


# ─── Business Data Schemas ────────────────────────────────────

class BusinessDataCreate(BaseModel):
    """Schema for creating a business data record."""
    date: date
    revenue: float
    expenses: float
    marketing_spend: float
    inventory_level: int
    units_sold: int
    customer_count: int
    customer_acquisition_cost: float
    churn_rate: float
    profit_margin: float


class BusinessDataResponse(BaseModel):
    """Schema for business data API response."""
    id: int
    date: date
    revenue: float
    expenses: float
    marketing_spend: float
    inventory_level: int
    units_sold: int
    customer_count: int
    customer_acquisition_cost: float
    churn_rate: float
    profit_margin: float
    
    class Config:
        from_attributes = True


class KPISummary(BaseModel):
    """Aggregated KPI summary for the dashboard."""
    total_revenue: float
    avg_daily_revenue: float
    total_expenses: float
    avg_profit_margin: float
    total_customers: int
    avg_churn_rate: float
    total_units_sold: int
    avg_inventory_level: float
    avg_cac: float
    total_marketing_spend: float
    data_points: int
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None


class TimeSeriesPoint(BaseModel):
    """Single data point in a time series with optional Monte Carlo prediction corridors."""
    date: str
    revenue: float
    expenses: float
    marketing_spend: float
    inventory_level: int
    units_sold: int
    customer_count: int
    churn_rate: float
    profit_margin: float
    revenue_p10: Optional[float] = None
    revenue_p50: Optional[float] = None
    revenue_p90: Optional[float] = None


# ─── Simulation Schemas ───────────────────────────────────────

class SimulationRequest(BaseModel):
    """Request schema for running a what-if simulation."""
    scenario_name: str = Field(default="Custom Scenario", description="Name for this scenario")
    marketing_spend_change: float = Field(default=0.0, description="% change in marketing spend (-50 to 100)")
    price_change: float = Field(default=0.0, description="% change in product price (-20 to 30)")
    inventory_change: float = Field(default=0.0, description="Multiplier for inventory order frequency (0.5 to 2.0)")
    cac_change: float = Field(default=0.0, description="% change in customer acquisition cost (-50 to 100)")
    expense_change: float = Field(default=0.0, description="% change in operating expenses (-30 to 50)")


class PredictionMetrics(BaseModel):
    """Predicted metrics from the ML model."""
    predicted_revenue: float
    predicted_inventory: float
    predicted_churn_probability: float
    predicted_profit_margin: float
    revenue_p10: Optional[float] = None
    revenue_p50: Optional[float] = None
    revenue_p90: Optional[float] = None


class SimulationResponse(BaseModel):
    """Response from a simulation run."""
    id: Optional[int] = None
    scenario_name: str
    parameters: SimulationRequest
    baseline: PredictionMetrics
    scenario: PredictionMetrics
    deltas: dict = Field(default_factory=dict, description="Percentage changes between baseline and scenario")
    timestamp: Optional[datetime] = None


# ─── LLM Advisor Schemas ─────────────────────────────────────

class ExecutivePersonaInsight(BaseModel):
    """Role-specific strategic assessment for a C-suite executive."""
    role: str = Field(description="Role identifier: CFO, CMO, or COO")
    title: str = Field(description="Display title, e.g. Chief Financial Officer")
    perspective: str = Field(description="Core domain of strategic responsibility")
    analysis: str = Field(description="Executive viewpoint and impact analysis")
    key_risks: list[str] = Field(default_factory=list, description="Role-specific risks")
    action_items: list[str] = Field(default_factory=list, description="Concrete strategic action items")
    confidence: str = Field(default="High", description="Low / Medium / High")
    impact_score: int = Field(default=85, description="Projected impact score from 1 to 100")


class AdvisorRequest(BaseModel):
    """Request for LLM business insights."""
    simulation_result: SimulationResponse
    additional_context: Optional[str] = None


class LLMInsightResponse(BaseModel):
    """Structured LLM response with business insights and C-suite viewpoints."""
    executive_summary: str
    key_risks: list[str]
    recommendations: list[str]
    confidence: str = Field(description="Low / Medium / High")
    confidence_rationale: str
    cfo_viewpoint: Optional[ExecutivePersonaInsight] = None
    cmo_viewpoint: Optional[ExecutivePersonaInsight] = None
    coo_viewpoint: Optional[ExecutivePersonaInsight] = None
    raw_response: Optional[str] = None


# ─── Flagship Feature Schemas ─────────────────────────────────

class GoalSeekRequest(BaseModel):
    """Request schema for reverse goal-seek parameter solver."""
    target_revenue: Optional[float] = None
    target_profit_margin: Optional[float] = None


class ChatRequest(BaseModel):
    """Request schema for strategic conversational copilot."""
    message: str
    simulation_result: Optional[SimulationResponse] = None
    history: list[dict] = Field(default_factory=list, description="Conversation history context")


class ChatResponse(BaseModel):
    """Response schema from strategic conversational copilot."""
    response: str


# ─── Advanced Decision Intelligence Schemas ───────────────────

class SensitivityCell(BaseModel):
    """A single cell inside the 5x5 sensitivity matrix."""
    price_change: float
    marketing_spend_change: float
    revenue: float
    profit_margin: float


class SensitivityResponse(BaseModel):
    """Response matrix containing the sensitivity grid and optimal sweet spot."""
    grid: list[SensitivityCell]
    optimal: SensitivityCell


class CompetitorReactionResponse(BaseModel):
    """Reaction forecast predicting competitor counters to active scenario."""
    competitor_strategy_name: str
    counter_moves: list[str]
    market_share_erosion_risk: str  # Low / Medium / High / Critical
    risk_score: int                 # 0 to 100
    defense_recommendations: list[str]


