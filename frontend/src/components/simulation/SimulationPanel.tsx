"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  DollarSign,
  Package,
  Users,
  Settings,
  FlaskConical,
  RotateCcw,
  Loader2,
  Rocket,
  Plus,
  Minus,
  Sparkles,
  Target,
  ToggleLeft,
  ChevronRight,
  Percent,
  Zap,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { SimulationRequest, SimulationResponse } from "@/lib/types";
import { solveGoalSeek } from "@/lib/api";

interface SimulationPanelProps {
  onSimulate: (request: SimulationRequest) => Promise<void>;
  isLoading: boolean;
  result: SimulationResponse | null;
  activeParams?: SimulationRequest | null;
}

interface SliderConfig {
  key: keyof SimulationRequest;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  Icon: LucideIcon;
}

const sliders: SliderConfig[] = [
  { key: "marketing_spend_change", label: "Marketing Budget", min: -50, max: 100, step: 5, unit: "%", Icon: Megaphone },
  { key: "price_change", label: "Product Price", min: -20, max: 30, step: 1, unit: "%", Icon: DollarSign },
  { key: "inventory_change", label: "Inventory Frequency", min: 0.5, max: 2.0, step: 0.1, unit: "x", Icon: Package },
  { key: "cac_change", label: "Customer Acq. Spend", min: -50, max: 100, step: 5, unit: "%", Icon: Users },
  { key: "expense_change", label: "Operating Expenses", min: -30, max: 50, step: 5, unit: "%", Icon: Settings },
];

const PRESETS: Array<{
  name: string;
  badge: string;
  badgeColor: string;
  line1: string;
  line2: string;
  Icon: LucideIcon;
  params: SimulationRequest;
}> = [
  {
    name: "Q4 Scale Blitz",
    badge: "Growth",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    line1: "+35% Mktg · -5% Price",
    line2: "+25% CAC · +15% Inv",
    Icon: Sparkles,
    params: {
      scenario_name: "Q4 Scale Blitz",
      marketing_spend_change: 35,
      price_change: -5,
      inventory_change: 1.15,
      cac_change: 25,
      expense_change: 10,
    },
  },
  {
    name: "Margin Defense",
    badge: "Defensive",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    line1: "-15% Mktg · +10% Price",
    line2: "-10% Exp · 0.8x Inv",
    Icon: Rocket,
    params: {
      scenario_name: "Margin Defense",
      marketing_spend_change: -15,
      price_change: 10,
      inventory_change: 0.8,
      cac_change: -5,
      expense_change: -10,
    },
  },
  {
    name: "Supply Shock",
    badge: "Stress",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    line1: "0% Mktg · +8% Price",
    line2: "-30% Inv · +12% Exp",
    Icon: FlaskConical,
    params: {
      scenario_name: "Supply Shock",
      marketing_spend_change: 0,
      price_change: 8,
      inventory_change: 0.7,
      cac_change: 10,
      expense_change: 12,
    },
  },
];

