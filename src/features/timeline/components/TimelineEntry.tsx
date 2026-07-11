"use client";

import React, { useState } from "react";
import type { ActivityLog, ActivityType } from "@/features/activities/types";
import type { TripRow } from "@/features/trips/types";
import { formatIST } from "@/lib/utils";
import { Edit3, Trash2, Navigation, CheckCircle2, Lock, X, Check } from "lucide-react";
import Link from "next/link";

interface TimelineEntryProps {
  log: ActivityLog;
  activityType?: ActivityType;
  linkedTrip?: TripRow;
  durationFromPrevious?: string | null;
  onUpdateNote: (id: string, note: string) => void;
  onDeleteLog: (id: string) => void;
}

export function TimelineEntry({
  log,
  activityType,
  linkedTrip,
  durationFromPrevious,
  onUpdateNote,
  onDeleteLog,
}: TimelineEntryProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(log.notes || "");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const hex = activityType?.color || "#6366F1";
  const icon = activityType?.icon || "⚡";
  const name = activityType?.name || "Activity Record";

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNote(log.id, noteText.trim());
    setIsEditingNote(false);
  };

  return (
    <div className="relative pl-6 py-2 group">
      {/* Timeline spine bullet */}
      <div
        className="absolute left-[13px] top-[18px] w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md z-10 transition-transform group-hover:scale-125"
        style={{ backgroundColor: hex }}
      />
      <div className="absolute left-[19px] top-[30px] bottom-0 w-0.5 bg-slate-800" />

      {/* Duration from previous pill */}
      {durationFromPrevious && (
        <div className="mb-1.5 ml-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
            +{durationFromPrevious} since previous event
          </span>
        </div>
      )}

      {/* Main Log Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5 drop-shadow-sm">{icon}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-slate-100">{name}</h4>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono"
                  style={{
                    backgroundColor: `${hex}18`,
                    color: hex,
                    border: `1px solid ${hex}30`,
                  }}
                >
                  {activityType?.category || "LOG"}
                </span>

                {linkedTrip && (
                  <Link
                    href={`/trips?id=${linkedTrip.id}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium hover:bg-emerald-500/25 transition-colors"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    <span>Trip: {linkedTrip.origin_label} ➔ {linkedTrip.destination_label}</span>
                  </Link>
                )}
              </div>

              {/* Notes display or inline edit form */}
              {isEditingNote ? (
                <form onSubmit={handleSaveNote} className="mt-2.5 flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter note details..."
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button type="submit" className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(false)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : log.notes ? (
                <p className="text-xs text-slate-300 italic mt-1 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/80">
                  &quot;{log.notes}&quot;
                </p>
              ) : null}
            </div>
          </div>

          {/* Timestamp & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono font-extrabold text-slate-200 block">
                {formatIST(log.logged_at, "hh:mm:ss a")}
              </span>
              <span className="text-[9px] font-mono text-slate-500 flex items-center justify-start sm:justify-end gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Immutable IST
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditingNote(!isEditingNote)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                title="Edit Note"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {showConfirmDelete ? (
                <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-500/40">
                  <span className="text-[10px] text-red-300 font-bold px-1">Delete?</span>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1 rounded bg-red-600 text-white hover:bg-red-500"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="p-1 rounded bg-slate-800 text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete Log Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
