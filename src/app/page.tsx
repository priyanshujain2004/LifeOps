"use client";

import React, { useState } from "react";
import { useActivities } from "@/features/activities/hooks/useActivities";
import { ActivityGrid } from "@/features/activities/components/ActivityGrid";
import { QuickNoteModal } from "@/features/activities/components/QuickNoteModal";
import type { ActivityType } from "@/features/activities/types";
import { useAppStore } from "@/store/useAppStore";
import { Zap, Navigation, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatIST, formatRelativeTime } from "@/lib/utils";

export default function HomePage() {
  const { activityTypes, todayLogs, loading, logActivity, logPairEnd } = useActivities();
  const { activeTrip, activePairedActivities } = useAppStore();
  const [selectedForNote, setSelectedForNote] = useState<ActivityType | null>(null);

  const activePairsList = Object.values(activePairedActivities);

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Quick Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Today&apos;s Logs</span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-0.5">
              {todayLogs.length}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Pairs</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {activePairsList.length}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Mobility Trip</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate max-w-[140px]">
              {activeTrip ? activeTrip.origin_label : "No Active Trip"}
            </div>
          </div>
          {activeTrip ? (
            <Link href="/trips" className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <Navigation className="w-5 h-5 animate-pulse" />
            </Link>
          ) : (
            <Link
              href="/trips"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" /> Start Trip
            </Link>
          )}
        </div>
      </div>

      {/* Active Paired Activities Widget */}
      {activePairsList.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 animate-bounce" /> Currently In Progress
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Auto duration on stop</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePairsList.map((pair) => (
              <div
                key={pair.startActivityId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{pair.startActivityName}</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Started {formatIST(pair.startTime, "hh:mm a")} ({formatRelativeTime(pair.startTime)})
                  </p>
                </div>
                <button
                  onClick={() => logPairEnd(pair.startActivityId, pair.pairLabel)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-transform active:scale-95"
                >
                  End {pair.pairLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Activity Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Quick Log Activity</span>
              <span className="text-xs font-normal text-slate-400 font-mono">1-Tap Instant Record</span>
            </h2>
          </div>
          <Link
            href="/settings"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline-offset-4 hover:underline"
          >
            Customize Buttons
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <ActivityGrid
            activityTypes={activityTypes}
            onLogDirect={(act) => logActivity(act)}
            onOpenNoteModal={(act) => setSelectedForNote(act)}
            onLogPairEnd={(startId, label) => logPairEnd(startId, label)}
          />
        )}
      </div>

      {/* Recent Feed Preview */}
      {todayLogs.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Recent Today
            </h3>
            <Link href="/timeline" className="text-xs text-indigo-400 hover:underline font-medium">
              View Full Timeline ➔
            </Link>
          </div>
          <div className="space-y-2">
            {todayLogs.slice(0, 3).map((log) => {
              const typeInfo = activityTypes.find((t) => t.id === log.activity_type_id);
              return (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeInfo?.icon || "⚡"}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{typeInfo?.name || "Activity Log"}</h4>
                      {log.notes && <p className="text-xs text-slate-400 italic mt-0.5">&quot;{log.notes}&quot;</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {formatIST(log.logged_at, "hh:mm a")}
                    </span>
                    {log.trip_id && (
                      <span className="block text-[10px] text-emerald-400 font-medium flex items-center justify-end gap-0.5 mt-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> Trip Link
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={!!selectedForNote}
        activity={selectedForNote}
        onClose={() => setSelectedForNote(null)}
        onSubmit={(notes, attachExpense) => {
          if (!selectedForNote) return;
          logActivity(selectedForNote, notes, attachExpense ? () => {
            // Can redirect to expenses page with prefill
          } : undefined);
        }}
      />
    </div>
  );
}
