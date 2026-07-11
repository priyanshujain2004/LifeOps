"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureDatabaseSeeded } from "@/lib/supabase/seeder";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { ActivityLog, ActivityType } from "@/features/activities/types";
import { DEFAULT_ACTIVITY_TYPES } from "@/features/activities/types/seedDefaults";
import type { TripRow } from "@/features/trips/types";
import { getTodayIST } from "@/lib/utils";
import { toast } from "sonner";
import { appMemoryCache } from "@/lib/cache";

export function useTimeline(initialDate?: string) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayIST());
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const dateKey = initialDate || getTodayIST();
    if (dateKey === getTodayIST() && appMemoryCache.todayLogs) {
      return [...appMemoryCache.todayLogs].reverse();
    }
    return appMemoryCache.timelineLogsByDate[dateKey] || [];
  });
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
    appMemoryCache.activityTypes || DEFAULT_ACTIVITY_TYPES
  );
  const [trips, setTrips] = useState<TripRow[]>(appMemoryCache.trips || []);
  const [loading, setLoading] = useState(() => {
    const dateKey = initialDate || getTodayIST();
    if (dateKey === getTodayIST() && appMemoryCache.todayLogs) return false;
    return !appMemoryCache.timelineLogsByDate[dateKey];
  });

  const fetchTimeline = useCallback(async () => {
    if (!user?.id) return;
    if (!appMemoryCache.timelineLogsByDate[selectedDate] && !(selectedDate === getTodayIST() && appMemoryCache.todayLogs)) {
      setLoading(true);
    }
    try {
      await ensureDatabaseSeeded(user.id);
      const supabase = getSupabaseBrowserClient();

      // 1. Fetch activity types if not cached
      if (!appMemoryCache.activityTypes) {
        const { data: typesData } = await supabase.from("activity_types").select("*").eq("user_id", user.id);
        if (typesData && typesData.length > 0) {
          setActivityTypes(typesData);
          appMemoryCache.activityTypes = typesData;
        } else {
          setActivityTypes(DEFAULT_ACTIVITY_TYPES);
        }
      } else {
        setActivityTypes(appMemoryCache.activityTypes);
      }

      // 2. Fetch trips for lookup
      if (!appMemoryCache.trips) {
        const { data: tripsData } = await supabase.from("trips").select("*").eq("user_id", user.id);
        if (tripsData) {
          setTrips(tripsData);
          appMemoryCache.trips = tripsData;
        }
      } else {
        setTrips(appMemoryCache.trips);
      }

      // 3. Fetch logs for selected date (IST window from 00:00:00 to 23:59:59)
      const startOfDay = new Date(`${selectedDate}T00:00:00+05:30`).toISOString();
      const endOfDay = new Date(`${selectedDate}T23:59:59+05:30`).toISOString();

      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true }); // chronological order

      if (logsData) {
        setLogs(logsData);
        appMemoryCache.timelineLogsByDate[selectedDate] = logsData;
        if (selectedDate === getTodayIST()) {
          appMemoryCache.todayLogs = logsData;
          appMemoryCache.hasLoadedActivities = true;
        }
      } else {
        setLogs([]);
        appMemoryCache.timelineLogsByDate[selectedDate] = [];
        if (selectedDate === getTodayIST()) {
          appMemoryCache.todayLogs = [];
          appMemoryCache.hasLoadedActivities = true;
        }
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user?.id]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const syncTimelineCache = (nextLogs: ActivityLog[]) => {
    appMemoryCache.timelineLogsByDate[selectedDate] = nextLogs;
    if (selectedDate === getTodayIST()) {
      appMemoryCache.todayLogs = [...nextLogs].reverse();
    }
  };

  const updateNote = async (logId: string, newNote: string) => {
    setLogs((prev) => {
      const next = prev.map((l) => (l.id === logId ? { ...l, notes: newNote || null } : l));
      syncTimelineCache(next);
      return next;
    });
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

  const updateLogMapping = async (
    logId: string,
    activityTypeId: string,
    loggedAtIso?: string,
    newNote?: string | null
  ) => {
    setLogs((prev) => {
      const next = prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              activity_type_id: activityTypeId,
              logged_at: loggedAtIso || l.logged_at,
              notes: newNote !== undefined ? newNote : l.notes,
            }
          : l
      );
      syncTimelineCache(next);
      return next;
    });
    toast.success("Activity mapping updated");

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("activity_logs")
        .update({
          activity_type_id: activityTypeId,
          ...(loggedAtIso ? { logged_at: loggedAtIso } : {}),
          ...(newNote !== undefined ? { notes: newNote } : {}),
        })
        .eq("id", logId);
    } catch (err) {
      console.error("Error updating log mapping:", err);
    }
  };

  const deleteLog = async (logId: string) => {
    setLogs((prev) => {
      const next = prev.filter((l) => l.id !== logId);
      syncTimelineCache(next);
      return next;
    });
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
    updateLogMapping,
    deleteLog,
    refresh: fetchTimeline,
  };
}
