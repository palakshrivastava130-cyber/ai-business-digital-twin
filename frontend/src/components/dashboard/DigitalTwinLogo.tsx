"use client";

import React from "react";

export function DigitalTwinLogo() {
  return (
    <div className="relative group cursor-pointer">
      {/* Ambient Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
      
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/90 border border-slate-800/80 shadow-2xl">
        <svg
          className="w-7 h-7 text-indigo-400 group-hover:text-blue-300 transition-colors duration-300"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="nodeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="nodeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#312E81" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          
          {/* Isometric outer border */}
          <polygon
            points="50,12 88,34 88,76 50,94 12,76 12,34"
            className="stroke-slate-800/50 fill-slate-950/20"
            strokeWidth="1.5"
          />
          
          {/* Isometric Inner Prism faces */}
          <polygon
            points="50,12 88,34 50,54 12,34"
            className="stroke-slate-700/40"
            fill="url(#prismGrad)"
            strokeWidth="1.5"
          />
          <polygon
            points="12,34 50,54 50,94 12,76"
            className="stroke-slate-700/30"
            fill="url(#prismGrad)"
            strokeWidth="1.5"
          />
          <polygon
            points="88,34 50,54 50,94 88,76"
            className="stroke-slate-700/30"
            fill="url(#prismGrad)"
            strokeWidth="1.5"
          />
          
          {/* Laser Connector Line (Physical to Digital Twin connection) */}
          <line
            x1="28"
            y1="64"
            x2="72"
            y2="36"
            className="stroke-indigo-400/80"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
          
          {/* Node 1 (Physical/Source Node) */}
          <circle
            cx="28"
            cy="64"
            r="8"
            fill="url(#nodeGrad1)"
          />
          
          {/* Node 2 (Digital Twin Node) */}
          <circle
            cx="72"
            cy="36"
            r="8"
            fill="url(#nodeGrad2)"
          />
        </svg>
        
        {/* Pulsing Live Status Dot */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
        </span>
      </div>
    </div>
  );
}
