"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users2, UserCheck, UserMinus, Sparkles } from "lucide-react";
import type { TimeSeriesPoint } from "@/lib/types";

interface CustomerMetricsProps {
  data: TimeSeriesPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const customers = payload.find((p: any) => p.dataKey === "customer_count")?.value || 0;
  const churn = payload.find((p: any) => p.dataKey === "churn_rate")?.value || 0;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-xl text-xs">
      <p className="font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1">
        {new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
      <div className="space-y-1.5 min-w-[160px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Total Customers
          </span>
          <span className="font-bold text-white">{Number(customers).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Churn Rate
          </span>
          <span className="font-bold text-amber-400">{(Number(churn) * 100).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

export default function CustomerMetrics({ data, isLoading }: CustomerMetricsProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (data.length > 180) {
      const step = Math.ceil(data.length / 90);
      return data.filter((_, i) => i % step === 0 || i === data.length - 1);
    }
    return data;
  }, [data]);

  const summary = useMemo(() => {
    if (!data || data.length === 0) return { latestCount: 0, avgChurn: 0, growthPct: 0 };
    const latest = data[data.length - 1];
    const initial = data[0];
    const avgChurn = (data.reduce((sum, d) => sum + (d.churn_rate || 0), 0) / data.length) * 100;
    const growth = initial.customer_count > 0 
      ? ((latest.customer_count - initial.customer_count) / initial.customer_count) * 100 
      : 0;

    return {
      latestCount: latest.customer_count,
      avgChurn: avgChurn.toFixed(1),
      growthPct: growth.toFixed(1),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl h-[420px]">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="skeleton h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="glass-card-enterprise p-6 animate-fade-in delay-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users2 size={15} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Customer Dynamics & Churn</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cohort acquisition volume mapped against monthly churn velocity
          </p>
        </div>

        {/* Quick Health Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
            <UserCheck size={12} className="text-purple-400" />
            <span className="text-slate-400">Total:</span>
            <span className="font-mono font-bold tracking-tight text-purple-300">{summary.latestCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <Sparkles size={12} className="text-emerald-400" />
            <span className="text-slate-400">Growth:</span>
            <span className="font-mono font-bold tracking-tight text-emerald-400">+{summary.growthPct}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
            <UserMinus size={12} className="text-amber-400" />
            <span className="text-slate-400">Avg Churn:</span>
            <span className="font-mono font-bold tracking-tight text-amber-400">{summary.avgChurn}%</span>
          </div>
        </div>
      </div>

      {/* Composed Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
              }
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="customer_count"
              name="Customers"
              fill="#8b5cf6"
              opacity={0.65}
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="churn_rate"
              name="Churn Rate"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#fbbf24", stroke: "#78350f", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3.5 mt-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-purple-500/80" />
            <span className="text-slate-300 font-medium">Customer Volume (Left)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 bg-amber-400" />
            <span className="text-slate-300 font-medium">Churn Rate % (Right)</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500">Walk-forward continuous series</span>
      </div>
    </div>
  );
}
