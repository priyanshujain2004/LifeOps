"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { DayUtilizationData } from "../hooks/useAnalyticsData";
import { Clock } from "lucide-react";

interface TimeUtilizationChartProps {
  data: DayUtilizationData[];
}

export function TimeUtilizationChart({ data }: TimeUtilizationChartProps) {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Daily 24-Hour Time Allocation</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Stacked hours across core categories & calculated free time gaps</p>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="dateLabel" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 24]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F172A",
                borderColor: "#334155",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#F8FAFC",
              }}
              formatter={(val: any) => [`${Number(val || 0).toFixed(1)} hrs`, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "#CBD5E1" }}
            />
            <Bar dataKey="WORK" name="Work Session" stackId="a" fill="#6366F1" />
            <Bar dataKey="SITE_VISIT" name="Site Operations" stackId="a" fill="#EF4444" />
            <Bar dataKey="COMMUTE" name="Commute & Travel" stackId="a" fill="#F59E0B" />
            <Bar dataKey="BREAK" name="Breaks" stackId="a" fill="#D97706" />
            <Bar dataKey="MEAL" name="Meals" stackId="a" fill="#10B981" />
            <Bar dataKey="SLEEP" name="Rest & Sleep" stackId="a" fill="#8B5CF6" />
            <Bar dataKey="PERSONAL" name="Personal Errand" stackId="a" fill="#06B6D4" />
            <Bar dataKey="FREE_TIME" name="Free / Unlogged Gap" stackId="a" fill="#334155" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
