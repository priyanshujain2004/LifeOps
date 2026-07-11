// Client-side memory cache for zero-skeleton tab transitions
import type { ActivityType, ActivityLog } from "@/features/activities/types";
import type { TripRow, LocationRow } from "@/features/trips/types";
import type { ExpenseRow } from "@/features/expenses/types";
import type { BankAccount } from "@/features/bank-accounts/types";

export interface AppMemoryCache {
  hasLoadedActivities: boolean;
  activityTypes: ActivityType[] | null;
  todayLogs: ActivityLog[] | null;
  
  hasLoadedTrips: boolean;
  trips: TripRow[] | null;
  locations: LocationRow[] | null;
  
  hasLoadedExpenses: boolean;
  expenses: ExpenseRow[] | null;

  hasLoadedBankAccounts: boolean;
  bankAccounts: BankAccount[] | null;

  hasLoadedSettings: boolean;

  timelineLogsByDate: Record<string, ActivityLog[]>;
  clear: () => void;
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

  hasLoadedBankAccounts: false,
  bankAccounts: null,

  hasLoadedSettings: false,

  timelineLogsByDate: {},

  clear() {
    this.hasLoadedActivities = false;
    this.activityTypes = null;
    this.todayLogs = null;
    this.hasLoadedTrips = false;
    this.trips = null;
    this.locations = null;
    this.hasLoadedExpenses = false;
    this.expenses = null;
    this.hasLoadedBankAccounts = false;
    this.bankAccounts = null;
    this.hasLoadedSettings = false;
    this.timelineLogsByDate = {};
  },
};
