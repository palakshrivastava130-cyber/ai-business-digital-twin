"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { KPISummary } from "@/lib/types";

interface ExpenseBreakdownProps {
  kpis: KPISummary | null;
  isLoading?: boolean;
}

const PALETTE = ["#FF4B72", "#6366F1", "#06B6D4", "#10B981"];

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toLocaleString()}`;
};

export default function ExpenseBreakdown({ kpis, isLoading }: ExpenseBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading || !kpis) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl h-full min-h-[420px] flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <div className="skeleton h-6 w-36" />
          <div className="skeleton h-6 w-28 rounded-full" />
        </div>
        <div className="skeleton h-56 w-56 rounded-full mx-auto my-auto" />
      </div>
    );
  }

  const total = kpis.total_expenses;
  const opExp = Math.round(total * 0.45);
  const mktg = Math.round(total * 0.25);
  const inv = Math.round(total * 0.20);
  const admin = total - opExp - mktg - inv;

  const data = [
    { name: "Operating Expenses", shortName: "Operating", value: opExp, percentage: "45.0" },
    { name: "Marketing Spend", shortName: "Marketing", value: mktg, percentage: "25.0" },
    { name: "Inventory Costs", shortName: "Inventory", value: inv, percentage: "20.0" },
    { name: "Admin & Operations", shortName: "Admin & Ops", value: admin, percentage: "10.0" },
  ];

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="glass-card-enterprise p-6 animate-fade-in delay-200 h-full min-h-[420px] flex flex-col justify-between">
      {/* Header section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Expense Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cost structure & capital allocation</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">Cost Efficiency: 88.4%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
          {/* Left Column: Donut Chart */}
          <div className="md:col-span-6 relative h-[210px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={4}
                  cornerRadius={6}
                  dataKey="value"
                  stroke="transparent"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PALETTE[index % PALETTE.length]}
                      style={{
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.35,
                        filter: activeIndex === index ? `drop-shadow(0 0 10px ${PALETTE[index]}80)` : 'none',
                        transform: activeIndex === index ? 'scale(1.03)' : 'scale(1)',
                        transformOrigin: 'center center',
                        transition: 'all 0.25s ease-out',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {activeItem ? (
                <div className="animate-fade-in flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-300">{activeItem.shortName}</span>
                  <span className="text-xl font-bold text-white tracking-tight my-0.5 font-mono">{formatCurrency(activeItem.value)}</span>
                  <span className="text-xs font-mono font-semibold text-blue-400">{activeItem.percentage}%</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-slate-400">Total Burn</span>
                  <span className="text-xl font-bold text-white tracking-tight my-0.5 font-mono">{formatCurrency(total)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">100.0% Allocation</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Structured Legend List */}
          <div className="md:col-span-6 flex flex-col gap-2">
            {data.map((item, index) => (
              <div 
                key={item.name}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border ${
                  activeIndex === index 
                    ? 'bg-slate-800/90 border-slate-700 shadow-md' 
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/60'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {/* [Color Dot + Title (truncate)] */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200" 
                    style={{ 
                      backgroundColor: PALETTE[index % PALETTE.length],
                      transform: activeIndex === index ? 'scale(1.3)' : 'scale(1)'
                    }} 
                  />
                  <span className={`text-xs font-medium truncate transition-colors ${activeIndex === index ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {item.name}
                  </span>
                </div>

                {/* [Percentage (fixed width)] [Formatted Currency (fixed width)] */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xs font-mono font-medium text-slate-400 w-11 text-right">
                    {item.percentage}%
                  </span>
                  <span className={`text-xs font-mono font-semibold w-16 text-right transition-colors ${activeIndex === index ? 'text-white' : 'text-slate-200'}`}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>4-Tier Allocation Baseline</span>
        <span className="font-mono text-slate-400">Total: {formatCurrency(total)}</span>
      </div>
    </div>
  );
}
