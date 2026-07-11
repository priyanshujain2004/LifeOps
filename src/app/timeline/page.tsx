"use client";

import React from "react";
import { useTimeline } from "@/features/timeline/hooks/useTimeline";
import { TimelineEntry } from "@/features/timeline/components/TimelineEntry";
import { PairedDurationBar } from "@/features/timeline/components/PairedDurationBar";
import { getTodayIST, formatDuration } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock, RotateCcw } from "lucide-react";

export default function TimelinePage() {
  const { selectedDate, setSelectedDate, logs, activityTypes, trips, loading, updateNote, updateLogMapping, deleteLog } = useTimeline();

  const handleJumpToday = () => {
    setSelectedDate(getTodayIST());
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Date Bar & Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" /> Chronological Activity Ledger
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Daily Timeline View</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Server-stamped immutable logs formatted in <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">IST (Asia/Kolkata)</span>
          </p>
        </div>

        {/* Date Picker & Jump Today */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial flex items-center">
            <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
            />
          </div>

          {selectedDate !== getTodayIST() && (
            <button
              onClick={handleJumpToday}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-colors flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Today
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chronological Stream ({logs.length} entries)
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3 pl-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800/40 animate-pulse border border-slate-300 dark:border-slate-800" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2 shadow-sm">
            <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">No logs recorded on {selectedDate}</h3>
            <p className="text-xs text-slate-500">Select another day or tap activities on the Home Screen to populate your timeline.</p>
          </div>
        ) : (
          <div className="relative space-y-1">
            {logs.map((log, idx) => {
              const actType = activityTypes.find((t) => t.id === log.activity_type_id);
              const linkedTrip = trips.find((t) => t.id === log.trip_id);

              // Calculate duration from previous log (since array is ordered ascending chronological)
              let durationFromPrevious: string | null = null;
              if (idx > 0) {
                const prevLog = logs[idx - 1];
                durationFromPrevious = formatDuration(prevLog.logged_at, log.logged_at);
              }

              // Check if this log is the END of a paired activity from earlier in the day
              let pairedBar: React.ReactNode = null;
              if (actType && !actType.is_paired) {
                // Look backward for a START log whose pair_label matches this activity's name
                for (let prevIdx = idx - 1; prevIdx >= 0; prevIdx--) {
                  const prevLog = logs[prevIdx];
                  const prevType = activityTypes.find((t) => t.id === prevLog.activity_type_id);
                  if (prevType?.is_paired && prevType.pair_label === actType.name) {
                    pairedBar = (
                      <PairedDurationBar
                        startLogAt={prevLog.logged_at}
                        endLogAt={log.logged_at}
                        pairLabel={actType.name}
                        color={actType.color}
                      />
                    );
                    break;
                  }
                }
              }

              return (
                <React.Fragment key={log.id}>
                  {pairedBar}
                  <TimelineEntry
                    log={log}
                    activityType={actType}
                    allActivityTypes={activityTypes}
                    linkedTrip={linkedTrip}
                    durationFromPrevious={durationFromPrevious}
                    onUpdateNote={(id, note) => updateNote(id, note)}
                    onUpdateMapping={(id, typeId, iso, note) => updateLogMapping(id, typeId, iso, note)}
                    onDeleteLog={(id) => deleteLog(id)}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
