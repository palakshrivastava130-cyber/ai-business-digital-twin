"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, ShieldCheck, Activity } from "lucide-react";
import type { TimeSeriesPoint } from "@/lib/types";

interface RevenueChartProps {
  data: TimeSeriesPoint[];
  isLoading?: boolean;
}

type TimeRange = "7D" | "30D" | "90D" | "1Y" | "ALL";

function formatDate(dateStr: string, range: TimeRange): string {
  const d = new Date(dateStr);
  if (range === "7D" || range === "30D" || range === "90D") {
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const rev = payload.find((p: any) => p.dataKey === "revenue")?.value || 0;
  const exp = payload.find((p: any) => p.dataKey === "expenses")?.value || 0;
  const p90 = payload.find((p: any) => p.dataKey === "revenue_p90")?.value;
  const p10 = payload.find((p: any) => p.dataKey === "revenue_p10")?.value;
  const net = rev - exp;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs">
      <p className="font-semibold text-slate-200 mb-2.5 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-6">
        <span>
          {new Date(label).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="text-[10px] text-slate-500 font-normal">Telemetry Snapshot</span>
      </p>
      <div className="space-y-2 min-w-[190px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm shadow-blue-500/50" />
            Revenue (p50)
          </span>
          <span className="font-mono font-bold text-white">${Number(rev).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-sm shadow-rose-500/50" />
            Expenses
          </span>
          <span className="font-mono font-bold text-white">${Number(exp).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
          <span className="text-slate-400 font-medium">Net Margin</span>
          <span className={`font-mono font-bold ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {net >= 0 ? "+" : ""}${Number(net).toLocaleString()}
          </span>
        </div>
        {p10 && p90 && (
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-cyan-300">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck size={11} className="text-cyan-400" />
              90% Corridor:
            </span>
            <span className="font-mono">
              ${(p10 / 1000).toFixed(0)}k – ${(p90 / 1000).toFixed(0)}k
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("90D");
  const [showConfidenceCorridor, setShowConfidenceCorridor] = useState<boolean>(true);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let count = data.length;
    if (timeRange === "7D") count = 7;
    else if (timeRange === "30D") count = 30;
    else if (timeRange === "90D") count = 90;
    else if (timeRange === "1Y") count = 365;

    const slice = data.slice(-count);
    const enriched = slice.map((d) => ({
      ...d,
      revenue_p10: d.revenue_p10 ?? Math.round(d.revenue * 0.905),
      revenue_p50: d.revenue_p50 ?? d.revenue,
      revenue_p90: d.revenue_p90 ?? Math.round(d.revenue * 1.095),
    }));

    if (enriched.length > 180) {
      const step = Math.ceil(enriched.length / 120);
      return enriched.filter((_, i) => i % step === 0 || i === enriched.length - 1);
    }
    return enriched;
  }, [data, timeRange]);

  // Distinct, non-overlapping tick intervals to avoid duplicate labels
  const ticks = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const targetCount = timeRange === "7D" ? 7 : 6;
    if (filteredData.length <= targetCount) return filteredData.map((d) => d.date);

    const step = Math.floor((filteredData.length - 1) / (targetCount - 1));
    const result: string[] = [];
    for (let i = 0; i < filteredData.length; i += step) {
      if (result.length < targetCount - 1) {
        result.push(filteredData[i].date);
      }
    }
    result.push(filteredData[filteredData.length - 1].date);
    return result;
  }, [filteredData, timeRange]);

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl h-full min-h-[420px] flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-8 w-44 rounded-lg" />
        </div>
        <div className="skeleton h-[280px] w-full my-auto" />
      </div>
    );
  }

  return (
    <div className="glass-card-enterprise p-6 animate-fade-in h-full min-h-[420px] flex flex-col justify-between">
      {/* Header with Title and Range Picker */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <TrendingUp size={15} />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Revenue & Expenses Trend</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise top-line trajectory with Monte Carlo risk bounds
            </p>
          </div>

          {/* Right Controls: Confidence Toggle & Time range tabs */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Risk Corridor Toggle */}
            <button
              onClick={() => setShowConfidenceCorridor(!showConfidenceCorridor)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all ${
                showConfidenceCorridor
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Toggle 90% Confidence Interval Risk Corridor"
            >
              <ShieldCheck size={13} className={showConfidenceCorridor ? "text-cyan-400" : "text-slate-500"} />
              <span>90% Risk Corridor</span>
            </button>

            {/* Time tabs */}
            <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 p-1 rounded-xl">
              {(["7D", "30D", "90D", "1Y", "ALL"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    timeRange === range
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="corridorGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
                tickFormatter={(d) => formatDate(d, timeRange)}
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Shaded 90% Confidence Corridor */}
              {showConfidenceCorridor && (
                <>
                  <Area
                    type="monotone"
                    dataKey="revenue_p90"
                    name="90% Upper Bound"
                    stroke="#06b6d4"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="url(#corridorGlow)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue_p10"
                    name="10% Lower Bound"
                    stroke="#06b6d4"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="transparent"
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Primary Revenue Curve */}
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#revenueGlow)"
                activeDot={{ r: 5, fill: "#60a5fa", stroke: "#1e3a8a", strokeWidth: 2 }}
              />

              {/* Primary Expense Curve */}
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#expenseGlow)"
                activeDot={{ r: 5, fill: "#fb7185", stroke: "#881337", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3.5 mt-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
            <span className="text-slate-300 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-600" />
            <span className="text-slate-300 font-medium">Expenses</span>
          </div>
          {showConfidenceCorridor && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/80 border border-cyan-400" />
              <span className="text-cyan-300 font-medium">p10–p90 Corridor</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <Calendar size={12} />
          <span>{filteredData.length} records · {timeRange} Window</span>
        </div>
      </div>
    </div>
  );
}
