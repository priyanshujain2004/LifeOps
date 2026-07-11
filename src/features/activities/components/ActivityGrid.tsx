"use client";

import React from "react";
import type { ActivityType, CategoryKey, CategoryGroup } from "../types";
import { ActivityButton } from "./ActivityButton";

interface ActivityGridProps {
  activityTypes: ActivityType[];
  onLogDirect: (activity: ActivityType) => void;
  onOpenNoteModal: (activity: ActivityType) => void;
  onLogPairEnd: (startActivityId: string, pairLabel: string) => void;
}

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; color: string; badgeBg: string }
> = {
  COMMUTE: { label: "Mobility & Commute", color: "#64748B", badgeBg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  WORK: { label: "Core Work Sessions", color: "#6366F1", badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  BREAK: { label: "Breaks & Refreshments", color: "#92400E", badgeBg: "bg-amber-700/10 text-amber-500 border-amber-700/20" },
  MEAL: { label: "Meals & Dining", color: "#10B981", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  SLEEP: { label: "Rest & Sleep", color: "#8B5CF6", badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  SITE_VISIT: { label: "Client Site & Projects", color: "#EF4444", badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  PERSONAL: { label: "Personal Routines & Errands", color: "#06B6D4", badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
};

const CATEGORY_ORDER: CategoryKey[] = ["WORK", "COMMUTE", "SITE_VISIT", "BREAK", "MEAL", "SLEEP", "PERSONAL"];

export function ActivityGrid({
  activityTypes,
  onLogDirect,
  onOpenNoteModal,
  onLogPairEnd,
}: ActivityGridProps) {
  // Filter out explicit end-pair rows from the initial main grid (sort_order > 100)
  // because when their start pair is tapped, ActivityButton flips automatically!
  const startActivities = activityTypes.filter((t) => (t.sort_order || 0) < 100 && t.active !== false);

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<CategoryGroup[]>((acc, catKey) => {
    const items = startActivities.filter((t) => t.category === catKey);
    if (items.length > 0) {
      acc.push({
        category: catKey,
        label: CATEGORY_META[catKey].label,
        colorClass: CATEGORY_META[catKey].color,
        badgeBg: CATEGORY_META[catKey].badgeBg,
        activities: items,
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.category} className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: group.colorClass }}
            />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {group.label}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${group.badgeBg}`}>
              {group.activities.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {group.activities.map((act) => (
              <ActivityButton
                key={act.id}
                activity={act}
                onLogDirect={onLogDirect}
                onOpenNoteModal={onOpenNoteModal}
                onLogPairEnd={onLogPairEnd}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
