"use client";

import { useEffect, useState } from "react";

interface KPICardProps {
  title: string;
  value: number;
  format?: "currency" | "percent" | "number" | "decimal";
  icon: React.ReactNode;
  trend?: number;
  color: "blue" | "emerald" | "purple" | "amber" | "rose" | "cyan";
  delay?: number;
  subtitle?: string;
}

const colorMap = {
  blue: {
    gradient: "from-blue-500/20 to-blue-600/30",
    border: "border-blue-500/30",
    glow: "group-hover:shadow-blue-500/20 group-hover:border-blue-500/50",
    text: "text-blue-400",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-700",
    iconShadow: "shadow-blue-500/30",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-emerald-600/30",
    border: "border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/20 group-hover:border-emerald-500/50",
    text: "text-emerald-400",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    iconShadow: "shadow-emerald-500/30",
  },
  purple: {
    gradient: "from-purple-500/20 to-purple-600/30",
    border: "border-purple-500/30",
    glow: "group-hover:shadow-purple-500/20 group-hover:border-purple-500/50",
    text: "text-purple-400",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-700",
    iconShadow: "shadow-purple-500/30",
  },
  amber: {
    gradient: "from-amber-500/20 to-amber-600/30",
    border: "border-amber-500/30",
    glow: "group-hover:shadow-amber-500/20 group-hover:border-amber-500/50",
    text: "text-amber-400",
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-700",
    iconShadow: "shadow-amber-500/30",
  },
  rose: {
    gradient: "from-rose-500/20 to-rose-600/30",
    border: "border-rose-500/30",
    glow: "group-hover:shadow-rose-500/20 group-hover:border-rose-500/50",
    text: "text-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-700",
    iconShadow: "shadow-rose-500/30",
  },
  cyan: {
    gradient: "from-cyan-500/20 to-cyan-600/30",
    border: "border-cyan-500/30",
    glow: "group-hover:shadow-cyan-500/20 group-hover:border-cyan-500/50",
    text: "text-cyan-400",
    iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    iconShadow: "shadow-cyan-500/30",
  },
};

function formatValue(value: number, format: string): string {
  switch (format) {
    case "currency":
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
      if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "decimal":
      return value.toFixed(2);
    default:
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString();
  }
}

export default function KPICard({
  title,
  value,
  format = "number",
  icon,
  trend,
  color,
  delay = 0,
  subtitle,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const colors = colorMap[color];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const current = Math.min(value, increment * step);
      setDisplayValue(current);
      if (step >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  return (
    <div
      className={`glass-card-enterprise p-6 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Accent top line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Top subtle ambient light */}
      <div
        className={`absolute -top-12 -right-12 h-24 w-24 rounded-full bg-gradient-to-br ${colors.gradient} blur-2xl transition-all duration-500 group-hover:scale-150`}
      />

      <div className="relative z-10 flex items-start justify-between mb-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.iconBg} text-white shadow-lg ${colors.iconShadow} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
        {trend !== undefined ? (
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${
              trend > 0
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : trend < 0
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : "border-slate-700/80 bg-slate-800/50 text-slate-300"
            }`}
          >
            {trend > 0 ? "↑" : trend < 0 ? "↓" : "•"} {Math.abs(trend).toFixed(1)}%
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500" />
        )}
      </div>

      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-mono font-bold tracking-tight text-white tabular-nums">
          {formatValue(displayValue, format)}
        </p>
        {subtitle && (
          <p className="mt-1 text-[11px] text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
