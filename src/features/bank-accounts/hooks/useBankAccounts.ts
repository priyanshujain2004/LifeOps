"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { appMemoryCache } from "@/lib/cache";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
<<<<<<< HEAD
import { useAppStore } from "@/store/useAppStore";
=======
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
import type { BankAccount, BankAccountInsert, BankAccountUpdate } from "@/features/bank-accounts/types";
import { useExpenses } from "@/features/expenses/hooks/useExpenses";

export interface BankAccountSummary extends BankAccount {
  totalSpent: number;
  totalReimbursedReceived: number;
  calculatedBalance: number;
}

export function useBankAccounts() {
  const { user } = useAuth();
<<<<<<< HEAD
  const { impersonatedUserId } = useAppStore();
  const targetUserId = impersonatedUserId || user?.id;
  const isReadOnly = Boolean(impersonatedUserId && impersonatedUserId !== user?.id);

=======
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
  const { expenses } = useExpenses();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(appMemoryCache.bankAccounts || []);
  const [loading, setLoading] = useState<boolean>(!appMemoryCache.hasLoadedBankAccounts);

  const fetchBankAccounts = useCallback(async (force = false) => {
<<<<<<< HEAD
    if (!targetUserId) {
=======
    if (!user) {
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
      setBankAccounts([]);
      setLoading(false);
      return;
    }

    if (!force && appMemoryCache.hasLoadedBankAccounts && appMemoryCache.bankAccounts) {
      setBankAccounts(appMemoryCache.bankAccounts);
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
<<<<<<< HEAD
      // Query without requiring `active` column in SQL to prevent column not found (42703) errors on simpler schemas
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", targetUserId)
=======
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
        .order("is_default", { ascending: false })
        .order("account_name", { ascending: true });

      if (error) {
<<<<<<< HEAD
        // If table doesn't exist yet (42P01), fallback to empty
=======
        // If table doesn't exist yet, fallback to empty
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
        if (error.code === "42P01") {
          console.warn("bank_accounts table not yet created in Supabase. Run migration.");
          setBankAccounts([]);
          setLoading(false);
          return;
        }
        throw error;
      }

<<<<<<< HEAD
      // Filter out soft-deleted accounts in memory safely (handles both rows with and without active column)
      const rows = (data || []).filter((r: any) => r.active !== false);
=======
      const rows = data || [];
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
      appMemoryCache.bankAccounts = rows;
      appMemoryCache.hasLoadedBankAccounts = true;
      setBankAccounts(rows);
    } catch (err: any) {
      console.error("[useBankAccounts] Error fetching accounts:", err);
<<<<<<< HEAD
      toast.error("Failed to load bank accounts: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);
=======
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [user]);
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  // Compute live effective balances based on all recorded expenses & reimbursements
  const accountsWithSummary: BankAccountSummary[] = useMemo(() => {
    return bankAccounts.map((acc) => {
      let totalSpent = 0;
      let totalReimbursedReceived = 0;

      expenses.forEach((exp) => {
        // Money deducted if paid from this account
        if (exp.bank_account_id === acc.id) {
          totalSpent += Number(exp.amount || 0);
        }

        // Money deposited if reimbursed into this account
        if (exp.reimbursed_status === "REIMBURSED" && exp.reimbursed_to_account_id === acc.id) {
          totalReimbursedReceived += Number(exp.reimbursed_amount !== null && exp.reimbursed_amount !== undefined ? exp.reimbursed_amount : exp.amount);
        }
      });

      const calculatedBalance = Number(acc.initial_balance || 0) - totalSpent + totalReimbursedReceived;

      return {
        ...acc,
        totalSpent,
        totalReimbursedReceived,
        calculatedBalance,
      };
    });
  }, [bankAccounts, expenses]);

  const addBankAccount = async (payload: Omit<BankAccountInsert, "user_id">) => {
<<<<<<< HEAD
    if (!targetUserId) return null;
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot add bank account.");
      return null;
    }

=======
    if (!user) return null;
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
    const supabase = getSupabaseBrowserClient();

    try {
      // If setting default, unset old default first
      if (payload.is_default) {
<<<<<<< HEAD
        await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", targetUserId);
      }

      const insertPayload: any = {
        ...payload,
        user_id: targetUserId,
      };

      const { data, error } = await supabase.from("bank_accounts").insert(insertPayload).select().single();
      if (error) {
        // If column error during insert (e.g., active or currency not in schema yet), retry with basic safe fields
        if (error.code === "42703") {
          const fallbackPayload = {
            user_id: targetUserId,
            account_name: payload.account_name,
            account_type: payload.account_type,
            initial_balance: payload.initial_balance || 0,
            is_default: payload.is_default || false,
          };
          const fallbackRes = await supabase.from("bank_accounts").insert(fallbackPayload).select().single();
          if (fallbackRes.error) throw fallbackRes.error;
          toast.success("Bank Account created!");
          await fetchBankAccounts(true);
          return fallbackRes.data;
        }
        throw error;
      }
=======
        await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", user.id);
      }

      const insertPayload: BankAccountInsert = {
        ...payload,
        user_id: user.id,
      };

      const { data, error } = await supabase.from("bank_accounts").insert(insertPayload).select().single();
      if (error) throw error;
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8

      toast.success("Bank Account created!");
      await fetchBankAccounts(true);
      return data;
    } catch (err: any) {
      console.error("[useBankAccounts] Error adding account:", err);
      toast.error(err.message || "Failed to add bank account");
      return null;
    }
  };

  const editBankAccount = async (id: string, updates: Partial<BankAccountUpdate>) => {
<<<<<<< HEAD
    if (!targetUserId) return false;
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot edit account.");
      return false;
    }

=======
    if (!user) return false;
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
    const supabase = getSupabaseBrowserClient();

    try {
      if (updates.is_default) {
<<<<<<< HEAD
        await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", targetUserId);
=======
        await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", user.id);
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8
      }

      const { error } = await supabase
        .from("bank_accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
<<<<<<< HEAD
        .eq("user_id", targetUserId);

      if (error) {
        if (error.code === "42703") {
          const safeUpdates: any = { ...updates };
          delete safeUpdates.active;
          delete safeUpdates.currency;
          delete safeUpdates.account_number;
          const retryRes = await supabase.from("bank_accounts").update(safeUpdates).eq("id", id).eq("user_id", targetUserId);
          if (retryRes.error) throw retryRes.error;
          toast.success("Account updated successfully!");
          await fetchBankAccounts(true);
          return true;
        }
        throw error;
      }
=======
        .eq("user_id", user.id);

      if (error) throw error;
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8

      toast.success("Account updated successfully!");
      await fetchBankAccounts(true);
      return true;
    } catch (err: any) {
      console.error("[useBankAccounts] Error editing account:", err);
      toast.error(err.message || "Failed to update account");
      return false;
    }
  };

  const deleteBankAccount = async (id: string) => {
<<<<<<< HEAD
    if (!targetUserId) return false;
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot delete account.");
      return false;
    }

    const supabase = getSupabaseBrowserClient();

    try {
      // First attempt hard delete to clean up the row directly
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id).eq("user_id", targetUserId);
      if (error) {
        // If hard delete restricted by FK or RLS, attempt soft delete if active column exists
        const softRes = await supabase.from("bank_accounts").update({ active: false }).eq("id", id).eq("user_id", targetUserId);
        if (softRes.error) throw error;
      }
=======
    if (!user) return false;
    const supabase = getSupabaseBrowserClient();

    try {
      // Soft delete or hard delete
      const { error } = await supabase.from("bank_accounts").update({ active: false }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
>>>>>>> 0f0fbbf81582f2a0d14c0a28c58a5763ec1c7ef8

      toast.success("Account deleted");
      await fetchBankAccounts(true);
      return true;
    } catch (err: any) {
      console.error("[useBankAccounts] Error deleting account:", err);
      toast.error("Failed to delete account");
      return false;
    }
  };

  return {
    bankAccounts: accountsWithSummary,
    rawAccounts: bankAccounts,
    loading,
    addBankAccount,
    editBankAccount,
    deleteBankAccount,
    refreshAccounts: () => fetchBankAccounts(true),
  };
}
