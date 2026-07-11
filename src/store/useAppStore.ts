import { create } from 'zustand';
import type { Database } from '../lib/supabase/types';
import { getQueuedActivityLogs, getQueuedExpenses } from '../lib/offline/idb';
import { flushOfflineQueues } from '../lib/offline/sync';

type TripRow = Database['public']['Tables']['trips']['Row'];

export interface ActivePairSession {
  startActivityId: string;
  startActivityName: string;
  startTime: string; // ISO string
  pairLabel: string;
  pairEndActivityId?: string;
}

interface AppStoreState {
  isOffline: boolean;
  pendingQueueCount: number;
  isSyncing: boolean;
  activeTrip: TripRow | null;
  activePairedActivities: Record<string, ActivePairSession>; // key is startActivityId or pairLabel
  impersonatedUserId: string | null;
  
  // Actions
  setIsOffline: (status: boolean) => void;
  updatePendingCount: () => Promise<void>;
  triggerSync: () => Promise<void>;
  setActiveTrip: (trip: TripRow | null) => void;
  startPairedActivity: (session: ActivePairSession) => void;
  endPairedActivity: (startActivityId: string) => void;
  clearAllActivePairs: () => void;
  setImpersonatedUserId: (userId: string | null) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
  pendingQueueCount: 0,
  isSyncing: false,
  activeTrip: null,
  activePairedActivities: {},
  impersonatedUserId: null,

  setIsOffline: (status) => set({ isOffline: status }),

  setImpersonatedUserId: (userId) => {
    // Clear app memory cache on user switch
    try {
      if (typeof window !== 'undefined') {
        const { appMemoryCache } = require('../lib/cache');
        appMemoryCache.clear();
      }
    } catch {}
    set({ impersonatedUserId: userId });
  },

  updatePendingCount: async () => {
    if (typeof window === 'undefined') return;
    try {
      const logs = await getQueuedActivityLogs();
      const expenses = await getQueuedExpenses();
      set({ pendingQueueCount: logs.length + expenses.length });
    } catch {
      // Ignore idb read errors in SSR
    }
  },

  triggerSync: async () => {
    if (get().isSyncing || get().isOffline) return;
    set({ isSyncing: true });
    try {
      await flushOfflineQueues();
      await get().updatePendingCount();
    } finally {
      set({ isSyncing: false });
    }
  },

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  startPairedActivity: (session) =>
    set((state) => ({
      activePairedActivities: {
        ...state.activePairedActivities,
        [session.startActivityId]: session,
        [session.pairLabel]: session, // Also index by pairLabel for quick lookup
      },
    })),

  endPairedActivity: (startActivityId) =>
    set((state) => {
      const updated = { ...state.activePairedActivities };
      const session = updated[startActivityId];
      if (session) {
        delete updated[session.startActivityId];
        delete updated[session.pairLabel];
      }
      return { activePairedActivities: updated };
    }),

  clearAllActivePairs: () => set({ activePairedActivities: {} }),
}));
