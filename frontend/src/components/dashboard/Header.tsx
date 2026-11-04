"use client";

import { Database, FileText, RefreshCw } from "lucide-react";
import type { KPISummary } from "@/lib/types";
import { DigitalTwinLogo } from "./DigitalTwinLogo";

interface TelemetrySyncBadgeProps {
  lastUpdated: string;
  onSync: () => void;
  isLoading: boolean;
}

export function TelemetrySyncBadge({ lastUpdated, onSync, isLoading }: TelemetrySyncBadgeProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-md shadow-inner text-xs">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm shadow-emerald-400"></span>
      </span>
      
      <span className="text-slate-300 font-mono font-semibold tracking-wide select-none">
        SYNCED: <span className="text-cyan-400 font-bold">{lastUpdated || "INITIALIZED"}</span>
      </span>
      
      <button
        onClick={onSync}
        disabled={isLoading}
        className="ml-1 p-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
        title="Revalidate Telemetry State"
      >
        <RefreshCw size={13} className={isLoading ? "animate-spin text-cyan-400" : ""} />
      </button>
    </div>
  );
}

interface HeaderProps {
  apiStatus: "online" | "offline" | "checking";
  kpis: KPISummary | null;
  onExportClick: () => void;
  onRefreshClick: () => void;
  isLoadingData: boolean;
  lastUpdated: string;
}

export default function Header({
  apiStatus,
  kpis,
  onExportClick,
  onRefreshClick,
  isLoadingData,
  lastUpdated,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/85 bg-[#080c16]/85 backdrop-blur-2xl">
      <div className="max-w-[1680px] mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Left Side: Brand Identity */}
        <div className="flex items-center gap-4">
          <DigitalTwinLogo />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Enterprise Digital Twin
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                v1.2 Production
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Continuous ML Simulation & Generative Decision Suite
            </p>
          </div>
        </div>

        {/* Right Side: Telemetry Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Connection Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs shadow-inner">
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === "online"
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"
                  : apiStatus === "offline"
                  ? "bg-rose-400 shadow-sm shadow-rose-400"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-slate-300 font-medium hidden md:inline">
              {apiStatus === "online" ? "Inference Node Connected" : apiStatus === "offline" ? "Backend Offline" : "Connecting..."}
            </span>
          </div>

          {/* Ingested Records Counter */}
          {kpis && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
              <Database size={13} className="text-blue-400" />
              <span className="font-semibold">{kpis.data_points.toLocaleString()}</span>
              <span className="text-slate-500">records</span>
            </div>
          )}

          {/* Export Audit Brief Button */}
          <button
            onClick={onExportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-xs font-semibold text-blue-300 hover:text-white transition-all shadow-sm shadow-blue-500/10 active:scale-95 cursor-pointer"
            title="Generate board-ready executive audit brief"
          >
            <FileText size={13} className="text-blue-400" />
            <span className="hidden sm:inline">Export Audit Brief</span>
          </button>

          {/* Telemetry Sync Badge */}
          <TelemetrySyncBadge
            lastUpdated={lastUpdated}
            onSync={onRefreshClick}
            isLoading={isLoadingData}
          />
        </div>
      </div>
    </header>
  );
}
