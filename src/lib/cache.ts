// Client-side memory cache for zero-skeleton tab transitions
import type { ActivityType, ActivityLog } from "@/features/activities/types";
import type { TripRow, LocationRow } from "@/features/trips/types";
import type { ExpenseRow } from "@/features/expenses/types";

export interface AppMemoryCache {
  hasLoadedActivities: boolean;
  activityTypes: ActivityType[] | null;
  todayLogs: ActivityLog[] | null;
  
  hasLoadedTrips: boolean;
  trips: TripRow[] | null;
  locations: LocationRow[] | null;
  
  hasLoadedExpenses: boolean;
  expenses: ExpenseRow[] | null;

  hasLoadedSettings: boolean;

  timelineLogsByDate: Record<string, ActivityLog[]>;
}

export const appMemoryCache: AppMemoryCache = {
  hasLoadedActivities: false,
  activityTypes: null,
  todayLogs: null,

  hasLoadedTrips: false,
  trips: null,
  locations: null,

  hasLoadedExpenses: false,
  expenses: null,

  hasLoadedSettings: false,

  timelineLogsByDate: {},
};
