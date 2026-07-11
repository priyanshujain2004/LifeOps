"use client";

import React from "react";
import { Briefcase, Navigation, Moon, Coffee, Sparkles } from "lucide-react";

interface MetricsCardsProps {
  avgWorkHrs: number;
  avgCommuteHrs: number;
  avgSleepHrs: number;
  avgFreeHrs: number;
}

export function MetricsCards({ avgWorkHrs, avgCommuteHrs, avgSleepHrs, avgFreeHrs }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Productive Work */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-gradient-to-br dark:from-indigo-950/70 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/40 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Avg Work Session</span>
          <Briefcase className="w-4 h-4" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
          {avgWorkHrs} <span className="text-sm font-normal text-indigo-600 dark:text-indigo-300">hrs/day</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Core office + client site visits</p>
      </div>

      {/* Commute & Mobility */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-gradient-to-br dark:from-amber-950/70 dark:to-slate-900 border border-amber-200 dark:border-amber-500/40 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Avg Commute</span>
          <Navigation className="w-4 h-4" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
          {avgCommuteHrs} <span className="text-sm font-normal text-amber-600 dark:text-amber-300">hrs/day</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Time on road across all trips</p>
      </div>

      {/* Sleep Ratio */}
      <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-gradient-to-br dark:from-purple-950/70 dark:to-slate-900 border border-purple-200 dark:border-purple-500/40 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Avg Rest & Sleep</span>
          <Moon className="w-4 h-4" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
          {avgSleepHrs} <span className="text-sm font-normal text-purple-600 dark:text-purple-300">hrs/day</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {avgSleepHrs >= 7 ? "✨ Healthy rest window" : "⚠️ Below 7hr target"}
        </p>
      </div>

      {/* Free Time / Unlogged Gap */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-gradient-to-br dark:from-emerald-950/70 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/40 shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Free & Unlogged</span>
          <Coffee className="w-4 h-4" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
          {avgFreeHrs} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-300">hrs/day</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Unscheduled personal gap
        </p>
      </div>
    </div>
  );
}
