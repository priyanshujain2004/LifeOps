"use client";

import React, { useState } from "react";
import type { ExpenseRow } from "../types";
import { EXPENSE_CATEGORIES } from "../types";
import { formatIST } from "@/lib/utils";
import { DollarSign, CheckCircle2, Trash2, FileText, ExternalLink, X, Edit3 } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface ExpenseListProps {
  expenses: ExpenseRow[];
  onDeleteExpense: (id: string) => void;
  onEditExpense?: (
    id: string,
    category: any,
    amount: number,
    description: string,
    reimbursable: boolean,
    tripId?: string | null
  ) => void;
  trips?: any[];
}

export function ExpenseList({ expenses, onDeleteExpense, onEditExpense, trips = [] }: ExpenseListProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<any>("FOOD");
  const [editReimbursable, setEditReimbursable] = useState(false);
  const [editTripId, setEditTripId] = useState<string | null>(null);

  const startEdit = (e: ExpenseRow) => {
    setEditingExpense(e);
    setEditDesc(e.description || "");
    setEditAmount(String(e.amount));
    setEditCategory(e.category);
    setEditReimbursable(e.reimbursable);
    setEditTripId(e.trip_id || null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !onEditExpense) return;
    const numAmt = parseFloat(editAmount);
    if (isNaN(numAmt) || numAmt <= 0) return;
    onEditExpense(
      editingExpense.id,
      editCategory,
      numAmt,
      editDesc.trim() || "Expense Entry",
      editReimbursable,
      editTripId
    );
    setEditingExpense(null);
  };

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

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800">
              <div className="text-left sm:text-right">
                <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block leading-tight">
                  {amountFormatted}
                </span>
                {expense.trip_id && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Trip #{expense.trip_id.slice(-5)}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {expense.receipt_url && (
                  <button
                    onClick={() => setSelectedReceipt(expense.receipt_url!)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
                    title="View Receipt Photo"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}

                {onEditExpense && (
                  <button
                    onClick={() => startEdit(expense)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700"
                    title="Edit & Remap Expense"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors border border-slate-200 dark:border-slate-700"
                  title="Delete Expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <ModalPortal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)}>
          <div className="relative max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Edit & Remap Expense</span>
              </h4>
              <button onClick={() => setEditingExpense(null)} className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Description / Merchant
                </label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Link to Mobility Trip (Optional)
                </label>
                <select
                  value={editTripId || ""}
                  onChange={(e) => setEditTripId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Linked Trip --</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.origin_label} ➔ {trip.destination_label} ({trip.trip_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editReimb"
                  checked={editReimbursable}
                  onChange={(e) => setEditReimbursable(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editReimb" className="text-xs font-bold text-slate-900 dark:text-slate-200 cursor-pointer">
                  Mark as Reimbursable / Company Claim
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-transform active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Receipt Preview Dialog */}
      {selectedReceipt && (
        <ModalPortal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)}>
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Receipt Photo Verification
              </h4>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
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
        </ModalPortal>
      )}
    </div>
  );
}
