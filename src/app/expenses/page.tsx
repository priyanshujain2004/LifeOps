"use client";

import React, { useState, Suspense } from "react";
import { useExpenses } from "@/features/expenses/hooks/useExpenses";
import { AddExpenseModal } from "@/features/expenses/components/AddExpenseModal";
import { ExpenseList } from "@/features/expenses/components/ExpenseList";
import { DollarSign, Plus, CheckCircle2, AlertCircle, PieChart } from "lucide-react";
import { useSearchParams } from "next/navigation";

function ExpensesContent() {
  const searchParams = useSearchParams();
  const defaultTripId = searchParams?.get("trip_id") || null;
  const defaultReimb = searchParams?.get("reimbursable") ? searchParams.get("reimbursable") === "true" : undefined;

  const { expenses, trips, loading, monthlySummary, addExpense, deleteExpense } = useExpenses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(!!defaultTripId);
  const [filter, setFilter] = useState<"ALL" | "REIMBURSABLE" | "PERSONAL">("ALL");

  const filteredExpenses = expenses.filter((e) => {
    if (filter === "REIMBURSABLE") return e.reimbursable === true;
    if (filter === "PERSONAL") return e.reimbursable === false;
    return true;
  });

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Monthly Summary Cards */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            <PieChart className="w-3.5 h-3.5" /> Current Month Summary
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono text-emerald-400">
            ₹{monthlySummary.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h1>
          <p className="text-xs text-slate-300">
            Total recorded spend across <span className="font-bold">{monthlySummary.count}</span> items this month
          </p>
        </div>

        {/* Reimbursable vs Personal Split */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="flex-1 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-900/80 border border-emerald-500/30 min-w-[150px]">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Reimbursable
            </span>
            <div className="text-lg font-mono font-bold text-white mt-1">
              ₹{monthlySummary.reimbursableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${monthlySummary.reimbursablePct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-300 dark:text-slate-400 block text-right mt-1 font-bold">
              {monthlySummary.reimbursablePct}% of total
            </span>
          </div>

          <div className="flex-1 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-900/80 border border-slate-700 min-w-[150px]">
            <span className="text-[10px] uppercase font-bold text-slate-300 dark:text-slate-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Personal / Non-Reimb
            </span>
            <div className="text-lg font-mono font-bold text-white mt-1">
              ₹{monthlySummary.nonReimbursableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-slate-400 dark:bg-slate-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${100 - monthlySummary.reimbursablePct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-300 dark:text-slate-400 block text-right mt-1 font-bold">
              {100 - monthlySummary.reimbursablePct}% of total
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5 self-stretch"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Expense Ledger</span>
            <span className="text-xs font-mono font-normal text-slate-400">({filteredExpenses.length} Showing)</span>
          </h2>

          <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 self-start sm:self-auto">
            {(["ALL", "REIMBURSABLE", "PERSONAL"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === tab
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab === "ALL" ? "All Entries" : tab === "REIMBURSABLE" ? "Reimbursable" : "Personal"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <ExpenseList expenses={filteredExpenses} onDeleteExpense={(id) => deleteExpense(id)} />
        )}
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        trips={trips}
        defaultTripId={defaultTripId}
        defaultReimbursable={defaultReimb}
        onAddExpense={addExpense}
      />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 py-8">
          <div className="h-32 rounded-3xl bg-slate-800/40 animate-pulse border border-slate-800" />
          <div className="h-64 rounded-3xl bg-slate-800/40 animate-pulse border border-slate-800" />
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}
