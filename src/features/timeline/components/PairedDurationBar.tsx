"use client";

import React from "react";
import { formatDuration } from "@/lib/utils";
import { Zap, Clock } from "lucide-react";

interface PairedDurationBarProps {
  startLogAt: string;
  endLogAt: string;
  pairLabel: string;
  color?: string | null;
}

export function PairedDurationBar({ startLogAt, endLogAt, pairLabel, color }: PairedDurationBarProps) {
  const durationStr = formatDuration(startLogAt, endLogAt);
  const hex = color || "#6366F1";

  return (
    <div className="relative my-1 pl-6">
      <div
        className="absolute left-[19px] top-0 bottom-0 w-1 rounded-full opacity-60"
        style={{ backgroundColor: hex }}
      />
      <div
        className="ml-5 py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-mono shadow-sm"
        style={{
          backgroundColor: `${hex}12`,
          borderColor: `${hex}30`,
          color: hex,
        }}
      >
        <span className="font-bold flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          <span>Completed Session: {pairLabel}</span>
        </span>
        <span className="font-extrabold flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/40">
          <Clock className="w-3 h-3" />
          <span>{durationStr}</span>
        </span>
      </div>
    </div>
  );
}
