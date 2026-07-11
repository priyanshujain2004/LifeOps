"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { appMemoryCache } from "@/lib/cache";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { BankAccount, BankAccountInsert, BankAccountUpdate } from "@/features/bank-accounts/types";
import { useExpenses } from "@/features/expenses/hooks/useExpenses";

export interface BankAccountSummary extends BankAccount {
  totalSpent: number;
  totalReimbursedReceived: number;
  calculatedBalance: number;
}

export function useBankAccounts() {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(appMemoryCache.bankAccounts || []);
  const [loading, setLoading] = useState<boolean>(!appMemoryCache.hasLoadedBankAccounts);

  const fetchBankAccounts = useCallback(async (force = false) => {
    if (!user) {
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
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("is_default", { ascending: false })
        .order("account_name", { ascending: true });

      if (error) {
        // If table doesn't exist yet, fallback to empty
        if (error.code === "42P01") {
          console.warn("bank_accounts table not yet created in Supabase. Run migration.");
          setBankAccounts([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      const rows = data || [];
      appMemoryCache.bankAccounts = rows;
      appMemoryCache.hasLoadedBankAccounts = true;
      setBankAccounts(rows);
    } catch (err: any) {
      console.error("[useBankAccounts] Error fetching accounts:", err);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    if (!user) return null;
    const supabase = getSupabaseBrowserClient();

    try {
      // If setting default, unset old default first
      if (payload.is_default) {
        await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", user.id);
      }

      const insertPayload: BankAccountInsert = {
        ...payload,
        user_id: user.id,
      };

      const { data, error } = await supabase.from("bank_accounts").insert(insertPayload).select().single();
      if (error) throw error;

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
    if (!user) return false;
    const supabase = getSupabaseBrowserClient();

    try {
      if (updates.is_default) {
        await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", user.id);
      }

      const { error } = await supabase
        .from("bank_accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

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
    if (!user) return false;
    const supabase = getSupabaseBrowserClient();

    try {
      // Soft delete or hard delete
      const { error } = await supabase.from("bank_accounts").update({ active: false }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;

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
