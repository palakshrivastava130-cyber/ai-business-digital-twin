"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Activity,
  Package,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Database,
  FileText,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ExpenseBreakdown from "@/components/dashboard/ExpenseBreakdown";
import CustomerMetrics from "@/components/dashboard/CustomerMetrics";
import SimulationPanel from "@/components/simulation/SimulationPanel";
import ScenarioCompare from "@/components/simulation/ScenarioCompare";
import AdvisorPanel from "@/components/advisor/AdvisorPanel";
import ExecutiveExportModal from "@/components/dashboard/ExecutiveExportModal";
import ScenarioHistoryTable from "@/components/simulation/ScenarioHistoryTable";
import StrategyChatDrawer from "@/components/advisor/StrategyChatDrawer";
import Header from "@/components/dashboard/Header";
import SensitivityHeatmap from "@/components/dashboard/SensitivityHeatmap";
import CompetitorReactions from "@/components/advisor/CompetitorReactions";
import { fetchKPIs, fetchTimeSeries, runSimulation, checkHealth, getAdvisorInsights, getSimulationHistory } from "@/lib/api";
import type {
  KPISummary,
  TimeSeriesPoint,
  SimulationRequest,
  SimulationResponse,
  LLMInsight,
} from "@/lib/types";

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [advisorInsights, setAdvisorInsights] = useState<LLMInsight | null>(null);
  const [history, setHistory] = useState<SimulationResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeReloadParams, setActiveReloadParams] = useState<SimulationRequest | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");


  // Load simulation history
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const logs = await getSimulationHistory();
      setHistory(logs);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Load dashboard data
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [kpiData, tsData] = await Promise.all([
        fetchKPIs(),
        fetchTimeSeries(),
        loadHistory(),
      ]);
      setKpis(kpiData);
      setTimeSeries(tsData);
      setApiStatus("online");
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(err.message);
      setApiStatus("offline");
    } finally {
      setIsLoadingData(false);
    }
  }, [loadHistory]);

  useEffect(() => {
    // Check API health first
    checkHealth()
      .then(() => {
        setApiStatus("online");
        loadData();
      })
      .catch(() => {
        setApiStatus("offline");
        setIsLoadingData(false);
      });
  }, [loadData]);

  // Handle simulation
  const handleSimulate = async (request: SimulationRequest) => {
    setIsSimulating(true);
    try {
      const result = await runSimulation(request);
      setSimulationResult(result);
      // Refresh history list to show the new run
      await loadHistory();
      // Asynchronously fetch advisor insights for export brief
      getAdvisorInsights(result).then((ins) => setAdvisorInsights(ins)).catch(() => {});
    } catch (err: any) {
      console.error("Simulation failed:", err);
      setError(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReloadScenario = (params: SimulationRequest) => {
    setActiveReloadParams(params);
    handleSimulate(params);
  };

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col justify-between selection:bg-blue-500/30 selection:text-white">
      {/* ─── Executive Top Navigation Bar ─────────────────────────────── */}
      <Header
        apiStatus={apiStatus}
        kpis={kpis}
        onExportClick={() => setIsExportModalOpen(true)}
        onRefreshClick={loadData}
        isLoadingData={isLoadingData}
        lastUpdated={lastUpdated}
      />

      {/* ─── Main Content Canvas ─────────────────────────────────────── */}
      <main className="max-w-[1680px] mx-auto px-6 py-8 w-full flex-1">
        {/* Offline Banner */}
        {apiStatus === "offline" && (
          <div className="mb-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4.5 flex items-center justify-between animate-fade-in shadow-xl shadow-rose-500/5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm text-rose-200 font-semibold">Backend Inference Engine Unreachable</p>
                <p className="text-xs text-rose-300/70 mt-0.5">
                  Verify the FastAPI server is running on <code className="bg-rose-950/60 px-1 py-0.5 rounded text-rose-200">http://localhost:8000</code>
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-600/30"
            >
              Retry Connection
            </button>
          </div>
        )}


        {/* ─── Section 1: KPI Overview ─────────────────────────────────── */}
        <section className="mb-9">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-blue-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Key Performance Indicators
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="Total Revenue"
              value={kpis?.total_revenue || 0}
              format="currency"
              icon={<DollarSign size={18} />}
              color="blue"
              delay={0}
              subtitle="Cumulative 3-year run"
              trend={kpis ? 14.8 : undefined}
            />
            <KPICard
              title="Total Expenses"
              value={kpis?.total_expenses || 0}
              format="currency"
              icon={<TrendingDown size={18} />}
              color="rose"
              delay={80}
              subtitle="Operating & marketing"
              trend={kpis ? -3.2 : undefined}
            />
            <KPICard
              title="Profit Margin"
              value={kpis?.avg_profit_margin || 0}
              format="percent"
              icon={<TrendingUp size={18} />}
              color="emerald"
              delay={160}
              subtitle="Net operating yield"
              trend={kpis ? 4.5 : undefined}
            />
            <KPICard
              title="Total Customers"
              value={kpis?.total_customers || 0}
              format="number"
              icon={<Users size={18} />}
              color="purple"
              delay={240}
              subtitle="Active enterprise base"
              trend={kpis ? 8.1 : undefined}
            />
            <KPICard
              title="Avg Churn Rate"
              value={(kpis?.avg_churn_rate || 0) * 100}
              format="percent"
              icon={<Activity size={18} />}
              color="amber"
              delay={320}
              subtitle="Monthly churn baseline"
              trend={kpis ? -1.4 : undefined}
            />
            <KPICard
              title="Avg Inventory"
              value={kpis?.avg_inventory_level || 0}
              format="number"
              icon={<Package size={18} />}
              color="cyan"
              delay={400}
              subtitle="Buffer unit stock"
              trend={kpis ? 2.0 : undefined}
            />
          </div>
        </section>

        {/* ─── Section 2: Charts & Visual Analytics ──────────────────────── */}
        <section className="mb-9">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 rounded-full bg-indigo-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Enterprise Telemetry Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              <RevenueChart data={timeSeries} isLoading={isLoadingData} />
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <ExpenseBreakdown kpis={kpis} isLoading={isLoadingData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              <CustomerMetrics data={timeSeries} isLoading={isLoadingData} />
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <SensitivityHeatmap />
            </div>
          </div>
        </section>

        {/* ─── Section 3: What-If Simulation & AI Decision Suite ────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 rounded-full bg-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Simulation Engine & Strategic Decision Support
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Controls */}
            <div className="lg:col-span-4">
              <SimulationPanel
                onSimulate={handleSimulate}
                isLoading={isSimulating}
                result={simulationResult}
                activeParams={activeReloadParams}
              />
            </div>

            {/* Right: Delta Comparison & Generative Insights */}
            <div className="lg:col-span-8 space-y-6">
              <ScenarioCompare result={simulationResult} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <AdvisorPanel simulationResult={simulationResult} />
                <CompetitorReactions simulationResult={simulationResult} />
              </div>
            </div>
          </div>

          {/* Collapsible Scenario History Table */}
          <div className="mt-6">
            <ScenarioHistoryTable
              historyList={history}
              onReloadScenario={handleReloadScenario}
              onRefreshHistory={loadHistory}
              isLoading={isHistoryLoading}
            />
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-800/80 bg-[#060911] py-6 px-6">
        <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-blue-500" />
            <span>AI Business Digital Twin Platform · Model Walk-Forward Engine v1.2</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-slate-200 cursor-pointer">Documentation</span>
            <span>•</span>
            <span className="hover:text-slate-200 cursor-pointer">API Reference</span>
            <span>•</span>
            <span className="hover:text-slate-200 cursor-pointer">Gemini Insights</span>
          </div>
        </div>
      </footer>

      {/* ─── Executive Audit Brief Export Modal ────────────────────── */}
      <ExecutiveExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        kpis={kpis}
        simulationResult={simulationResult}
        insights={advisorInsights}
      />

      {/* ─── Floating Strategy Chat Drawer ─────────────────────────── */}
      <StrategyChatDrawer simulationResult={simulationResult} />
    </div>
  );
}
