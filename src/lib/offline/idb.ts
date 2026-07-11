import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface PendingActivityLog {
  client_temp_id: string;
  user_id: string;
  activity_type_id: string;
  logged_at: string;
  notes?: string | null;
  trip_id?: string | null;
  created_at: string;
}

export interface PendingExpense {
  client_temp_id: string;
  user_id: string;
  trip_id?: string | null;
  activity_log_id?: string | null;
  category: 'FOOD' | 'TRAVEL' | 'HOTEL' | 'MISC';
  amount: number;
  description?: string | null;
  reimbursable: boolean;
  receipt_url?: string | null;
  bank_account_id?: string | null;
  reimbursed_status?: 'PENDING' | 'REIMBURSED' | 'REJECTED' | 'NOT_APPLICABLE';
  reimbursed_amount?: number | null;
  reimbursed_to_account_id?: string | null;
  reimbursed_at?: string | null;
  reimbursed_notes?: string | null;
  logged_at: string;
  created_at: string;
}

interface LifeLogDBSchema extends DBSchema {
  pending_activity_logs: {
    key: string;
    value: PendingActivityLog;
    indexes: { 'by-logged_at': string };
  };
  pending_expenses: {
    key: string;
    value: PendingExpense;
    indexes: { 'by-logged_at': string };
  };
}

const DB_NAME = 'lifelog-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LifeLogDBSchema>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<LifeLogDBSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in the browser'));
  }
  if (!dbPromise) {
    dbPromise = openDB<LifeLogDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_activity_logs')) {
          const logStore = db.createObjectStore('pending_activity_logs', { keyPath: 'client_temp_id' });
          logStore.createIndex('by-logged_at', 'logged_at');
        }
        if (!db.objectStoreNames.contains('pending_expenses')) {
          const expenseStore = db.createObjectStore('pending_expenses', { keyPath: 'client_temp_id' });
          expenseStore.createIndex('by-logged_at', 'logged_at');
        }
      },
    });
  }
  return dbPromise;
}

// Activity Logs Queue Operations
export async function queueActivityLog(log: PendingActivityLog): Promise<void> {
  const db = await getOfflineDB();
  await db.put('pending_activity_logs', log);
}

export async function getQueuedActivityLogs(): Promise<PendingActivityLog[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex('pending_activity_logs', 'by-logged_at');
}

export async function removeQueuedActivityLog(client_temp_id: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('pending_activity_logs', client_temp_id);
}

// Expenses Queue Operations
export async function queueExpense(expense: PendingExpense): Promise<void> {
  const db = await getOfflineDB();
  await db.put('pending_expenses', expense);
}

export async function getQueuedExpenses(): Promise<PendingExpense[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex('pending_expenses', 'by-logged_at');
}

export async function removeQueuedExpense(client_temp_id: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('pending_expenses', client_temp_id);
}
