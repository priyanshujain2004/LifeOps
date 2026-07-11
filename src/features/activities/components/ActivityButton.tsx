"use client";

import React, { useEffect, useState } from "react";
import type { ActivityType } from "../types";
import { useAppStore } from "@/store/useAppStore";
import { formatDuration } from "@/lib/utils";
import { PlusCircle, StopCircle, Zap } from "lucide-react";

interface ActivityButtonProps {
  activity: ActivityType;
  onLogDirect: (activity: ActivityType) => void;
  onOpenNoteModal: (activity: ActivityType) => void;
  onLogPairEnd: (startActivityId: string, pairLabel: string) => void;
}

export function ActivityButton({
  activity,
  onLogDirect,
  onOpenNoteModal,
  onLogPairEnd,
}: ActivityButtonProps) {
  const { activePairedActivities } = useAppStore();
  const [elapsed, setElapsed] = useState<string>("");

  // Check if this activity is paired and currently in progress
  const activePairSession =
    activePairedActivities[activity.id] ||
    (activity.pair_label ? activePairedActivities[activity.pair_label] : undefined);

  useEffect(() => {
    if (!activePairSession) return;
    const updateTime = () => {
      setElapsed(formatDuration(activePairSession.startTime, new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [activePairSession]);

  const hexColor = activity.color || "#6366F1";

  // If currently active (Paired Start has been tapped) -> Flip to show END button
  if (activePairSession && activity.pair_label) {
    return (
      <div
        title={`End ${activity.pair_label} session (tap to record exact stop time)`}
        className="group relative flex flex-col justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer shadow-lg overflow-hidden animate-fade-in bg-white dark:bg-slate-900 border-indigo-500/80 shadow-indigo-500/20"
        onClick={() => onLogPairEnd(activity.id, activity.pair_label!)}
      >
        {/* Active pulsing accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse" />

        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl drop-shadow-sm">{activity.icon || "⚡"}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold tracking-wide uppercase border border-indigo-500/30">
            <StopCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span>Active • {elapsed}</span>
          </span>
        </div>

        <div className="mt-3">
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            End {activity.pair_label}
          </h4>
          <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
            Tap to stop clock & record duration
          </p>
        </div>
      </div>
    );
  }

  // Normal / Start state button
  return (
    <div
      title={`Tap to instantly log "${activity.name}" at current time`}
      className="group relative flex flex-col justify-between p-3.5 rounded-2xl border bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] overflow-hidden select-none"
      onClick={() => onLogDirect(activity)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl drop-shadow-sm">{activity.icon || "⚡"}</span>

        {/* Small action button for adding custom note or inline expense before log */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenNoteModal(activity);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          title="Add Note or Expense before logging"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-1.5">
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-400 transition-colors">
            {activity.name}
          </h4>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${hexColor}18`,
              color: hexColor,
              border: `1px solid ${hexColor}30`,
            }}
          >
            {activity.category}
          </span>
          {activity.is_paired && (
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-mono">
              <Zap className="w-2.5 h-2.5 text-indigo-400" /> Start
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
