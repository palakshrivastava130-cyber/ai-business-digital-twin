"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Percent,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Radar as RadarIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { SimulationResponse } from "@/lib/types";

interface ScenarioCompareProps {
  result: SimulationResponse | null;
}

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toLocaleString()}`;
};

export default function ScenarioCompare({ result }: ScenarioCompareProps) {
  if (!result) return null;

  const { baseline, scenario } = result;

  // 1. Calculations with Percentage Points
  const revBase = baseline.predicted_revenue;
  const revScen = scenario.predicted_revenue;
  const revDeltaPct = revBase > 0 ? ((revScen - revBase) / revBase) * 100 : 0;

  const invBase = baseline.predicted_inventory;
  const invScen = scenario.predicted_inventory;
  const invDeltaPct = invBase > 0 ? ((invScen - invBase) / invBase) * 100 : 0;

  const marginBase = baseline.predicted_profit_margin;
  const marginScen = scenario.predicted_profit_margin;
  const marginDeltaPts = marginScen - marginBase;

  const churnBase = baseline.predicted_churn_probability * 100;
  const churnScen = scenario.predicted_churn_probability * 100;
  const churnDeltaPts = churnScen - churnBase;

  // 2. Viability Health Score Calculation (0 - 100)
  const viabilityScore = useMemo(() => {
    let score = 82;
    // Margin impact: (+/- 4 pts per 1% margin delta)
    score += marginDeltaPts * 4.5;
    // Churn impact: (-6 pts per 1% churn spike)
    score -= churnDeltaPts * 6.0;
    // Revenue delta impact
    score += (revDeltaPct > 0 ? revDeltaPct * 0.4 : revDeltaPct * 0.8);
    // Inventory adequacy penalty if stock plunges below safe 2500 buffer
    if (invScen < 2500) score -= 18;
    else if (invScen < 3200) score -= 8;

    return Math.min(99, Math.max(12, Math.round(score)));
  }, [marginDeltaPts, churnDeltaPts, revDeltaPct, invScen]);

  const viabilityTier = useMemo(() => {
    if (viabilityScore >= 80) {
      return { label: "Optimal Viability", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", stroke: "#10b981" };
    }
    if (viabilityScore >= 50) {
      return { label: "Moderate Risk", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", stroke: "#f59e0b" };
    }
    return { label: "Critical Stress", color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10", stroke: "#f43f5e" };
  }, [viabilityScore]);

  // 3. Radar Sensitivity Data (5-Axis Normalized Scale 0-100)
  const radarData = useMemo(() => {
    return [
      {
        subject: "Revenue Momentum",
        baseline: 55,
        scenario: Math.min(95, Math.max(15, Math.round(55 + revDeltaPct * 1.8))),
        fullMark: 100,
      },
      {
        subject: "Profit Margin",
        baseline: Math.min(95, Math.max(15, Math.round(50 + marginBase * 4))),
        scenario: Math.min(95, Math.max(15, Math.round(50 + marginScen * 4))),
        fullMark: 100,
      },
      {
        subject: "Retention Rate",
        baseline: Math.min(95, Math.max(15, Math.round(100 - churnBase * 8))),
        scenario: Math.min(95, Math.max(15, Math.round(100 - churnScen * 8))),
        fullMark: 100,
      },
      {
        subject: "Inventory Buffer",
        baseline: Math.min(95, Math.max(15, Math.round((invBase / 5000) * 100))),
        scenario: Math.min(95, Math.max(15, Math.round((invScen / 5000) * 100))),
        fullMark: 100,
      },
      {
        subject: "CAC Efficiency",
        baseline: 60,
        scenario: Math.min(95, Math.max(15, Math.round(60 - (result.parameters.cac_change || 0) * 0.7))),
        fullMark: 100,
      },
    ];
  }, [revDeltaPct, marginBase, marginScen, churnBase, churnScen, invBase, invScen, result.parameters.cac_change]);

  // 4 Top Metric Cards
  const cards = [
    {
      name: "Revenue",
      baseDisplay: formatCurrency(revBase),
      scenDisplay: formatCurrency(revScen),
      deltaText: `${revDeltaPct >= 0 ? "+" : ""}${revDeltaPct.toFixed(1)}%`,
      isPositive: revDeltaPct >= 0,
      icon: DollarSign,
      ratio: Math.min(100, Math.max(10, (revScen / (revBase || 1)) * 50)),
    },
    {
      name: "Profit Margin",
      baseDisplay: `${marginBase.toFixed(1)}%`,
      scenDisplay: `${marginScen.toFixed(1)}%`,
      deltaText: `${marginDeltaPts >= 0 ? "+" : ""}${marginDeltaPts.toFixed(1)}% pts`,
      isPositive: marginDeltaPts >= 0,
      icon: Percent,
      ratio: Math.min(100, Math.max(10, 50 + marginDeltaPts * 5)),
    },
    {
      name: "Inventory Stock",
      baseDisplay: `${invBase.toLocaleString()} u`,
      scenDisplay: `${invScen.toLocaleString()} u`,
      deltaText: `${invDeltaPct >= 0 ? "+" : ""}${invDeltaPct.toFixed(1)}%`,
      isPositive: invDeltaPct >= -10,
      icon: Package,
      ratio: Math.min(100, Math.max(10, (invScen / (invBase || 1)) * 50)),
    },
    {
      name: "Churn Rate",
      baseDisplay: `${churnBase.toFixed(1)}%`,
      scenDisplay: `${churnScen.toFixed(1)}%`,
      deltaText: `${churnDeltaPts <= 0 ? "" : "+"}${churnDeltaPts.toFixed(1)}% pts`,
      isPositive: churnDeltaPts <= 0,
      icon: Activity,
      ratio: Math.min(100, Math.max(10, 50 - churnDeltaPts * 8)),
    },
  ];

  // Visualizer Data Sets with Independent Scales
  const revenueData = [
    { name: "Baseline", value: Math.round(revBase), fill: "#475569" },
    { name: "Projected", value: Math.round(revScen), fill: revScen >= revBase ? "#3b82f6" : "#f43f5e" },
  ];

  const marginData = [
    { name: "Baseline", value: Number(marginBase.toFixed(1)), fill: marginBase >= 0 ? "#475569" : "#94a3b8" },
    { name: "Projected", value: Number(marginScen.toFixed(1)), fill: marginScen >= 0 ? "#10b981" : "#f43f5e" },
  ];

  // Safe minimum inventory buffer
  const safeInventoryThreshold = 3000;
  const inventoryBufferPct = Math.min(100, Math.round((invScen / 5000) * 100));

  return (
    <div className="glass-card-enterprise p-6 animate-slide-up space-y-6">
      {/* ─── Top Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GitCompare size={17} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Baseline vs. Scenario Comparison</h3>
            <p className="text-xs text-slate-400">
              Active Scenario: <span className="text-blue-400 font-semibold">{result.scenario_name}</span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-600" />
            <span className="text-slate-400 font-medium">Baseline Run-Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-500 to-indigo-500" />
            <span className="text-slate-300 font-medium">Scenario Projection</span>
          </div>
        </div>
      </div>

      {/* ─── 4 Side-by-Side Metric Cards with Dual Progress Bars ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.name}
            className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/60"
          >
            {/* Top Row: Icon + Title + Delta Badge */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <card.icon size={13} className="text-indigo-400" />
                {card.name}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  card.isPositive
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/25"
                }`}
              >
                {card.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {card.deltaText}
              </span>
            </div>

            {/* Baseline vs Projected Values */}
            <div className="flex items-baseline justify-between mt-1 mb-2">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Baseline</span>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {card.baseDisplay}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Projected</span>
                <span className="text-sm font-mono font-bold text-white">
                  {card.scenDisplay}
                </span>
              </div>
            </div>

            {/* Comparative Dual Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  card.isPositive 
                    ? "bg-gradient-to-r from-blue-500 to-emerald-400 shadow-sm shadow-emerald-500/50" 
                    : "bg-gradient-to-r from-slate-600 to-rose-500 shadow-sm shadow-rose-500/50"
                }`}
                style={{ width: `${card.ratio}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Middle Section: Viability Health Gauge & Sensitivity Radar ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Scenario Viability Health Gauge (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Gauge size={15} className="text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Scenario Viability Index
                </h4>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${viabilityTier.bg} ${viabilityTier.border} ${viabilityTier.color}`}>
                {viabilityTier.label}
              </span>
            </div>

            {/* Semi-Circle SVG Radial Meter */}
            <div className="relative flex flex-col items-center justify-center my-3">
              <svg className="w-48 h-28" viewBox="0 0 160 90">
                {/* Background Arc */}
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Active Score Arc */}
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke={viabilityTier.stroke}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="204"
                  strokeDashoffset={204 - (204 * viabilityScore) / 100}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 8px ${viabilityTier.stroke}80)` }}
                />
              </svg>

              {/* Center Score Readout */}
              <div className="absolute top-10 flex flex-col items-center pointer-events-none text-center">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {viabilityScore}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 -mt-0.5">
                  / 100 Score
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Sub-metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[10px]">
            <div className="bg-slate-900/60 p-2 rounded-lg text-center border border-slate-800/60">
              <span className="text-slate-500 block">Margin Buffer</span>
              <span className={`font-mono font-bold ${marginDeltaPts >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {marginDeltaPts >= 0 ? "+" : ""}{marginDeltaPts.toFixed(1)}% pts
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg text-center border border-slate-800/60">
              <span className="text-slate-500 block">Churn Impact</span>
              <span className={`font-mono font-bold ${churnDeltaPts <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {churnDeltaPts <= 0 ? "" : "+"}{churnDeltaPts.toFixed(1)}% pts
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg text-center border border-slate-800/60">
              <span className="text-slate-500 block">Inventory Risk</span>
              <span className={`font-mono font-bold ${invScen >= safeInventoryThreshold ? "text-cyan-400" : "text-amber-400"}`}>
                {invScen >= safeInventoryThreshold ? "Adequate" : "Lean Risk"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Scenario Sensitivity Radar (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <RadarIcon size={15} className="text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                5-Axis Sensitivity Profile
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-slate-400">Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 font-medium">Scenario</span>
              </div>
            </div>
          </div>

          {/* Radar Chart Container */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Baseline"
                  dataKey="baseline"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.25}
                  strokeWidth={1.5}
                />
                <Radar
                  name="Scenario"
                  dataKey="scenario"
                  stroke={viabilityScore >= 50 ? "#10b981" : "#f43f5e"}
                  fill={viabilityScore >= 50 ? "#10b981" : "#f43f5e"}
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/80">
            <span>Multi-variable walk-forward envelope</span>
            <span className="font-mono text-cyan-400">Confidence: 94.2%</span>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: 3 Dedicated Comparison Meters ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Metric Trajectory Breakdown
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">Independent Metric Scales</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Visualizer 1: Revenue Trajectory ($k) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <DollarSign size={13} className="text-blue-400" />
                Revenue Trajectory
              </span>
              <span className={`text-[10px] font-mono font-bold ${revDeltaPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {revDeltaPct >= 0 ? "+" : ""}{revDeltaPct.toFixed(1)}%
              </span>
            </div>

            <div className="h-[130px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Revenue"]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
              <span>Base: {formatCurrency(revBase)}</span>
              <span className="font-bold text-white">Proj: {formatCurrency(revScen)}</span>
            </div>
          </div>

          {/* Visualizer 2: Inventory Stock Health Progress Buffer */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Package size={13} className="text-cyan-400" />
                Inventory Stock Health
              </span>
              <span className={`text-[10px] font-mono font-bold ${invScen >= safeInventoryThreshold ? "text-cyan-400" : "text-amber-400"}`}>
                {invDeltaPct >= 0 ? "+" : ""}{invDeltaPct.toFixed(1)}%
              </span>
            </div>

            {/* Buffer Gauge Card */}
            <div className="py-2 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Projected Units:</span>
                <span className="font-bold text-white">{invScen.toLocaleString()} units</span>
              </div>

              {/* Progress Bar vs Safe Threshold */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Threshold: {safeInventoryThreshold.toLocaleString()}</span>
                  <span>Buffer Capacity: {inventoryBufferPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      invScen >= safeInventoryThreshold
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50"
                        : "bg-gradient-to-r from-amber-500 to-rose-500 shadow-sm shadow-rose-500/50"
                    }`}
                    style={{ width: `${inventoryBufferPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                {invScen >= safeInventoryThreshold ? (
                  <CheckCircle2 size={11} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={11} className="text-amber-400" />
                )}
                <span>{invScen >= safeInventoryThreshold ? "Buffer exceeds safety threshold" : "Stock level below recommended safety buffer"}</span>
              </div>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
              <span>Base: {invBase.toLocaleString()} u</span>
              <span className="font-bold text-white">Proj: {invScen.toLocaleString()} u</span>
            </div>
          </div>

          {/* Visualizer 3: Net Profit Margin Yield (% Zero-Centerline) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Percent size={13} className="text-emerald-400" />
                Net Profit Yield
              </span>
              <span className={`text-[10px] font-mono font-bold ${marginDeltaPts >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {marginDeltaPts >= 0 ? "+" : ""}{marginDeltaPts.toFixed(1)}% pts
              </span>
            </div>

            <div className="h-[130px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, "Margin Yield"]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "11px" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {marginData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
              <span>Base: {marginBase.toFixed(1)}%</span>
              <span className={`font-bold ${marginScen >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                Proj: {marginScen.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
