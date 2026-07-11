import { getQueuedActivityLogs, removeQueuedActivityLog, getQueuedExpenses, removeQueuedExpense } from "./idb";
import { getSupabaseBrowserClient } from "../supabase/client";

/**
 * Flush pending activity logs and expenses from IndexedDB to Supabase
 * @returns Object containing number of items synced or failed
 */
export async function flushOfflineQueues(): Promise<{ syncedLogs: number; syncedExpenses: number; errors: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedLogs: 0, syncedExpenses: 0, errors: 0 };
  }

  const supabase = getSupabaseBrowserClient();
  let syncedLogs = 0;
  let syncedExpenses = 0;
  let errors = 0;

  // 1. Flush Activity Logs
  try {
    const pendingLogs = await getQueuedActivityLogs();
    for (const log of pendingLogs) {
      const { error } = await supabase.from("activity_logs").insert({
        user_id: log.user_id,
        activity_type_id: log.activity_type_id,
        logged_at: log.logged_at,
        notes: log.notes || null,
        trip_id: log.trip_id || null,
      });

      if (!error) {
        await removeQueuedActivityLog(log.client_temp_id);
        syncedLogs++;
      } else {
        console.error("Failed to sync queued activity log:", error);
        errors++;
      }
    }
  } catch (err) {
    console.error("Error flushing pending activity logs:", err);
    errors++;
  }

  // 2. Flush Expenses
  try {
    const pendingExpenses = await getQueuedExpenses();
    for (const expense of pendingExpenses) {
      const { error } = await supabase.from("expenses").insert({
        user_id: expense.user_id,
        trip_id: expense.trip_id || null,
        activity_log_id: expense.activity_log_id || null,
        category: expense.category,
        amount: expense.amount,
        description: expense.description || null,
        reimbursable: expense.reimbursable,
        logged_at: expense.logged_at,
      });

      if (!error) {
        await removeQueuedExpense(expense.client_temp_id);
        syncedExpenses++;
      } else {
        console.error("Failed to sync queued expense:", error);
        errors++;
      }
    }
  } catch (err) {
    console.error("Error flushing pending expenses:", err);
    errors++;
  }

  return { syncedLogs, syncedExpenses, errors };
}
