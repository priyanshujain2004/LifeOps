"use client";

import React, { useState } from "react";
import { useAnalyticsData } from "@/features/analytics/hooks/useAnalyticsData";
import { MetricsCards } from "@/features/analytics/components/MetricsCards";
import { TimeUtilizationChart } from "@/features/analytics/components/TimeUtilizationChart";
import { MobilityDonutChart } from "@/features/analytics/components/MobilityDonutChart";
import { ExpenseTrendChart } from "@/features/analytics/components/ExpenseTrendChart";
import { exportActivitiesToCSV, exportExpensesToCSV } from "@/features/analytics/utils/csvExport";
import { BarChart3, Download, Calendar, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(7);
  const {
    logs,
    activityTypes,
    trips,
    expenses,
    loading,
    timeUtilizationData,
    mobilityData,
    expenseTrendData,
    kpiSummary,
  } = useAnalyticsData(days);

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Header Banner & Timeframe Switcher */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Intelligence & Insights
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Time Utilization & Mobility Analytics</h1>
          <p className="text-xs text-purple-200/80 mt-1 max-w-md">
            Interactive metrics calculating productive work ratios, commute waste, rest windows, unlogged free time gaps, and reimbursable travel trends.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === 7 ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === 30 ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Past 30 Days
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportActivitiesToCSV(logs, activityTypes, trips)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              title="Export Activities & Trips CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Activities CSV</span>
            </button>

            <button
              onClick={() => exportExpensesToCSV(expenses)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              title="Export Expenses Ledger CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Expenses CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <MetricsCards
        avgWorkHrs={kpiSummary.avgWorkHrs}
        avgCommuteHrs={kpiSummary.avgCommuteHrs}
        avgSleepHrs={kpiSummary.avgSleepHrs}
        avgFreeHrs={kpiSummary.avgFreeHrs}
      />

      {/* Main Stacked Utilization Chart */}
      {loading ? (
        <div className="h-80 rounded-3xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <TimeUtilizationChart data={timeUtilizationData} />
      )}

      {/* Grid of Donut & Trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <div className="h-80 rounded-3xl bg-slate-800/40 animate-pulse border border-slate-800" />
            <div className="h-80 rounded-3xl bg-slate-800/40 animate-pulse border border-slate-800" />
          </>
        ) : (
          <>
            <MobilityDonutChart data={mobilityData} />
            <ExpenseTrendChart data={expenseTrendData} />
          </>
        )}
      </div>
    </div>
  );
}
