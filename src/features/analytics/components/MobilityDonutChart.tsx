"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { MobilityPieItem } from "../hooks/useAnalyticsData";
import { MapPin } from "lucide-react";

interface MobilityDonutChartProps {
  data: MobilityPieItem[];
}

export function MobilityDonutChart({ data }: MobilityDonutChartProps) {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
      <div>
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-400" />
          <span>Mobility & Location Breakdown</span>
        </h3>
        <p className="text-xs text-slate-400">Time distribution across Home, Office, and Client Site</p>
      </div>

      <div className="w-full h-64 my-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
            >
              {data.map((item, idx) => (
                <Cell key={idx} fill={item.color} stroke="#0F172A" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F172A",
                borderColor: "#334155",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#F8FAFC",
              }}
              formatter={(val: any) => [`${val} hrs/units`, ""]}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "11px", color: "#CBD5E1" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
