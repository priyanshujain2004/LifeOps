"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { ActivityType, ActivityLog } from "../types";
import { DEFAULT_ACTIVITY_TYPES } from "../types/seedDefaults";
import { queueActivityLog } from "@/lib/offline/idb";
import { toast } from "sonner";
import { formatIST } from "@/lib/utils";
import { appMemoryCache } from "@/lib/cache";

export function useActivities() {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
    appMemoryCache.activityTypes || DEFAULT_ACTIVITY_TYPES
  );
  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>(
    appMemoryCache.todayLogs || []
  );
  const [loading, setLoading] = useState(!appMemoryCache.hasLoadedActivities);
  const { isOffline, activeTrip, startPairedActivity, endPairedActivity, updatePendingCount } = useAppStore();

  const fetchActivities = useCallback(async () => {
    if (!appMemoryCache.hasLoadedActivities) {
      setLoading(true);
    }
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch user's active activity types
      const { data: typesData, error: typesError } = await supabase
        .from("activity_types")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      const resolvedTypes = (!typesError && typesData && typesData.length > 0) ? typesData : (appMemoryCache.activityTypes || DEFAULT_ACTIVITY_TYPES);
      setActivityTypes(resolvedTypes);
      appMemoryCache.activityTypes = resolvedTypes;

      // Fetch today's logs
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data: logsData, error: logsError } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("logged_at", startOfDay.toISOString())
        .order("logged_at", { ascending: false });

      const resolvedLogs = (!logsError && logsData) ? logsData : (appMemoryCache.todayLogs || []);
      setTodayLogs(resolvedLogs);
      appMemoryCache.todayLogs = resolvedLogs;
      appMemoryCache.hasLoadedActivities = true;
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const logActivity = async (
    activityType: ActivityType,
    notes?: string | null,
    onExpenseTrigger?: (activityLogId: string, isReimbursable: boolean) => void
  ) => {
    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Handle Paired Start/End state
    let targetActivityId = activityType.id;
    let targetActivityName = activityType.name;

    // Create optimistic log record
    const newLog: ActivityLog = {
      id: tempId,
      user_id: "current-user",
      activity_type_id: targetActivityId,
      logged_at: nowIso,
      notes: notes || null,
      location_lat: null,
      location_lng: null,
      trip_id: activeTrip ? activeTrip.id : null,
      created_at: nowIso,
    };

    // Update optimistic UI right away
    setTodayLogs((prev) => {
      const next = [newLog, ...prev];
      appMemoryCache.todayLogs = next;
      return next;
    });

    // Handle pairing logic
    if (activityType.is_paired && activityType.pair_label) {
      startPairedActivity({
        startActivityId: activityType.id,
        startActivityName: activityType.name,
        startTime: nowIso,
        pairLabel: activityType.pair_label,
      });
      toast.success(`Started: ${activityType.name} at ${formatIST(nowIso, "hh:mm a")}`);
    } else {
      toast.success(`Logged: ${targetActivityName} at ${formatIST(nowIso, "hh:mm a")}`);
    }

    // Save to server or offline queue
    if (isOffline) {
      await queueActivityLog({
        client_temp_id: tempId,
        user_id: "current-user",
        activity_type_id: targetActivityId,
        logged_at: nowIso,
        notes: notes || null,
        trip_id: activeTrip ? activeTrip.id : null,
        created_at: nowIso,
      });
      await updatePendingCount();
    } else {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("activity_logs")
          .insert({
            user_id: "demo-user",
            activity_type_id: targetActivityId,
            logged_at: nowIso,
            notes: notes || null,
            trip_id: activeTrip ? activeTrip.id : null,
          })
          .select()
          .single();

        if (error) {
          console.warn("Server insert failed, queuing offline:", error);
          await queueActivityLog({
            client_temp_id: tempId,
            user_id: "current-user",
            activity_type_id: targetActivityId,
            logged_at: nowIso,
            notes: notes || null,
            trip_id: activeTrip ? activeTrip.id : null,
            created_at: nowIso,
          });
          await updatePendingCount();
        } else if (data) {
          setTodayLogs((prev) => {
            const next = prev.map((l) => (l.id === tempId ? data : l));
            appMemoryCache.todayLogs = next;
            return next;
          });
          if (onExpenseTrigger && activityType.is_expense_trigger) {
            onExpenseTrigger(data.id, activeTrip?.reimbursable || false);
          }
        }
      } catch (err) {
        console.error("Failed to log activity to Supabase:", err);
      }
    }
  };

  const logPairEnd = async (
    startActivityId: string,
    pairLabel: string,
    notes?: string | null
  ) => {
    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;

    // Find matching END activity type if it exists in activityTypes list
    const endType = activityTypes.find((t) => t.name.toLowerCase() === pairLabel.toLowerCase());
    const endTypeId = endType ? endType.id : startActivityId; // fallback if not found

    const newLog: ActivityLog = {
      id: tempId,
      user_id: "current-user",
      activity_type_id: endTypeId,
      logged_at: nowIso,
      notes: notes || null,
      location_lat: null,
      location_lng: null,
      trip_id: activeTrip ? activeTrip.id : null,
      created_at: nowIso,
    };

    setTodayLogs((prev) => {
      const next = [newLog, ...prev];
      appMemoryCache.todayLogs = next;
      return next;
    });
    endPairedActivity(startActivityId);
    toast.success(`Completed: ${pairLabel} at ${formatIST(nowIso, "hh:mm a")}`);

    if (isOffline) {
      await queueActivityLog({
        client_temp_id: tempId,
        user_id: "current-user",
        activity_type_id: endTypeId,
        logged_at: nowIso,
        notes: notes || null,
        trip_id: activeTrip ? activeTrip.id : null,
        created_at: nowIso,
      });
      await updatePendingCount();
    } else {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("activity_logs")
          .insert({
            user_id: "demo-user",
            activity_type_id: endTypeId,
            logged_at: nowIso,
            notes: notes || null,
            trip_id: activeTrip ? activeTrip.id : null,
          })
          .select()
          .single();

        if (data) {
          setTodayLogs((prev) => {
            const next = prev.map((l) => (l.id === tempId ? data : l));
            appMemoryCache.todayLogs = next;
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to insert end log:", err);
      }
    }
  };

  return {
    activityTypes,
    todayLogs,
    loading,
    logActivity,
    logPairEnd,
    refresh: fetchActivities,
  };
}
