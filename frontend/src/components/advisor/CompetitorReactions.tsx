"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Bot,
  Zap,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import type { SimulationResponse, CompetitorReactionResponse } from "@/lib/types";
import { fetchCompetitorReactions } from "@/lib/api";

interface CompetitorReactionsProps {
  simulationResult: SimulationResponse | null;
}

const riskColors = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  High: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  Critical: "text-purple-400 bg-purple-500/10 border-purple-500/30 animate-pulse",
};

export default function CompetitorReactions({ simulationResult }: CompetitorReactionsProps) {
  const [reaction, setReaction] = useState<CompetitorReactionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReactions = async () => {
    if (!simulationResult) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCompetitorReactions(simulationResult);
      setReaction(res);
    } catch (err: any) {
      console.error("Failed to load competitor reaction:", err);
      setError(err.message || "Failed to load competitor reaction model");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getReactions();
  }, [simulationResult]);

  // If no simulation was run yet
  if (!simulationResult) {
    return (
      <div className="glass-card-enterprise p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="text-purple-400" size={16} />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Adversarial Competitor reaction</h3>
        </div>
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-500 italic">
          Run a scenario to trigger competitive rival modeling simulations.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-enterprise p-5 animate-fade-in flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Bot size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Adversarial Competitor Reaction
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Market rival response simulation</p>
            </div>
          </div>
          <button
            onClick={getReactions}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Recalculate counter-strategies"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-purple-400" : ""} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-slate-400">
            <Loader2 className="animate-spin text-purple-400" size={22} />
            Modeling competitor reaction game tree...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-center">
            <AlertTriangle className="text-rose-400 mx-auto mb-2" size={22} />
            <p className="text-xs font-semibold text-slate-300">Reaction Modeling Error</p>
            <p className="text-[10px] text-slate-500 mt-1">{error}</p>
            <button
              onClick={getReactions}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline mt-2"
            >
              Retry prediction
            </button>
          </div>
        ) : reaction ? (
          <div className="space-y-4">
            {/* Top row: Counter strategy details */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3 mb-3">
                <div>
                  <span className="text-[9px] font-bold uppercase text-purple-400 tracking-widest block font-mono">
                    Counter-Strategy Triggered
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">
                    {reaction.competitor_strategy_name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 font-mono">Erosion Risk:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      riskColors[reaction.market_share_erosion_risk as keyof typeof riskColors] ||
                      riskColors.Medium
                    }`}
                  >
                    {reaction.market_share_erosion_risk}
                  </span>
                </div>
              </div>

              {/* Progress vulnerability indicator */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1.5">
                  <span>Strategy Vulnerability Score</span>
                  <span className="text-purple-400 font-bold">{reaction.risk_score}/100</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${reaction.risk_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Two column grid for Counter-moves & Defenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Counter moves */}
              <div className="rounded-xl border border-rose-500/10 bg-slate-950/30 p-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2.5 flex items-center gap-1.5">
                  <ShieldAlert size={12} />
                  Competitor Counter-Moves
                </h4>
                <div className="space-y-2">
                  {reaction.counter_moves.map((move, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                      <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-rose-500/15 border border-rose-500/30 text-[9px] font-bold text-rose-400">
                        {i + 1}
                      </span>
                      <span>{move}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defenses */}
              <div className="rounded-xl border border-emerald-500/10 bg-slate-950/30 p-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  Recommended Defenses
                </h4>
                <div className="space-y-2">
                  {reaction.defense_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                      <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                        ✓
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
