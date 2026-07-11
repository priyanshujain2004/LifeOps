"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatDuration } from "@/lib/utils";
import { Navigation, CheckCircle2, AlertCircle, ArrowRight, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ActiveTripBanner() {
  const { activeTrip, setActiveTrip } = useAppStore();
  const [elapsed, setElapsed] = useState<string>("0m");
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!activeTrip) return;
    const updateElapsed = () => {
      setElapsed(formatDuration(activeTrip.departed_at, new Date()));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 30000); // every 30s
    return () => clearInterval(interval);
  }, [activeTrip]);

  if (!activeTrip) return null;

  const handleEndTrip = async () => {
    if (isEnding) return;
    setIsEnding(true);
    const arrivedAt = new Date().toISOString();
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("trips")
        .update({
          status: "COMPLETED",
          arrived_at: arrivedAt,
        })
        .eq("id", activeTrip.id);

      if (error) {
        toast.error("Failed to end trip on server, completing locally.");
      } else {
        toast.success(`Trip Completed: ${activeTrip.origin_label} ➔ ${activeTrip.destination_label} (${elapsed})`);
      }
      setActiveTrip(null);
    } catch (err) {
      toast.error("Error ending trip.");
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 border-b border-indigo-500/40 text-white px-4 py-3 shadow-lg backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 animate-pulse">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-indigo-300">
              <span>Active Trip • {activeTrip.trip_type.replace(/_/g, " ")}</span>
              {activeTrip.reimbursable ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Reimbursable
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px]">
                  Personal
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100 mt-0.5">
              <span>{activeTrip.origin_label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeTrip.destination_label}</span>
              <span className="ml-1 text-xs font-mono font-normal text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                ⏱ {elapsed}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleEndTrip}
          disabled={isEnding}
          className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{isEnding ? "Ending..." : "End Trip"}</span>
        </button>
      </div>
    </div>
  );
}
