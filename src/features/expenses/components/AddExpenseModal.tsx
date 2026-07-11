"use client";

import React, { useState, useEffect } from "react";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "../types";
import type { TripRow } from "@/features/trips/types";
import { useAppStore } from "@/store/useAppStore";
import { DollarSign, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripRow[];
  defaultTripId?: string | null;
  defaultReimbursable?: boolean;
  onAddExpense: (
    category: ExpenseCategory,
    amount: number,
    description: string,
    reimbursable: boolean,
    tripId?: string | null,
    activityLogId?: string | null,
    receiptFile?: File | null
  ) => void;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  trips,
  defaultTripId,
  defaultReimbursable,
  onAddExpense,
}: AddExpenseModalProps) {
  const { activeTrip } = useAppStore();
  const [category, setCategory] = useState<ExpenseCategory>("TRAVEL");
  const [amountStr, setAmountStr] = useState<string>("");
  const [description, setDescription] = useState("");
  const [reimbursable, setReimbursable] = useState(defaultReimbursable ?? false);
  const [selectedTripId, setSelectedTripId] = useState<string>(defaultTripId || "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (defaultReimbursable !== undefined) {
      setReimbursable(defaultReimbursable);
    } else if (activeTrip) {
      setReimbursable(activeTrip.reimbursable);
      setSelectedTripId(activeTrip.id);
    }
  }, [defaultReimbursable, activeTrip]);

  if (!isOpen) return null;

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (!tripId) return;
    const found = trips.find((t) => t.id === tripId);
    if (found) {
      setReimbursable(found.reimbursable);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddExpense(
      category,
      parsedAmount,
      description.trim(),
      reimbursable,
      selectedTripId || null,
      null,
      receiptFile
    );
    setAmountStr("");
    setDescription("");
    setReceiptFile(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Log Expense Entry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tie expense to trip session or standalone activity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (INR ₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-8 pr-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">Description / Vendor</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Uber cab from Office to Plant Alpha"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Link to Trip Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Link to Trip Session (Optional)</label>
            <select
              value={selectedTripId}
              onChange={(e) => handleTripChange(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Standalone Expense / Not Linked --</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.trip_type.replace(/_/g, " ")}] {t.origin_label} ➔ {t.destination_label} ({t.reimbursable ? "REIMBURSABLE" : "Personal"})
                </option>
              ))}
            </select>
          </div>

          {/* Reimbursable Toggle Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${reimbursable ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                {reimbursable ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Reimbursable from Company?</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {reimbursable ? "Eligible for expense allowance claim" : "Personal / non-reimbursable expense"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reimbursable}
                onChange={(e) => setReimbursable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Receipt Photo Upload Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Attach Receipt Photo (Optional)</span>
              <span className="text-[10px] text-slate-500 font-normal">Stored in Supabase Storage (`receipts`)</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 text-center transition-colors cursor-pointer bg-slate-50 dark:bg-slate-950/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {previewUrl ? (
                <div className="flex items-center gap-3">
                  <img src={previewUrl} alt="Receipt Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[220px]">{receiptFile?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Tap or drag new image to replace</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 py-2 text-slate-500 dark:text-slate-400">
                  <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Upload Receipt Photo</p>
                  <p className="text-[10px] text-slate-500">Supported formats: JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
