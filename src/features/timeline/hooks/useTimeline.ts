"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ActivityLog, ActivityType } from "@/features/activities/types";
import { DEFAULT_ACTIVITY_TYPES } from "@/features/activities/types/seedDefaults";
import type { TripRow } from "@/features/trips/types";
import { getTodayIST } from "@/lib/utils";
import { toast } from "sonner";

export function useTimeline(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayIST());
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(DEFAULT_ACTIVITY_TYPES);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Fetch activity types
      const { data: typesData } = await supabase
        .from("activity_types")
        .select("*");
      if (typesData && typesData.length > 0) {
        setActivityTypes(typesData);
      } else {
        setActivityTypes(DEFAULT_ACTIVITY_TYPES);
      }

      // 2. Fetch trips for lookup
      const { data: tripsData } = await supabase.from("trips").select("*");
      if (tripsData) {
        setTrips(tripsData);
      }

      // 3. Fetch logs for selected date (IST window from 00:00:00 to 23:59:59)
      const startOfDay = new Date(`${selectedDate}T00:00:00+05:30`).toISOString();
      const endOfDay = new Date(`${selectedDate}T23:59:59+05:30`).toISOString();

      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true }); // chronological order

      if (logsData) {
        setLogs(logsData);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const updateNote = async (logId: string, newNote: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, notes: newNote || null } : l))
    );
    toast.success("Note updated");

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("activity_logs")
        .update({ notes: newNote || null })
        .eq("id", logId);
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const deleteLog = async (logId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    toast.success("Log entry deleted");

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("activity_logs").delete().eq("id", logId);
    } catch (err) {
      console.error("Error deleting log:", err);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    logs,
    activityTypes,
    trips,
    loading,
    updateNote,
    deleteLog,
    refresh: fetchTimeline,
  };
}
