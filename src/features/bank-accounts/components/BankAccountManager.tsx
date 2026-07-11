"use client";

import React, { useState } from "react";
import { useBankAccounts, type BankAccountSummary } from "@/features/bank-accounts/hooks/useBankAccounts";
import { ACCOUNT_TYPE_CONFIG, type AccountType } from "@/features/bank-accounts/types";
import { Landmark, Plus, Trash2, Edit3, CheckCircle2, DollarSign, Wallet, CreditCard, Shield, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function BankAccountManager() {
  const { bankAccounts, loading, addBankAccount, editBankAccount, deleteBankAccount } = useBankAccounts();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAccountName("");
    setAccountType("SAVINGS");
    setAccountNumber("");
    setInitialBalance("0");
    setIsDefault(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (acc: BankAccountSummary) => {
    setEditingId(acc.id);
    setAccountName(acc.account_name);
    setAccountType(acc.account_type as AccountType);
    setAccountNumber(acc.account_number || "");
    setInitialBalance(String(acc.initial_balance));
    setIsDefault(acc.is_default);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;
    setSubmitting(true);

    if (editingId) {
      await editBankAccount(editingId, {
        account_name: accountName.trim(),
        account_type: accountType,
        account_number: accountNumber.trim() || null,
        initial_balance: parseFloat(initialBalance) || 0,
        is_default: isDefault,
      });
    } else {
      await addBankAccount({
        account_name: accountName.trim(),
        account_type: accountType,
        account_number: accountNumber.trim() || null,
        initial_balance: parseFloat(initialBalance) || 0,
        is_default: isDefault,
        active: true,
      });
    }

    setSubmitting(false);
    resetForm();
  };

  const totalEffectiveNetBalance = bankAccounts.reduce((sum, a) => sum + a.calculatedBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header & Net Effective Balance Summary */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider mb-2 border border-white/20">
            <Landmark className="w-3.5 h-3.5" /> Financial Vault & Wallets
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Bank Accounts & Petty Cash</h2>
          <p className="text-xs text-indigo-100 mt-1 max-w-md">
            Manage your corporate accounts, credit cards, and cash wallets. Real-time balances auto-update as you log expenses and receive reimbursements.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right min-w-[200px] shadow-inner">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-200 block">Total Live Effective Balance</span>
          <div className="text-2xl font-mono font-extrabold text-white mt-1">
            ₹{totalEffectiveNetBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-300 font-bold flex items-center justify-end gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> All {bankAccounts.length} Active Accounts Synced
          </span>
        </div>
      </div>

      {/* Add Button / Form Toggle */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 border border-indigo-400/30"
        >
          <Plus className="w-4 h-4" /> Add New Bank Account / Wallet
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {editingId ? "Edit Bank Account" : "Register New Bank Account / Wallet"}
            </h3>
            <button type="button" onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account / Wallet Name *</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. HDFC Salary Account, ICICI Credit Card, Petty Cash"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Type *</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Object.entries(ACCOUNT_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number (Optional Last 4 digits)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. XXXX-4912"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Opening Balance (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultAccount"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isDefaultAccount" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Set as Primary / Default Account for Expense Logging
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? "Saving..." : editingId ? "Update Account" : "Save Bank Account"}
            </button>
          </div>
        </form>
      )}

      {/* Account Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse border border-slate-300 dark:border-slate-800" />
          ))}
        </div>
      ) : bankAccounts.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Bank Accounts Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Add your primary bank account, credit card, or petty cash wallet above to track exact balances and map reimbursements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((acc) => {
            const cfg = ACCOUNT_TYPE_CONFIG[acc.account_type as AccountType] || ACCOUNT_TYPE_CONFIG.SAVINGS;
            return (
              <div
                key={acc.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-4 ${
                  acc.is_default ? "border-indigo-500/60 ring-1 ring-indigo-500/20" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xl shadow-inner">
                        {cfg.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{acc.account_name}</h4>
                          {acc.is_default && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {cfg.label} {acc.account_number ? `(${acc.account_number})` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(acc)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Account"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBankAccount(acc.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Initial Opening</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        ₹{Number(acc.initial_balance || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold uppercase text-rose-500 flex items-center gap-0.5">
                        <ArrowDownRight className="w-2.5 h-2.5" /> Total Spent
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                        ₹{acc.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold uppercase text-emerald-500 flex items-center gap-0.5">
                        <ArrowUpRight className="w-2.5 h-2.5" /> Reimbursed
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{acc.totalReimbursedReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Net Effective Balance */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Live Available Balance:</span>
                  <span className="text-lg font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹{acc.calculatedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