export default function SimulationPanel({ onSimulate, isLoading, result, activeParams }: SimulationPanelProps) {
  const [params, setParams] = useState<SimulationRequest>({
    scenario_name: "Custom Scenario",
    marketing_spend_change: 0,
    price_change: 0,
    inventory_change: 1.0,
    cac_change: 0,
    expense_change: 0,
  });

  const [mode, setMode] = useState<"simulate" | "goalseek">("simulate");
  const [targetRevenue, setTargetRevenue] = useState<string>("");
  const [targetMargin, setTargetMargin] = useState<string>("");
  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    if (activeParams) {
      setParams(activeParams);
    }
  }, [activeParams]);

  const handleSolveGoalSeek = async () => {
    setIsSolving(true);
    try {
      const solvedResponse = await solveGoalSeek(
        targetRevenue ? Number(targetRevenue) : undefined,
        targetMargin ? Number(targetMargin) : undefined
      );
      setParams(solvedResponse.parameters);
      await onSimulate(solvedResponse.parameters);
      setMode("simulate");
      setTargetRevenue("");
      setTargetMargin("");
    } catch (err) {
      console.error("Goal seek failed:", err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleSliderChange = (key: keyof SimulationRequest, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleStep = (key: keyof SimulationRequest, step: number, min: number, max: number) => {
    setParams((prev) => {
      const current = prev[key] as number;
      const next = Math.min(max, Math.max(min, Number((current + step).toFixed(1))));
      return { ...prev, [key]: next };
    });
  };

  const handleReset = () => {
    setParams({
      scenario_name: "Custom Scenario",
      marketing_spend_change: 0,
      price_change: 0,
      inventory_change: 1.0,
      cac_change: 0,
      expense_change: 0,
    });
  };

  const applyPresetAndRun = (preset: (typeof PRESETS)[0]) => {
    const updated = { ...preset.params };
    setParams(updated);
    onSimulate(updated);
  };

  const applyMacroShock = (shockName: string, shifts: Partial<SimulationRequest>) => {
    const updated: SimulationRequest = {
      scenario_name: `Macro Shock: ${shockName}`,
      marketing_spend_change: shifts.marketing_spend_change ?? 0,
      price_change: shifts.price_change ?? 0,
      inventory_change: shifts.inventory_change ?? 1.0,
      cac_change: shifts.cac_change ?? 0,
      expense_change: shifts.expense_change ?? 0,
    };
    setParams(updated);
    onSimulate(updated);
  };

  const handleSubmit = () => {
    onSimulate(params);
  };

  const hasChanges = sliders.some((s) => {
    const val = params[s.key] as number;
    return s.key === "inventory_change" ? val !== 1.0 : val !== 0;
  });

  return (
    <div className="glass-card-enterprise p-6 animate-fade-in delay-400 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/10">
              <FlaskConical size={17} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">What-If Simulator</h3>
              <p className="text-xs text-slate-400">Deterministic ML scenario engine</p>
            </div>
          </div>
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>

        {/* Quick Scenario Presets 3-Column Deck */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Sparkles size={12} className="text-blue-400" />
              <span>Scenario Presets</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Fast Simulation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESETS.map((preset) => {
              const isSelected = params.scenario_name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPresetAndRun(preset)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/15 ring-1 ring-blue-500/40"
                      : "bg-slate-950/50 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60"
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Title + Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <preset.Icon size={13} className={isSelected ? "text-blue-400" : "text-slate-400 group-hover:text-indigo-400"} />
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                          {preset.name}
                        </span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>

                    {/* 2-line Clean Summary */}
                    <div className="text-[10px] text-slate-400 group-hover:text-slate-300 font-mono space-y-0.5 mt-1 leading-tight">
                      <div className="truncate">{preset.line1}</div>
                      <div className="truncate text-slate-500 group-hover:text-slate-400">{preset.line2}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Macro Shock Injector Cards */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Zap size={12} className="text-amber-400" />
              <span>Macro Shock Injector</span>
            </div>
            <span className="text-[10px] text-amber-500 font-mono font-semibold animate-pulse">Black Swan stress test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Shock 1: Supply Chain Bottleneck */}
            <button
              type="button"
              onClick={() =>
                applyMacroShock("Supply Chain Bottleneck", {
                  price_change: 10,
                  inventory_change: 0.5,
                  expense_change: 20,
                  marketing_spend_change: -15,
                })
              }
              className={`p-3 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                params.scenario_name === "Macro Shock: Supply Chain Bottleneck"
                  ? "bg-amber-600/15 border-amber-500 shadow-md shadow-amber-500/15 ring-1 ring-amber-500/40"
                  : "bg-slate-950/50 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={13} className="text-amber-400" />
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white">
                    Supply Chain
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 group-hover:text-slate-300 font-mono leading-tight">
                  Price: +10% · Inv: 0.5x<br />
                  Expenses: +20%
                </div>
              </div>
            </button>

            {/* Shock 2: Ad CAC Inflation */}
            <button
              type="button"
              onClick={() =>
                applyMacroShock("Ad CAC Inflation Spike", {
                  cac_change: 50,
                  marketing_spend_change: 25,
                  expense_change: 5,
                })
              }
              className={`p-3 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                params.scenario_name === "Macro Shock: Ad CAC Inflation Spike"
                  ? "bg-rose-600/15 border-rose-500 shadow-md shadow-rose-500/15 ring-1 ring-rose-500/40"
                  : "bg-slate-950/50 border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/60"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert size={13} className="text-rose-400" />
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white">
                    CAC Inflation
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 group-hover:text-slate-300 font-mono leading-tight">
                  CAC: +50% · Spend: +25%<br />
                  Expenses: +5%
                </div>
              </div>
            </button>

            {/* Shock 3: Viral Demand Wave */}
            <button
              type="button"
              onClick={() =>
                applyMacroShock("Viral Demand Wave", {
                  marketing_spend_change: 35,
                  cac_change: -20,
                  price_change: 5,
                  inventory_change: 1.8,
                })
              }
              className={`p-3 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                params.scenario_name === "Macro Shock: Viral Demand Wave"
                  ? "bg-emerald-600/15 border-emerald-500 shadow-md shadow-emerald-500/15 ring-1 ring-emerald-500/40"
                  : "bg-slate-950/50 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp size={13} className="text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white">
                    Viral Demand
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 group-hover:text-slate-300 font-mono leading-tight">
                  Mkt: +35% · CAC: -20%<br />
                  Price: +5% · Inv: 1.8x
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setMode("simulate")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "simulate" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ToggleLeft size={13} />
            Granular Sim
          </button>
          <button
            type="button"
            onClick={() => setMode("goalseek")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "goalseek" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Target size={13} />
            Goal-Seek Solver
          </button>
        </div>

        {mode === "simulate" ? (
          <>
            {/* Scenario Name Input */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Scenario Label</label>
              <input
                type="text"
                value={params.scenario_name}
                onChange={(e) => setParams((p) => ({ ...p, scenario_name: e.target.value }))}
                placeholder="Name your scenario..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Granular Parameter Sliders with Live Delta Tooltips & Steppers */}
            <div className="space-y-4">
              {sliders.map((slider) => {
                const value = params[slider.key] as number;
                const isMultiplier = slider.unit === "x";
                const displayValue = isMultiplier ? `${value.toFixed(1)}x` : `${value > 0 ? "+" : ""}${value}%`;
                const isChanged = isMultiplier ? value !== 1 : value !== 0;
                const isPositive = isMultiplier ? value > 1 : value > 0;

                // Compute dynamic real-time estimated shift tooltip
                let estimatedShift = "Baseline Run-Rate";
                if (slider.key === "marketing_spend_change" && value !== 0) {
                  estimatedShift = `Est. Rev: ${value > 0 ? "+" : ""}${(value * 0.45).toFixed(1)}% · CAC: ${value > 0 ? "+" : ""}${(value * 0.3).toFixed(0)}%`;
                } else if (slider.key === "price_change" && value !== 0) {
                  estimatedShift = `Est. Demand: ${value > 0 ? "-" : "+"}${Math.abs(value * 1.2).toFixed(1)}% · Margin: ${value > 0 ? "+" : "-"}${Math.abs(value * 0.8).toFixed(1)}% pts`;
                } else if (slider.key === "inventory_change" && value !== 1.0) {
                  estimatedShift = `Stock Buffer: ${(value * 100).toFixed(0)}% (${value < 1 ? "Stockout Risk" : "Safety Surplus"})`;
                } else if (slider.key === "cac_change" && value !== 0) {
                  estimatedShift = `Est. LTV/CAC: ${value > 0 ? "-" : "+"}${Math.abs(value * 0.6).toFixed(1)}% · Payback Shift`;
                } else if (slider.key === "expense_change" && value !== 0) {
                  estimatedShift = `Net Yield: ${-value > 0 ? "+" : ""}${(-value * 0.4).toFixed(1)}% pts · Burn Delta`;
                }

                return (
                  <div key={slider.key} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3.5 transition-all hover:border-slate-700">
                    {/* Top Row: Label + Dynamic Live Micro-Badge + Stepper Controls */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <slider.Icon size={13} className="text-blue-400" />
                        {slider.label}
                      </label>

                      <div className="flex items-center gap-2">
                        {/* Live Dynamic Micro-Badge */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                          isChanged 
                            ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/30" 
                            : "text-slate-500 bg-slate-900 border-slate-800"
                        }`}>
                          {estimatedShift}
                        </span>

                        {/* Value stepper */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStep(slider.key, -slider.step, slider.min, slider.max)}
                            className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                            aria-label="Decrease"
                          >
                            <Minus size={11} />
                          </button>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border min-w-[3.5rem] text-center ${
                              isChanged
                                ? isPositive
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                  : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                                : "text-slate-400 bg-slate-800/50 border-slate-700"
                            }`}
                          >
                            {displayValue}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStep(slider.key, slider.step, slider.min, slider.max)}
                            className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                            aria-label="Increase"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={value}
                      onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-colors"
                    />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Revenue ($)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="number"
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(e.target.value)}
                    placeholder="e.g. 42000 (Baseline: $38k)"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Profit Margin (%)
                </label>
                <div className="relative">
                  <Percent size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    placeholder="e.g. 5.0 (Baseline: 0.5%)"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3.5 text-xs text-blue-300 leading-relaxed flex items-start gap-2 border-dashed">
              <Target size={15} className="shrink-0 text-blue-400 mt-0.5 animate-pulse" />
              <span>
                ML Solver will calculate optimal parameter changes closest to current run-rate to satisfy the specified targets.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action and Instant Summary */}
      <div className="mt-6 pt-4 border-t border-slate-800/80">
        {mode === "simulate" ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading
                ? "bg-blue-600/30 text-blue-200 cursor-wait border border-blue-500/30"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-blue-300" />
                Simulating Enterprise Dynamics...
              </>
            ) : (
              <>
                <Rocket size={16} />
                Run What-If Simulation
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSolveGoalSeek}
            disabled={isSolving || (!targetRevenue && !targetMargin)}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isSolving || (!targetRevenue && !targetMargin)
                ? "bg-blue-600/20 text-blue-300/40 cursor-not-allowed border border-blue-500/10"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            }`}
          >
            {isSolving ? (
              <>
                <Loader2 size={16} className="animate-spin text-blue-300" />
                Solving Multi-Variable Targets...
              </>
            ) : (
              <>
                <Target size={16} />
                Solve Target Scenario
              </>
            )}
          </button>
        )}

        {/* Quick Result Deltas */}
        {result && (
          <div className="mt-4 pt-3 border-t border-slate-800/50">
            <p className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Simulation Deltas
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(result.deltas).map(([key, value]) => (
                <div
                  key={key}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="text-[11px] text-slate-400 capitalize truncate">
                    {key.replace(/_change_pct/g, "").replace(/_/g, " ")}
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      value > 0 ? "text-emerald-400" : value < 0 ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {value > 0 ? "+" : ""}
                    {value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
