"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { ExpenseRow, ExpenseCategory } from "../types";
import type { TripRow } from "@/features/trips/types";
import { queueExpense } from "@/lib/offline/idb";
import { toast } from "sonner";

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOffline, activeTrip, updatePendingCount } = useAppStore();

  const fetchExpensesAndTrips = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();

      // Fetch expenses
      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .order("logged_at", { ascending: false });

      if (expData && expData.length > 0) {
        setExpenses(expData);
      } else {
        setExpenses([]);
      }

      // Fetch trips for linking dropdown
      const { data: tripsData } = await supabase
        .from("trips")
        .select("*")
        .order("departed_at", { ascending: false })
        .limit(20);

      if (tripsData) {
        setTrips(tripsData);
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      user_id: "current-user",
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

    setExpenses((prev) => [newExpense, ...prev]);
    toast.success(`Logged Expense: ₹${amount.toFixed(2)} (${category})`);

    if (isOffline) {
      await queueExpense({
        client_temp_id: tempId,
        user_id: "current-user",
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
            user_id: "demo-user",
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
          setExpenses((prev) => prev.map((e) => (e.id === tempId ? data : e)));
        }
      } catch (err) {
        console.error("Failed to insert expense to server:", err);
      }
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
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
    deleteExpense,
    refresh: fetchExpensesAndTrips,
  };
}
