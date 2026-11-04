"use client";

import { useState } from "react";
import {
  History,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { SimulationResponse, SimulationRequest } from "@/lib/types";

interface ScenarioHistoryTableProps {
  historyList: SimulationResponse[];
  onReloadScenario: (params: SimulationRequest) => void;
  onRefreshHistory: () => void;
  isLoading?: boolean;
}

export default function ScenarioHistoryTable({
  historyList,
  onReloadScenario,
  onRefreshHistory,
  isLoading = false,
}: ScenarioHistoryTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Format timestamp nicely
  const formatTime = (tsStr?: string | Date | null) => {
    if (!tsStr) return "";
    const date = new Date(tsStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Helper to render non-zero parameter changes as tiny chips
  const renderParamDiffs = (params: SimulationRequest) => {
    const diffs: React.ReactNode[] = [];

    if (params.marketing_spend_change !== 0) {
      diffs.push(
        <span key="mkt" className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">
          Mkt: {params.marketing_spend_change > 0 ? "+" : ""}{params.marketing_spend_change}%
        </span>
      );
    }
    if (params.price_change !== 0) {
      diffs.push(
        <span key="prc" className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
          Prc: {params.price_change > 0 ? "+" : ""}{params.price_change}%
        </span>
      );
    }
    if (params.inventory_change !== 1.0) {
      diffs.push(
        <span key="inv" className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
          Inv: {params.inventory_change}x
        </span>
      );
    }
    if (params.cac_change !== 0) {
      diffs.push(
        <span key="cac" className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono">
          CAC: {params.cac_change > 0 ? "+" : ""}{params.cac_change}%
        </span>
      );
    }
    if (params.expense_change !== 0) {
      diffs.push(
        <span key="exp" className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
          Exp: {params.expense_change > 0 ? "+" : ""}{params.expense_change}%
        </span>
      );
    }

    if (diffs.length === 0) {
      return <span className="text-[10px] text-slate-500 italic">No parameter changes (Baseline)</span>;
    }

    return <div className="flex flex-wrap gap-1.5">{diffs}</div>;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl animate-fade-in">
      {/* Table Accordion Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCollapsed(!isCollapsed)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
        className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <History size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              Simulation Run History
              {historyList.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">
                  {historyList.length} logs
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Audit history of scenario predictions and parameter configurations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Refresh History button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefreshHistory();
            }}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Refresh history logs"
          >
            <RotateCcw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>

          <div className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      {!isCollapsed && (
        <div className="mt-5 border-t border-slate-800/80 pt-4 animate-fade-in overflow-x-auto">
          {historyList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No simulation logs found. Run a simulation scenario to populate history.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Scenario Name</th>
                  <th className="py-2.5 px-3">Parameter Shifts</th>
                  <th className="py-2.5 px-3 text-right">Predicted Deltas</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {historyList.map((log) => {
                  const revDelta = log.deltas.revenue_change_pct || 0;
                  const marginDelta = log.deltas.profit_margin_change_pct || 0;

                  return (
                    <tr
                      key={log.id || log.timestamp?.toString()}
                      className="text-xs hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Time */}
                      <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-slate-600" />
                          {formatTime(log.timestamp)}
                        </span>
                      </td>

                      {/* Scenario Name */}
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {log.scenario_name}
                      </td>

                      {/* Diffs */}
                      <td className="py-3 px-3">
                        {renderParamDiffs(log.parameters)}
                      </td>

                      {/* Outcome Deltas */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border ${
                              revDelta >= 0
                                ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            Rev: {revDelta >= 0 ? "+" : ""}{revDelta.toFixed(1)}%
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border ${
                              marginDelta >= 0
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            Marg: {marginDelta >= 0 ? "+" : ""}{marginDelta.toFixed(1)}% pts
                          </span>
                        </div>
                      </td>

                      {/* Reload Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onReloadScenario(log.parameters)}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 text-[10px] font-semibold text-slate-300 transition-all flex items-center gap-1 mx-auto"
                        >
                          <RotateCcw size={10} />
                          Reload
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
