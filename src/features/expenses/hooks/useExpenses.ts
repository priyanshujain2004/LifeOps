"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureDatabaseSeeded } from "@/lib/supabase/seeder";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAppStore } from "@/store/useAppStore";
import type { ExpenseRow, ExpenseCategory } from "../types";
import type { TripRow } from "@/features/trips/types";
import { queueExpense } from "@/lib/offline/idb";
import { toast } from "sonner";
import { appMemoryCache } from "@/lib/cache";

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRow[]>(appMemoryCache.expenses || []);
  const [trips, setTrips] = useState<TripRow[]>(appMemoryCache.trips || []);
  const [loading, setLoading] = useState(!appMemoryCache.hasLoadedExpenses);
  const { isOffline, activeTrip, updatePendingCount } = useAppStore();

  const fetchExpensesAndTrips = useCallback(async () => {
    if (!user?.id) return;
    if (!appMemoryCache.hasLoadedExpenses) {
      setLoading(true);
    }
    try {
      await ensureDatabaseSeeded(user.id);
      const supabase = getSupabaseBrowserClient();

      // Fetch expenses
      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      const resolvedExp = expData || (appMemoryCache.expenses || []);
      setExpenses(resolvedExp);
      appMemoryCache.expenses = resolvedExp;
      appMemoryCache.hasLoadedExpenses = true;

      // Fetch trips for linking dropdown if not already cached
      if (!appMemoryCache.trips) {
        const { data: tripsData } = await supabase
          .from("trips")
          .select("*")
          .eq("user_id", user.id)
          .order("departed_at", { ascending: false })
          .limit(20);

        if (tripsData) {
          setTrips(tripsData);
          appMemoryCache.trips = tripsData;
        }
      } else {
        setTrips(appMemoryCache.trips);
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchExpensesAndTrips();
  }, [fetchExpensesAndTrips]);

  // Compute monthly metrics
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalAmount = 0;
    let reimbursableAmount = 0;
    let nonReimbursableAmount = 0;

    const currentMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.logged_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    currentMonthExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totalAmount += amt;
      if (e.reimbursable) {
        reimbursableAmount += amt;
      } else {
        nonReimbursableAmount += amt;
      }
    });

    const reimbursablePct = totalAmount > 0 ? Math.round((reimbursableAmount / totalAmount) * 100) : 0;

    return {
      totalAmount,
      reimbursableAmount,
      nonReimbursableAmount,
      reimbursablePct,
      count: currentMonthExpenses.length,
    };
  }, [expenses]);

  const addExpense = async (
    category: ExpenseCategory,
    amount: number,
    description: string,
    reimbursable: boolean,
    tripId?: string | null,
    activityLogId?: string | null,
    receiptFile?: File | null
  ) => {
    if (!user?.id) return;
    const nowIso = new Date().toISOString();
    const tempId = `exp-${Date.now()}`;
    let receiptUrl: string | null = null;

    // 1. Upload receipt photo to Supabase Storage if provided and online
    if (receiptFile && !isOffline) {
      try {
        const supabase = getSupabaseBrowserClient();
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `user-receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receiptFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(filePath);
          receiptUrl = publicUrlData?.publicUrl || null;
        } else {
          console.warn("Receipt upload failed:", uploadError);
        }
      } catch (err) {
        console.error("Storage error:", err);
      }
    }

    const newExpense: ExpenseRow = {
      id: tempId,
      user_id: user.id,
      trip_id: tripId || (activeTrip ? activeTrip.id : null),
      activity_log_id: activityLogId || null,
      category,
      amount,
      description: description || null,
      reimbursable,
      receipt_url: receiptUrl,
      logged_at: nowIso,
      created_at: nowIso,
    };

    setExpenses((prev) => {
      const next = [newExpense, ...prev];
      appMemoryCache.expenses = next;
      return next;
    });
    toast.success(`Logged Expense: ₹${amount.toFixed(2)} (${category})`);

    if (isOffline) {
      await queueExpense({
        client_temp_id: tempId,
        user_id: user.id,
        trip_id: tripId || (activeTrip ? activeTrip.id : null),
        activity_log_id: activityLogId || null,
        category,
        amount,
        description: description || null,
        reimbursable,
        logged_at: nowIso,
        created_at: nowIso,
      });
      await updatePendingCount();
    } else {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("expenses")
          .insert({
            user_id: user.id,
            trip_id: tripId || (activeTrip ? activeTrip.id : null),
            activity_log_id: activityLogId || null,
            category,
            amount,
            description: description || null,
            reimbursable,
            receipt_url: receiptUrl,
            logged_at: nowIso,
          })
          .select()
          .single();

        if (data) {
          setExpenses((prev) => {
            const next = prev.map((e) => (e.id === tempId ? data : e));
            appMemoryCache.expenses = next;
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to insert expense to server:", err);
      }
    }
  };

  const editExpense = async (
    id: string,
    category: ExpenseCategory,
    amount: number,
    description: string,
    reimbursable: boolean,
    tripId?: string | null
  ) => {
    setExpenses((prev) => {
      const next = prev.map((e) =>
        e.id === id
          ? {
              ...e,
              category,
              amount,
              description: description || null,
              reimbursable,
              trip_id: tripId || null,
            }
          : e
      );
      appMemoryCache.expenses = next;
      return next;
    });
    toast.success("Expense updated");

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("expenses")
        .update({
          category,
          amount,
          description: description || null,
          reimbursable,
          trip_id: tripId || null,
        })
        .eq("id", id);
    } catch (err) {
      console.error("Failed to update expense:", err);
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      appMemoryCache.expenses = next;
      return next;
    });
    toast.success("Expense deleted");
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("expenses").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  return {
    expenses,
    trips,
    loading,
    monthlySummary,
    addExpense,
    editExpense,
    deleteExpense,
    refresh: fetchExpensesAndTrips,
  };
}
