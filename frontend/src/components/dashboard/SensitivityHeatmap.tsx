"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  TrendingUp,
  Sparkles,
  DollarSign,
  Activity,
  Loader2,
  AlertTriangle,
  Target,
} from "lucide-react";
import type { SensitivityCell, SensitivityResponse } from "@/lib/types";
import { fetchSensitivityHeatmap } from "@/lib/api";

export default function SensitivityHeatmap() {
  const [data, setData] = useState<SensitivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<SensitivityCell | null>(null);

  const loadHeatmap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchSensitivityHeatmap();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load sensitivity matrix:", err);
      setError(err.message || "Failed to load sensitivity analysis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmap();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-card-enterprise p-6 flex flex-col justify-between h-full min-h-[350px]">
        <div className="flex items-center gap-2 mb-4">
          <Grid className="text-blue-400" size={18} />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Sensitivity Elasticity Heatmap</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 font-mono text-xs text-slate-400">
          <Loader2 className="animate-spin text-blue-400" size={24} />
          Loading elasticity projections...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card-enterprise p-6 flex flex-col justify-between h-full min-h-[350px]">
        <div className="flex items-center gap-2 mb-4">
          <Grid className="text-rose-400" size={18} />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Sensitivity Elasticity Heatmap</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-4">
          <AlertTriangle className="text-rose-500" size={28} />
          <div>
            <p className="text-xs text-slate-300 font-semibold">Failed to load sensitivity analysis</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[220px]">{error}</p>
          </div>
          <button
            onClick={loadHeatmap}
            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
          >
            Retry analysis
          </button>
        </div>
      </div>
    );
  }

  // Rows = Price changes (-10 to +10), Cols = Marketing spend changes (-20 to +40)
  const priceLabels = [-10, -5, 0, 5, 10];
  const marketingLabels = [-20, -5, 10, 25, 40];

  const getCellClass = (cell: SensitivityCell) => {
    const isOptimal =
      cell.price_change === data.optimal.price_change &&
      cell.marketing_spend_change === data.optimal.marketing_spend_change;

    let baseColor = "";
    if (cell.profit_margin <= 0) {
      baseColor = "bg-rose-950/70 text-rose-300 border-rose-800/30 hover:bg-rose-900/90";
    } else if (cell.profit_margin <= 2.0) {
      baseColor = "bg-amber-950/40 text-amber-300 border-amber-800/20 hover:bg-amber-900/70";
    } else if (cell.profit_margin <= 6.0) {
      baseColor = "bg-blue-950/30 text-blue-300 border-blue-800/20 hover:bg-blue-900/70";
    } else {
      baseColor = "bg-emerald-950/60 text-emerald-300 border-emerald-800/30 hover:bg-emerald-900/80";
    }

    return `${baseColor} ${
      isOptimal
        ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 animate-pulse-subtle shadow-[0_0_12px_rgba(34,211,238,0.45)] z-10"
        : ""
    }`;
  };

  return (
    <div className="glass-card-enterprise p-5 flex flex-col justify-between h-full animate-fade-in">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-md">
              <Grid size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Elasticity Sensitivity Matrix
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Price Elasticity vs Marketing Spend</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
            <Sparkles size={10} />
            Sweet Spot Found
          </span>
        </div>

        {/* 2D 5x5 Heatmap Grid */}
        <div className="relative border border-slate-800/60 bg-slate-950/40 p-4 rounded-xl">
          {/* Top X-Axis Label */}
          <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3.5">
            Marketing Spend Change (X-Axis) →
          </div>

          <div className="grid grid-cols-6 gap-1.5 text-center">
            {/* Empty corner header cell */}
            <div className="text-[9px] text-slate-600 flex items-center justify-center font-bold font-mono border border-transparent">
              P \ M
            </div>

            {/* X-Axis headers */}
            {marketingLabels.map((mkt) => (
              <div
                key={mkt}
                className="text-[9px] font-mono text-slate-400 font-bold py-1 bg-slate-900/40 rounded border border-slate-800/50"
              >
                {mkt > 0 ? "+" : ""}
                {mkt}%
              </div>
            ))}

            {/* Grid rows */}
            {priceLabels.map((prc) => {
              return (
                <>
                  {/* Y-Axis Label (Price) */}
                  <div
                    key={`y-${prc}`}
                    className="text-[9px] font-mono text-slate-400 font-bold flex items-center justify-center bg-slate-900/40 rounded border border-slate-800/50"
                  >
                    Price {prc > 0 ? "+" : ""}
                    {prc}%
                  </div>

                  {/* 5 cells */}
                  {marketingLabels.map((mkt) => {
                    const cell = data.grid.find(
                      (c) => c.price_change === prc && c.marketing_spend_change === mkt
                    );
                    if (!cell) return <div key={`${prc}-${mkt}`} />;
                    
                    const isOptimal =
                      cell.price_change === data.optimal.price_change &&
                      cell.marketing_spend_change === data.optimal.marketing_spend_change;

                    return (
                      <div
                        key={`${prc}-${mkt}`}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold cursor-help border transition-all ${getCellClass(cell)}`}
                      >
                        {isOptimal ? <Target size={11} className="text-cyan-300 animate-spin-slow" /> : `${cell.profit_margin > 0 ? "+" : ""}${cell.profit_margin.toFixed(1)}%`}
                      </div>
                    );
                  })}
                </>
              );
            })}
          </div>

          {/* Left Y-Axis Label */}
          <div className="absolute -left-12 top-1/2 -rotate-90 text-[10px] text-slate-500 font-bold uppercase tracking-wider pointer-events-none">
            Price Change
          </div>
        </div>
      </div>

      {/* Dynamic Heatmap Info/Tooltip Panel */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80">
        {hoveredCell ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between animate-fade-in">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Simulated Cell Coordinates
              </div>
              <div className="text-xs text-slate-200 font-mono font-bold">
                Price: {hoveredCell.price_change > 0 ? "+" : ""}
                {hoveredCell.price_change}% · Marketing: {hoveredCell.marketing_spend_change > 0 ? "+" : ""}
                {hoveredCell.marketing_spend_change}%
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-[10px] text-slate-400 font-mono">
                Projected Margin:{" "}
                <span
                  className={`font-bold ${
                    hoveredCell.profit_margin > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {hoveredCell.profit_margin > 0 ? "+" : ""}
                  {hoveredCell.profit_margin.toFixed(2)}%
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Revenue: <span className="text-blue-400 font-bold">${(hoveredCell.revenue / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-cyan-400 animate-pulse" />
              <div>
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Optimal Sweet Spot</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Price: {data.optimal.price_change > 0 ? "+" : ""}{data.optimal.price_change}% · Marketing: {data.optimal.marketing_spend_change > 0 ? "+" : ""}{data.optimal.marketing_spend_change}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-400 font-mono block">
                +{data.optimal.profit_margin.toFixed(2)}% Margin
              </span>
              <span className="text-[9px] text-slate-500 font-mono block">
                Revenue: ${(data.optimal.revenue / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
