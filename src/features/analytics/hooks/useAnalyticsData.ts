"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureDatabaseSeeded } from "@/lib/supabase/seeder";
import type { ActivityLog, ActivityType } from "@/features/activities/types";
import { DEFAULT_ACTIVITY_TYPES } from "@/features/activities/types/seedDefaults";
import type { TripRow } from "@/features/trips/types";
import type { ExpenseRow } from "@/features/expenses/types";
import { formatIST } from "@/lib/utils";
import { appMemoryCache } from "@/lib/cache";

export interface DayUtilizationData {
  dateLabel: string; // e.g., "Mon 11 Jul"
  WORK: number;      // hours
  COMMUTE: number;
  SITE_VISIT: number;
  BREAK: number;
  MEAL: number;
  SLEEP: number;
  PERSONAL: number;
  FREE_TIME: number;
}

export interface MobilityPieItem {
  name: string;
  value: number; // hours or count
  color: string;
}

export interface ExpenseDayTrend {
  dateLabel: string;
  reimbursable: number;
  personal: number;
}

import { useAuth } from "@/lib/auth/AuthProvider";

export function useAnalyticsData(days: number = 7) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>(appMemoryCache.todayLogs || []);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
    appMemoryCache.activityTypes || DEFAULT_ACTIVITY_TYPES
  );
  const [trips, setTrips] = useState<TripRow[]>(appMemoryCache.trips || []);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(appMemoryCache.expenses || []);
  const [loading, setLoading] = useState(
    !appMemoryCache.hasLoadedActivities || !appMemoryCache.hasLoadedTrips || !appMemoryCache.hasLoadedExpenses
  );

  const fetchAllData = useCallback(async () => {
    if (!user?.id) return;
    if (!appMemoryCache.hasLoadedActivities || !appMemoryCache.hasLoadedTrips || !appMemoryCache.hasLoadedExpenses) {
      setLoading(true);
    }
    try {
      await ensureDatabaseSeeded(user.id);
      const supabase = getSupabaseBrowserClient();

      // 1. Activity types
      const { data: typesData } = await supabase.from("activity_types").select("*").eq("user_id", user.id);
      const resolvedTypes = (typesData && typesData.length > 0) ? typesData : (appMemoryCache.activityTypes || DEFAULT_ACTIVITY_TYPES);
      setActivityTypes(resolvedTypes);
      if (typesData && typesData.length > 0) appMemoryCache.activityTypes = typesData;

      // Time window cutoff
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffIso = cutoff.toISOString();

      // 2. Activity logs
      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", cutoffIso)
        .order("logged_at", { ascending: true });

      if (logsData) {
        setLogs(logsData);
        appMemoryCache.todayLogs = logsData;
      } else {
        setLogs(appMemoryCache.todayLogs || []);
      }
      appMemoryCache.hasLoadedActivities = true;

      // 3. Trips
      const { data: tripsData } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .gte("departed_at", cutoffIso)
        .order("departed_at", { ascending: true });

      if (tripsData) {
        setTrips(tripsData);
        appMemoryCache.trips = tripsData;
      } else {
        setTrips(appMemoryCache.trips || []);
      }
      appMemoryCache.hasLoadedTrips = true;

      // 4. Expenses
      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", cutoffIso)
        .order("logged_at", { ascending: true });

      if (expData) {
        setExpenses(expData);
        appMemoryCache.expenses = expData;
      } else {
        setExpenses(appMemoryCache.expenses || []);
      }
      appMemoryCache.hasLoadedExpenses = true;
    } catch (err) {
      console.error("Error loading analytics data:", err);
    } finally {
      setLoading(false);
    }
  }, [days, user?.id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Compute daily time utilization & free time gaps
  const timeUtilizationData = useMemo<DayUtilizationData[]>(() => {
    const dayMap = new Map<string, DayUtilizationData>();

    // Initialize map for the past N days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = formatIST(d.toISOString(), "yyyy-MM-dd");
      const dateLabel = formatIST(d.toISOString(), "EEE dd MMM");

      dayMap.set(dateKey, {
        dateLabel,
        WORK: 0,
        COMMUTE: 0,
        SITE_VISIT: 0,
        BREAK: 0,
        MEAL: 0,
        SLEEP: 0,
        PERSONAL: 0,
        FREE_TIME: 0,
      });
    }

    // Process actual logs if present
    if (logs.length > 0) {
      // Group logs by date in IST
      const logsByDate = new Map<string, ActivityLog[]>();
      logs.forEach((log) => {
        const dateKey = formatIST(log.logged_at, "yyyy-MM-dd");
        if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, []);
        logsByDate.get(dateKey)!.push(log);
      });

      logsByDate.forEach((dayLogs, dKey) => {
        const entry = dayMap.get(dKey);
        if (!entry) return;

        let totalLoggedHours = 0;
        for (let i = 0; i < dayLogs.length - 1; i++) {
          const l1 = dayLogs[i];
          const l2 = dayLogs[i + 1];
          const type1 = activityTypes.find((t) => t.id === l1.activity_type_id);

          const diffHours = (new Date(l2.logged_at).getTime() - new Date(l1.logged_at).getTime()) / 3600000;
          if (diffHours > 0 && diffHours < 16) {
            const cat = (type1?.category || "PERSONAL") as keyof DayUtilizationData;
            if (typeof entry[cat] === "number") {
              (entry[cat] as number) = Number(((entry[cat] as number) + diffHours).toFixed(2));
              totalLoggedHours += diffHours;
            }
          }
        }

        entry.FREE_TIME = Math.max(0, Number((24 - totalLoggedHours).toFixed(2)));
      });
    }

    return Array.from(dayMap.values());
  }, [logs, activityTypes, days]);

  // Mobility breakdown pie data
  const mobilityData = useMemo<MobilityPieItem[]>(() => {
    let homeCount = 0;
    let officeCount = 0;
    let siteCount = 0;

    if (trips.length > 0) {
      trips.forEach((t) => {
        if (t.origin_label.toLowerCase().includes("home") || t.destination_label.toLowerCase().includes("home")) homeCount++;
        if (t.origin_label.toLowerCase().includes("office") || t.destination_label.toLowerCase().includes("office")) officeCount++;
        if (t.origin_label.toLowerCase().includes("site") || t.destination_label.toLowerCase().includes("site")) siteCount += 2;
      });
    }

    return [
      { name: "Home ➔ Office / Site", value: homeCount, color: "#64748B" },
      { name: "Office Sessions & Commute", value: officeCount, color: "#6366F1" },
      { name: "Client Site Operations", value: siteCount, color: "#EF4444" },
    ];
  }, [trips]);

  // Expense trend data
  const expenseTrendData = useMemo<ExpenseDayTrend[]>(() => {
    const dayMap = new Map<string, ExpenseDayTrend>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = formatIST(d.toISOString(), "yyyy-MM-dd");
      const dateLabel = formatIST(d.toISOString(), "MMM dd");

      dayMap.set(dateKey, {
        dateLabel,
        reimbursable: 0,
        personal: 0,
      });
    }

    expenses.forEach((e) => {
      const dateKey = formatIST(e.logged_at, "yyyy-MM-dd");
      const entry = dayMap.get(dateKey);
      if (entry) {
        const amt = Number(e.amount) || 0;
        if (e.reimbursable) {
          entry.reimbursable += amt;
        } else {
          entry.personal += amt;
        }
      }
    });

    return Array.from(dayMap.values());
  }, [expenses, days]);

  // High level KPI averages
  const kpiSummary = useMemo(() => {
    let totalWork = 0;
    let totalCommute = 0;
    let totalSleep = 0;
    let totalFree = 0;

    timeUtilizationData.forEach((d) => {
      totalWork += d.WORK + d.SITE_VISIT;
      totalCommute += d.COMMUTE;
      totalSleep += d.SLEEP;
      totalFree += d.FREE_TIME;
    });

    const numDays = Math.max(1, timeUtilizationData.length);
    return {
      avgWorkHrs: Number((totalWork / numDays).toFixed(1)),
      avgCommuteHrs: Number((totalCommute / numDays).toFixed(1)),
      avgSleepHrs: Number((totalSleep / numDays).toFixed(1)),
      avgFreeHrs: Number((totalFree / numDays).toFixed(1)),
    };
  }, [timeUtilizationData]);

  return {
    logs,
    activityTypes,
    trips,
    expenses,
    loading,
    timeUtilizationData,
    mobilityData,
    expenseTrendData,
    kpiSummary,
    refresh: fetchAllData,
  };
}
