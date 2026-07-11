"use client";

import React from "react";
import type { TripRow } from "../types";
import { formatIST, formatDuration } from "@/lib/utils";
import { Navigation, CheckCircle2, DollarSign, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TripListProps {
  trips: TripRow[];
  onEndTrip: (tripId: string) => void;
}

export function TripList({ trips, onEndTrip }: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
        <Navigation className="w-10 h-10 text-slate-600 mx-auto animate-bounce" />
        <h3 className="text-base font-semibold text-slate-300">No Mobility Trips Recorded</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Start your first trip session to track exact commute durations, client site visits, and automatic reimbursable travel allowances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => {
        const isInProgress = trip.status === "IN_PROGRESS";
        const durationStr = isInProgress
          ? `${formatDuration(trip.departed_at, new Date())} (Active)`
          : formatDuration(trip.departed_at, trip.arrived_at || new Date());

        return (
          <div
            key={trip.id}
            className={`p-4 rounded-2xl border transition-all ${
              isInProgress
                ? "bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/80 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {trip.trip_type.replace(/_/g, " ")}
                  </span>

                  {trip.reimbursable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Reimbursable Travel
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
                      Personal Commute
                    </span>
                  )}

                  {isInProgress && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold animate-pulse">
                      ● ACTIVE SESSION
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-base font-bold text-slate-100">
                  <span>{trip.origin_label}</span>
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                  <span>{trip.destination_label}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Departed: {formatIST(trip.departed_at, "hh:mm a")}
                  </span>
                  {trip.arrived_at && (
                    <span>Arrived: {formatIST(trip.arrived_at, "hh:mm a")}</span>
                  )}
                  <span className="text-indigo-300 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                    ⏱ {durationStr}
                  </span>
                </div>

                {trip.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800 mt-1">
                    &quot;{trip.notes}&quot;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {isInProgress ? (
                  <button
                    onClick={() => onEndTrip(trip.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow transition-transform active:scale-95"
                  >
                    End Trip Session
                  </button>
                ) : (
                  <Link
                    href={`/expenses?trip_id=${trip.id}&reimbursable=${trip.reimbursable}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Expense</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
