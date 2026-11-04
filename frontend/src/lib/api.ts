/**
 * API client for communicating with the FastAPI backend.
 */

import type {
  KPISummary,
  TimeSeriesPoint,
  SimulationRequest,
  SimulationResponse,
  LLMInsight,
  SensitivityResponse,
  CompetitorReactionResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const res = await fetch(url, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch aggregated KPI summary.
 */
export async function fetchKPIs(
  startDate?: string,
  endDate?: string
): Promise<KPISummary> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchAPI<KPISummary>(`/api/v1/data/summary${query}`);
}

/**
 * Fetch time series data for charts.
 */
export async function fetchTimeSeries(
  startDate?: string,
  endDate?: string,
  interval: string = "daily"
): Promise<TimeSeriesPoint[]> {
  const params = new URLSearchParams({ interval });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return fetchAPI<TimeSeriesPoint[]>(
    `/api/v1/data/timeseries?${params.toString()}`
  );
}

/**
 * Run a What-If simulation.
 */
export async function runSimulation(
  request: SimulationRequest
): Promise<SimulationResponse> {
  return fetchAPI<SimulationResponse>("/api/v1/simulate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get LLM-powered business insights.
 */
export async function getAdvisorInsights(
  simulationResult: SimulationResponse,
  additionalContext?: string
): Promise<LLMInsight> {
  return fetchAPI<LLMInsight>("/api/v1/advisor/insights", {
    method: "POST",
    body: JSON.stringify({
      simulation_result: simulationResult,
      additional_context: additionalContext,
    }),
  });
}

/**
 * Get simulation history.
 */
export async function getSimulationHistory(
  limit: number = 20
): Promise<SimulationResponse[]> {
  return fetchAPI<SimulationResponse[]>(
    `/api/v1/simulations/history?limit=${limit}`
  );
}

/**
 * Check API health.
 */
export async function checkHealth(): Promise<{
  status: string;
  components: Record<string, boolean>;
}> {
  return fetchAPI("/api/v1/health");
}

/**
 * Solve Reverse Goal-Seek parameters.
 */
export async function solveGoalSeek(
  targetRevenue?: number,
  targetProfitMargin?: number
): Promise<SimulationResponse> {
  return fetchAPI<SimulationResponse>("/api/v1/simulate/goal-seek", {
    method: "POST",
    body: JSON.stringify({
      target_revenue: targetRevenue || null,
      target_profit_margin: targetProfitMargin || null,
    }),
  });
}

/**
 * Converse with Gemini strategy copilot drawer.
 */
export async function sendStrategyChatMessage(
  message: string,
  simulationResult: SimulationResponse | null,
  history: Array<{ sender: "user" | "copilot"; text: string }>
): Promise<{ response: string }> {
  return fetchAPI<{ response: string }>("/api/v1/advisor/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      simulation_result: simulationResult,
      history,
    }),
  });
}

/**
 * Fetch Sensitivity Heatmap data.
 */
export async function fetchSensitivityHeatmap(): Promise<SensitivityResponse> {
  return fetchAPI<SensitivityResponse>("/api/v1/simulate/sensitivity", {
    method: "POST",
  });
}

/**
 * Fetch Adversarial Competitor Reaction forecasts.
 */
export async function fetchCompetitorReactions(
  simulationResult: SimulationResponse
): Promise<CompetitorReactionResponse> {
  return fetchAPI<CompetitorReactionResponse>("/api/v1/advisor/competitor", {
    method: "POST",
    body: JSON.stringify({
      simulation_result: simulationResult,
    }),
  });
}



