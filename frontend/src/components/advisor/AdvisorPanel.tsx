"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Megaphone,
  Boxes,
  ShieldCheck,
  Layers,
  CheckSquare,
  Square,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { SimulationResponse, LLMInsight, ExecutivePersonaInsight } from "@/lib/types";
import { getAdvisorInsights } from "@/lib/api";

interface AdvisorPanelProps {
  simulationResult: SimulationResponse | null;
}

type TabType = "synthesis" | "cfo" | "cmo" | "coo";

const confidenceColors = {
  Low: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  High: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

export default function AdvisorPanel({ simulationResult }: AdvisorPanelProps) {
  const [insights, setInsights] = useState<LLMInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("synthesis");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isSpeaking && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeTab]);

  const handleVoiceBriefing = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = "";
    if (activeTab === "synthesis" && insights) {
      textToSpeak = `Executive Committee Synthesis. Confidence level is ${insights.confidence}. ${insights.executive_summary}`;
    } else if (activeTab === "cfo" && insights?.cfo_viewpoint) {
      textToSpeak = `Virtual CFO Strategic Viewpoint. Chief Financial Officer focus on ${insights.cfo_viewpoint.perspective}. ${insights.cfo_viewpoint.analysis}`;
    } else if (activeTab === "cmo" && insights?.cmo_viewpoint) {
      textToSpeak = `Virtual CMO Strategic Viewpoint. Chief Marketing Officer focus on ${insights.cmo_viewpoint.perspective}. ${insights.cmo_viewpoint.analysis}`;
    } else if (activeTab === "coo" && insights?.coo_viewpoint) {
      textToSpeak = `Virtual COO Strategic Viewpoint. Chief Operating Officer focus on ${insights.coo_viewpoint.perspective}. ${insights.coo_viewpoint.analysis}`;
    }

    if (!textToSpeak) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleAction = (key: string) => {
    setCheckedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchInsights = async () => {
    if (!simulationResult) return;

    setIsLoading(true);
    setError(null);
    setInsights(null);
    setDisplayedText("");
    setCheckedActions({});

    try {
      const result = await getAdvisorInsights(simulationResult);
      setInsights(result);

      // Typing animation for executive summary
      setIsTyping(true);
      const text = result.executive_summary;
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 10);
    } catch (err: any) {
      setError(err.message || "Failed to generate strategic insights");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (simulationResult) {
      fetchInsights();
    }
  }, [simulationResult?.id]);

  const handleCopy = () => {
    if (!insights) return;
    const cfo = insights.cfo_viewpoint ? `\n\nVIRTUAL CFO:\n${insights.cfo_viewpoint.analysis}\nActions:\n${insights.cfo_viewpoint.action_items.map((a, i) => `  ${i+1}. ${a}`).join("\n")}` : "";
    const cmo = insights.cmo_viewpoint ? `\n\nVIRTUAL CMO:\n${insights.cmo_viewpoint.analysis}\nActions:\n${insights.cmo_viewpoint.action_items.map((a, i) => `  ${i+1}. ${a}`).join("\n")}` : "";
    const coo = insights.coo_viewpoint ? `\n\nVIRTUAL COO:\n${insights.coo_viewpoint.analysis}\nActions:\n${insights.coo_viewpoint.action_items.map((a, i) => `  ${i+1}. ${a}`).join("\n")}` : "";

    const fullText = `AI MULTI-AGENT EXECUTIVE ADVISORY REPORT (${simulationResult?.scenario_name || "Custom Scenario"})\n\nEXECUTIVE SYNTHESIS:\n${insights.executive_summary}\n\nKEY RISKS:\n${insights.key_risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nGLOBAL RECOMMENDATIONS:\n${insights.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}${cfo}${cmo}${coo}\n\nCONFIDENCE: ${insights.confidence} (${insights.confidence_rationale})`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AdvisorHeader = () => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 shadow-lg shadow-purple-500/25">
        <BrainCircuit size={20} className="text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-100">Multi-Agent C-Suite Advisory</h3>
          <span className="flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
            <Sparkles size={9} />
            Gemini 1.5 Flash
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Cross-functional strategic committee: CFO · CMO · COO
        </p>
      </div>
    </div>
  );

  if (!simulationResult) {
    return (
      <div className="glass-card-enterprise p-6 animate-fade-in delay-500">
        <AdvisorHeader />
        <div className="mt-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
            <BrainCircuit size={24} />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Awaiting Simulation Scenario</h4>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-400 leading-relaxed">
            Run a scenario via the simulator on the left to trigger the multi-agent C-Suite decision committee with domain breakdowns.
          </p>
        </div>
      </div>
    );
  }

  // Helper for persona rendering
  const renderPersona = (persona?: ExecutivePersonaInsight, colorClass = "emerald", icon = <DollarSign size={16} />) => {
    if (!persona) return null;

    const roleColorStyles: Record<string, { badge: string; border: string; bg: string; text: string; bar: string }> = {
      CFO: { badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300", border: "border-emerald-500/30", bg: "from-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500" },
      CMO: { badge: "bg-purple-500/15 border-purple-500/30 text-purple-300", border: "border-purple-500/30", bg: "from-purple-500/10", text: "text-purple-400", bar: "bg-purple-500" },
      COO: { badge: "bg-amber-500/15 border-amber-500/30 text-amber-300", border: "border-amber-500/30", bg: "from-amber-500/10", text: "text-amber-400", bar: "bg-amber-500" },
    };

    const style = roleColorStyles[persona.role] || roleColorStyles.CFO;

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Persona Header Card */}
        <div className={`rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} via-slate-900/60 to-slate-950/60 p-4.5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${style.badge} border`}>
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{persona.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${style.badge}`}>
                    {persona.role} Focus
                  </span>
                </div>
                <span className="text-xs text-slate-400">{persona.perspective}</span>
              </div>
            </div>

            {/* Impact Metric & Confidence */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Strategic Impact</div>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${style.bar} rounded-full`} style={{ width: `${persona.impact_score}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{persona.impact_score}/100</span>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${confidenceColors[persona.confidence as keyof typeof confidenceColors] || confidenceColors.High}`}>
                {persona.confidence}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {persona.analysis}
          </p>
        </div>

        {/* 2-Column Risks & Action Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Domain Risks */}
          <div className="rounded-xl border border-rose-500/20 bg-slate-950/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
              <ShieldAlert size={13} />
              {persona.role} Vulnerabilities
            </h4>
            <div className="space-y-2">
              {persona.key_risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                    !
                  </span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Checklist */}
          <div className="rounded-xl border border-blue-500/20 bg-slate-950/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
              <Zap size={13} />
              {persona.role} Execution Checklist
            </h4>
            <div className="space-y-2">
              {persona.action_items.map((action, i) => {
                const actionKey = `${persona.role}-${i}`;
                const isChecked = !!checkedActions[actionKey];
                return (
                  <div 
                    key={i} 
                    onClick={() => toggleAction(actionKey)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-blue-500/10 border-blue-500/30 text-slate-400 line-through' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <button className="mt-0.5 shrink-0 text-blue-400">
                      {isChecked ? <CheckSquare size={14} className="text-blue-400" /> : <Square size={14} className="text-slate-500" />}
                    </button>
                    <span className="text-xs leading-snug">{action}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card-enterprise p-6 animate-fade-in delay-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <AdvisorHeader />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {insights && (
            <button
              onClick={handleVoiceBriefing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSpeaking
                  ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/25 animate-pulse"
                  : "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:border-slate-600"
              }`}
              title={isSpeaking ? "Stop executive voice briefing" : "Read strategic briefing aloud"}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={13} className="text-white" />
                  <span>Stop Voice</span>
                </>
              ) : (
                <>
                  <Volume2 size={13} />
                  <span>Voice Briefing</span>
                </>
              )}
            </button>
          )}
          {insights && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all hover:border-slate-600"
              title="Copy executive report"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied Briefing!" : "Copy Report"}</span>
            </button>
          )}
          <button
            onClick={fetchInsights}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all hover:border-slate-600 disabled:opacity-50"
            title="Re-run multi-agent analysis"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-purple-400" : ""} />
            <span>Re-analyze</span>
          </button>
        </div>
      </div>

      {/* Role-Based Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("synthesis")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "synthesis"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Layers size={13} />
          <span>Full Synthesis</span>
        </button>

        <button
          onClick={() => setActiveTab("cfo")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "cfo"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <DollarSign size={13} />
          <span>Virtual CFO</span>
        </button>

        <button
          onClick={() => setActiveTab("cmo")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "cmo"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Megaphone size={13} />
          <span>Virtual CMO</span>
        </button>

        <button
          onClick={() => setActiveTab("coo")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "coo"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Boxes size={13} />
          <span>Virtual COO</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
            <Loader2 size={14} className="animate-spin" />
            <span>Multi-Agent C-Suite Committee deliberating...</span>
          </div>
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-4/6" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
            <AlertTriangle size={16} />
            <span>Insight Generation Error</span>
          </div>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-300 font-semibold underline hover:text-white"
          >
            <RefreshCw size={12} />
            Retry Request
          </button>
        </div>
      )}

      {/* Active Tab View */}
      {insights && !isLoading && (
        <div>
          {/* Synthesis Tab */}
          {activeTab === "synthesis" && (
            <div className="space-y-5 animate-fade-in">
              {/* Executive Summary Card */}
              <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-950/60 p-4.5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-400" />
                    Executive Committee Synthesis
                  </h4>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${confidenceColors[insights.confidence as keyof typeof confidenceColors] || confidenceColors.High}`}>
                    {insights.confidence} Confidence
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {displayedText}
                  {isTyping && <span className="inline-block w-1.5 h-3.5 bg-purple-400 ml-1 animate-pulse" />}
                </p>
              </div>

              {/* Key Risks & Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Key Risks */}
                <div className="rounded-xl border border-rose-500/20 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                    <ShieldAlert size={13} />
                    Global Risk Factors
                  </h4>
                  <div className="space-y-2.5">
                    {insights.key_risks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                          !
                        </span>
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div className="rounded-xl border border-emerald-500/20 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Lightbulb size={13} />
                    Strategic Directives
                  </h4>
                  <div className="space-y-2.5">
                    {insights.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          {i + 1}
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistical Confidence Rationale */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-400">
                <span className="text-[11px] text-slate-500 italic">
                  Rationale: {insights.confidence_rationale}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <TrendingUp size={12} className="text-blue-400" />
                  Walk-forward validated
                </span>
              </div>
            </div>
          )}

          {/* CFO Tab */}
          {activeTab === "cfo" && renderPersona(insights.cfo_viewpoint, "emerald", <DollarSign size={16} />)}

          {/* CMO Tab */}
          {activeTab === "cmo" && renderPersona(insights.cmo_viewpoint, "purple", <Megaphone size={16} />)}

          {/* COO Tab */}
          {activeTab === "coo" && renderPersona(insights.coo_viewpoint, "amber", <Boxes size={16} />)}
        </div>
      )}
    </div>
  );
}
