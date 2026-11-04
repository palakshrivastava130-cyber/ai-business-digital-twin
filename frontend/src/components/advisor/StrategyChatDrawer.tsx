"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { SimulationResponse } from "@/lib/types";
import { sendStrategyChatMessage } from "@/lib/api";

interface StrategyChatDrawerProps {
  simulationResult: SimulationResponse | null;
}

interface Message {
  sender: "user" | "copilot";
  text: string;
  timestamp: Date;
}

export default function StrategyChatDrawer({ simulationResult }: StrategyChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "copilot",
      text: "Hello! I am your AI Strategic Copilot. Let me know if you would like me to evaluate price elasticity, test supply bottlenecks, or analyze C-Suite viewpoints on your active scenario.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollChat = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollChat();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyCtx = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const reply = await sendStrategyChatMessage(textToSend, simulationResult, historyCtx);

      const copilotMsg: Message = {
        sender: "copilot",
        text: reply.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "I encountered an error connecting to the strategic advisors node. Please check your network and retry.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { label: "Evaluate elasticity", text: "Evaluate price elasticity for this pricing scenario" },
    { label: "Stress inventory", text: "Stress test inventory stock buffer safety" },
    { label: "Audit CFO advice", text: "Audit CFO recommendations and margin checklist" },
  ];

  return (
    <>
      {/* Floating Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 border border-white/10 hover:scale-105 active:scale-95 transition-all duration-300 group"
        title="Open Strategy Copilot"
      >
        {isOpen ? (
          <X size={20} className="transition-transform rotate-90" />
        ) : (
          <div className="relative">
            <MessageSquare size={22} className="group-hover:animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Floating Chat Drawer Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[385px] h-[520px] rounded-2xl border border-slate-800 bg-slate-950/85 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-950 px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bot size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                  Strategy Copilot
                  <span className="flex items-center gap-1 rounded bg-purple-500/10 px-1 py-0.2 text-[8px] font-semibold text-purple-400 border border-purple-500/20">
                    <Sparkles size={7} /> Active
                  </span>
                </h4>
                {simulationResult && (
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    Context: {simulationResult.scenario_name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((m, idx) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border text-xs ${
                      isUser
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
                        : "bg-purple-600/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {isUser ? <User size={13} /> : <Bot size={13} />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`text-xs p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-blue-600/20 text-blue-100 border border-blue-500/25 rounded-tr-none"
                          : "bg-slate-900/60 text-slate-200 border border-slate-800 rounded-tl-none prose prose-invert prose-xs"
                      }`}
                    >
                      {/* Simple custom markdown renderer inside box */}
                      {m.text.split("\n\n").map((para, pIdx) => {
                        if (para.startsWith("###")) {
                          return <h5 key={pIdx} className="font-bold text-slate-100 mt-1 mb-0.5 text-xs uppercase tracking-wider">{para.replace(/###/g, "").trim()}</h5>;
                        }
                        if (para.startsWith("*") || para.startsWith("-")) {
                          return (
                            <ul key={pIdx} className="list-disc pl-4 space-y-0.5">
                              {para.split("\n").map((li, liIdx) => (
                                <li key={liIdx} className="text-slate-300 text-[11px]">{li.replace(/^[\s*-]+/, "").trim()}</li>
                              ))}
                            </ul>
                          );
                        }
                        return <p key={pIdx} className="text-[11px] leading-relaxed text-slate-300">{para}</p>;
                      })}
                    </div>
                    <span className="text-[9px] text-slate-500 block text-right">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 max-w-[80%]">
                <div className="h-7 w-7 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot size={13} />
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-1.5 font-mono italic">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" />
                  <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce delay-150" />
                  <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce delay-300" />
                  Deliberating strategic playbook...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions & Input Controls */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 space-y-2.5">
            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.text)}
                  disabled={isLoading}
                  className="text-[10px] px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300 flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <ArrowRight size={10} className="text-blue-400" />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                placeholder="Ask Copilot (e.g. elasticity, inventory risks)..."
                disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-all disabled:opacity-50"
              >
                <Send size={11} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
