"use client";

import { useState } from "react";
import {
  X,
  Printer,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  BrainCircuit,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import type { KPISummary, SimulationResponse, LLMInsight } from "@/lib/types";

interface ExecutiveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: KPISummary | null;
  simulationResult: SimulationResponse | null;
  insights: LLMInsight | null;
}

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toLocaleString()}`;
};

export default function ExecutiveExportModal({
  isOpen,
  onClose,
  kpis,
  simulationResult,
  insights,
}: ExecutiveExportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Executive Audit Brief</h3>
              <p className="text-[11px] text-slate-400">Board-ready strategic briefing & scenario audit</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Audit Document Canvas */}
        <div className="p-8 sm:p-10 overflow-y-auto space-y-8 print:p-0 print:space-y-6 print:text-black print:bg-white text-slate-200">
          {/* Header Banner */}
          <div className="border-b border-slate-800 print:border-black/20 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={20} className="text-blue-400 print:text-black" />
                <h1 className="text-xl font-bold tracking-tight text-white print:text-black">
                  Enterprise Strategic Briefing
                </h1>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600">
                AI Business Digital Twin · Multi-Agent Governance & Risk Corridor Analysis
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5">
              <div className="font-mono font-semibold text-slate-200 print:text-black">{currentDate}</div>
              <div>Classification: Confidential Executive Audit</div>
              <div>Engine: Walk-Forward ML v1.2</div>
            </div>
          </div>

          {/* Section 1: Active Baseline KPI Matrix */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 print:text-slate-800 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 print:bg-black" />
              1. Current Enterprise Run-Rate Telemetry
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">Total Revenue</span>
                <span className="text-sm font-bold font-mono text-white print:text-black mt-0.5 block">
                  {kpis ? formatCurrency(kpis.total_revenue) : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">Total Burn</span>
                <span className="text-sm font-bold font-mono text-white print:text-black mt-0.5 block">
                  {kpis ? formatCurrency(kpis.total_expenses) : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">Net Margin</span>
                <span className="text-sm font-bold font-mono text-emerald-400 print:text-black mt-0.5 block">
                  {kpis ? `${kpis.avg_profit_margin.toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">Customer Base</span>
                <span className="text-sm font-bold font-mono text-white print:text-black mt-0.5 block">
                  {kpis ? kpis.total_customers.toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">Avg Churn Rate</span>
                <span className="text-sm font-bold font-mono text-amber-400 print:text-black mt-0.5 block">
                  {kpis ? `${(kpis.avg_churn_rate * 100).toFixed(2)}%` : "N/A"}
                </span>
              </div>
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 print:text-slate-600 block">Avg CAC</span>
                <span className="text-sm font-bold font-mono text-white print:text-black mt-0.5 block">
                  {kpis ? `$${kpis.avg_cac.toFixed(0)}` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Active What-If Scenario Audit */}
          {simulationResult ? (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 print:text-slate-800 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500 print:bg-black" />
                2. What-If Simulation: &ldquo;{simulationResult.scenario_name}&rdquo;
              </h2>
              <div className="bg-slate-950/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 rounded-xl p-4.5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 print:text-slate-600 text-[11px] block">Projected Revenue:</span>
                    <span className="font-mono font-bold text-white print:text-black text-sm">
                      {formatCurrency(simulationResult.scenario.predicted_revenue)}
                    </span>
                    <span className={`text-[11px] font-semibold ml-1.5 ${simulationResult.deltas.revenue_change_pct >= 0 ? "text-emerald-400 print:text-green-700" : "text-rose-400 print:text-red-700"}`}>
                      ({simulationResult.deltas.revenue_change_pct >= 0 ? "+" : ""}{simulationResult.deltas.revenue_change_pct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 print:text-slate-600 text-[11px] block">Profit Margin:</span>
                    <span className="font-mono font-bold text-white print:text-black text-sm">
                      {simulationResult.scenario.predicted_profit_margin.toFixed(1)}%
                    </span>
                    <span className={`text-[11px] font-semibold ml-1.5 ${simulationResult.deltas.profit_margin_change_pct >= 0 ? "text-emerald-400 print:text-green-700" : "text-rose-400 print:text-red-700"}`}>
                      ({simulationResult.deltas.profit_margin_change_pct >= 0 ? "+" : ""}{simulationResult.deltas.profit_margin_change_pct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 print:text-slate-600 text-[11px] block">Inventory Level:</span>
                    <span className="font-mono font-bold text-white print:text-black text-sm">
                      {simulationResult.scenario.predicted_inventory.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 print:text-slate-600 text-[11px] block">Churn Probability:</span>
                    <span className="font-mono font-bold text-white print:text-black text-sm">
                      {(simulationResult.scenario.predicted_churn_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 print:border-slate-300 p-4 text-xs text-slate-500">
              No active scenario simulated. Run a What-If scenario to populate predictive impact deltas.
            </div>
          )}

          {/* Section 3: Multi-Agent C-Suite Advisory Breakdown */}
          {insights && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 print:bg-black" />
                3. Multi-Agent Strategic Advisory Synthesis
              </h2>

              {/* Executive Summary */}
              <div className="bg-purple-950/20 print:bg-slate-100 border border-purple-800/40 print:border-slate-300 rounded-xl p-4">
                <h3 className="text-xs font-bold text-purple-300 print:text-black mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400" />
                  Executive Committee Consensus
                </h3>
                <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed">
                  {insights.executive_summary}
                </p>
              </div>

              {/* 3 Executive Personas Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* CFO View */}
                {insights.cfo_viewpoint && (
                  <div className="bg-slate-950/60 print:bg-slate-100 border border-emerald-500/30 print:border-slate-300 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1.5">
                      <span className="text-xs font-bold text-emerald-300 print:text-black">Virtual CFO</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">{insights.cfo_viewpoint.impact_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-300 print:text-slate-700 leading-normal">
                      {insights.cfo_viewpoint.analysis}
                    </p>
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Key Actions:</span>
                      <ul className="text-[10px] text-slate-400 print:text-slate-600 list-disc list-inside space-y-0.5">
                        {insights.cfo_viewpoint.action_items.slice(0, 2).map((a, i) => (
                          <li key={i} className="truncate">{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* CMO View */}
                {insights.cmo_viewpoint && (
                  <div className="bg-slate-950/60 print:bg-slate-100 border border-indigo-500/30 print:border-slate-300 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1.5">
                      <span className="text-xs font-bold text-indigo-300 print:text-black">Virtual CMO</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-semibold">{insights.cmo_viewpoint.impact_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-300 print:text-slate-700 leading-normal">
                      {insights.cmo_viewpoint.analysis}
                    </p>
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Key Actions:</span>
                      <ul className="text-[10px] text-slate-400 print:text-slate-600 list-disc list-inside space-y-0.5">
                        {insights.cmo_viewpoint.action_items.slice(0, 2).map((a, i) => (
                          <li key={i} className="truncate">{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* COO View */}
                {insights.coo_viewpoint && (
                  <div className="bg-slate-950/60 print:bg-slate-100 border border-amber-500/30 print:border-slate-300 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1.5">
                      <span className="text-xs font-bold text-amber-300 print:text-black">Virtual COO</span>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">{insights.coo_viewpoint.impact_score}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-300 print:text-slate-700 leading-normal">
                      {insights.coo_viewpoint.analysis}
                    </p>
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Key Actions:</span>
                      <ul className="text-[10px] text-slate-400 print:text-slate-600 list-disc list-inside space-y-0.5">
                        {insights.coo_viewpoint.action_items.slice(0, 2).map((a, i) => (
                          <li key={i} className="truncate">{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Signoff Footer */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
            <span>Audit Signature: AI-TWIN-AUTHSIG-{Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
            <span>Generated via AI Business Digital Twin Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
