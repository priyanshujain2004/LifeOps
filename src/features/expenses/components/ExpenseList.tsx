"use client";

import React, { useState } from "react";
import type { ExpenseRow } from "../types";
import { EXPENSE_CATEGORIES } from "../types";
import { formatIST } from "@/lib/utils";
import { DollarSign, CheckCircle2, Trash2, FileText, ExternalLink, X } from "lucide-react";

interface ExpenseListProps {
  expenses: ExpenseRow[];
  onDeleteExpense: (id: string) => void;
}

export function ExpenseList({ expenses, onDeleteExpense }: ExpenseListProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 shadow-sm">
        <DollarSign className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No Expenses Recorded Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add your travel, food, lodging, or miscellaneous expenses. Tying them to mobility trips automatically verifies reimbursable status.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
        const amountFormatted = `₹${Number(expense.amount).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

        return (
          <div
            key={expense.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold shadow-md"
                style={{
                  backgroundColor: `${catInfo?.color || "#10B981"}20`,
                  color: catInfo?.color || "#10B981",
                  border: `1px solid ${catInfo?.color || "#10B981"}40`,
                }}
              >
                {catInfo?.icon || "💵"}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-slate-900 dark:text-slate-100">{expense.description || "Expense Entry"}</span>
                  {expense.reimbursable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wide uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Reimbursable
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium uppercase">
                      Personal
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>{catInfo?.label || expense.category}</span>
                  <span>•</span>
                  <span>{formatIST(expense.logged_at, "dd MMM yyyy, hh:mm a")}</span>
                </div>
              </div>
            </div>

            {/* Amount and actions */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800">
              <div className="text-left sm:text-right">
                <span className="text-lg font-mono font-extrabold text-emerald-400 block leading-tight">
                  {amountFormatted}
                </span>
                {expense.trip_id && (
                  <span className="text-[10px] text-indigo-400 font-mono">Trip #{expense.trip_id.slice(-5)}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {expense.receipt_url && (
                  <button
                    onClick={() => setSelectedReceipt(expense.receipt_url!)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white transition-colors"
                    title="View Receipt Photo"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete Expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Receipt Preview Dialog */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedReceipt(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl bg-slate-900 p-4 border border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" /> Receipt Photo Verification
              </h4>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-slate-950 rounded-xl p-2 border border-slate-800">
              <img src={selectedReceipt} alt="Full Receipt" className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
            <div className="mt-3 text-right">
              <a
                href={selectedReceipt}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <span>Open Original in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
