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
import type { ExpenseDayTrend } from "../hooks/useAnalyticsData";
import { DollarSign } from "lucide-react";

interface ExpenseTrendChartProps {
  data: ExpenseDayTrend[];
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
      <div>
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Reimbursable vs Personal Spend</span>
        </h3>
        <p className="text-xs text-slate-400">Daily financial ledger comparison (INR ₹)</p>
      </div>

      <div className="w-full h-64 my-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="dateLabel" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F172A",
                borderColor: "#334155",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#F8FAFC",
              }}
              formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)}`, ""]}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "11px", color: "#CBD5E1" }}
            />
            <Bar dataKey="reimbursable" name="Reimbursable Claim" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="personal" name="Personal Expense" fill="#64748B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
