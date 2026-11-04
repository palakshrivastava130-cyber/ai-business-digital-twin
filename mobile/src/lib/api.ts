/**
 * API client for the AI Business Digital Twin mobile app.
 * Configured with the machine's LAN IP for seamless Expo Go testing.
 *
 * HOW TO UPDATE: If your machine's IP changes, update API_BASE below.
 * Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your LAN IP.
 */

import type {
  KPISummary,
  TimeSeriesPoint,
  SimulationRequest,
  SimulationResponse,
  LLMInsight,
} from './types';

// LAN IP auto-detected from your machine (10.249.162.172).
// Change this if your IP changes or you're testing on a different network.
export const API_BASE = 'http://10.249.162.172:8000';

// ─────────────────────────────────────────────────────────────
// Generic fetch wrapper
// ─────────────────────────────────────────────────────────────
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

/** Check backend health */
export async function checkHealth(): Promise<{ status: string }> {
  return fetchAPI('/api/v1/health');
}

/** Fetch aggregated KPI summary */
export async function fetchKPIs(): Promise<KPISummary> {
  return fetchAPI<KPISummary>('/api/v1/data/summary');
}

/** Fetch time series data for charts (monthly sampling for mobile performance) */
export async function fetchTimeSeries(interval = 'monthly'): Promise<TimeSeriesPoint[]> {
  return fetchAPI<TimeSeriesPoint[]>(`/api/v1/data/timeseries?interval=${interval}`);
}

/** Run a What-If simulation */
export async function runSimulation(request: SimulationRequest): Promise<SimulationResponse> {
  return fetchAPI<SimulationResponse>('/api/v1/simulate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/** Get LLM-powered business insights */
export async function getAdvisorInsights(
  simulationResult: SimulationResponse,
  additionalContext?: string,
): Promise<LLMInsight> {
  return fetchAPI<LLMInsight>('/api/v1/advisor/insights', {
    method: 'POST',
    body: JSON.stringify({
      simulation_result: simulationResult,
      additional_context: additionalContext,
    }),
  });
}

/** Get simulation history */
export async function getSimulationHistory(limit = 10): Promise<SimulationResponse[]> {
  return fetchAPI<SimulationResponse[]>(`/api/v1/simulations/history?limit=${limit}`);
}
