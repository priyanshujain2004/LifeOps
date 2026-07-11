"use client";

import React, { useState } from "react";
import type { ActivityType, CategoryKey } from "@/features/activities/types";
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown, Check, X, Sparkles, Zap, DollarSign } from "lucide-react";

interface ActivityTypeManagerProps {
  activityTypes: ActivityType[];
  onSave: (type: Partial<ActivityType> & { name: string; category: any }) => void;
  onDelete: (id: string) => void;
  onMoveSort: (id: string, direction: "UP" | "DOWN") => void;
}

const CATEGORIES: CategoryKey[] = ["COMMUTE", "WORK", "BREAK", "MEAL", "SLEEP", "SITE_VISIT", "PERSONAL"];

export function ActivityTypeManager({ activityTypes, onSave, onDelete, onMoveSort }: ActivityTypeManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryKey>("WORK");
  const [icon, setIcon] = useState("⚡");
  const [color, setColor] = useState("#6366F1");
  const [isPaired, setIsPaired] = useState(false);
  const [pairLabel, setPairLabel] = useState("");
  const [isExpenseTrigger, setIsExpenseTrigger] = useState(false);
  const [expenseRule, setExpenseRule] = useState<"ALWAYS" | "NEVER" | "CONDITIONAL">("NEVER");

  const startNew = () => {
    setEditingId("NEW");
    setName("");
    setCategory("WORK");
    setIcon("⚡");
    setColor("#6366F1");
    setIsPaired(false);
    setPairLabel("");
    setIsExpenseTrigger(false);
    setExpenseRule("NEVER");
  };

  const startEdit = (t: ActivityType) => {
    setEditingId(t.id);
    setName(t.name);
    setCategory((t.category as CategoryKey) || "WORK");
    setIcon(t.icon || "⚡");
    setColor(t.color || "#6366F1");
    setIsPaired(t.is_paired || false);
    setPairLabel(t.pair_label || "");
    setIsExpenseTrigger(t.is_expense_trigger || false);
    setExpenseRule((t.expense_reimbursable_rule as any) || "NEVER");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingId === "NEW" ? undefined : editingId!,
      name: name.trim(),
      category,
      icon: icon.trim() || "⚡",
      color,
      is_paired: isPaired,
      pair_label: isPaired ? pairLabel.trim() || `${name} Ended` : null,
      is_expense_trigger: isExpenseTrigger,
      expense_reimbursable_rule: isExpenseTrigger ? expenseRule : "NEVER",
      active: true,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Activity Buttons Catalog ({activityTypes.length} Total)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure 1-tap logging buttons, category groupings, and start/end pairs</p>
        </div>
        {editingId !== "NEW" && (
          <button
            onClick={startNew}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity Button</span>
          </button>
        )}
      </div>

      {/* Editor Form */}
      {editingId && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-indigo-500/60 space-y-4 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-300">
              {editingId === "NEW" ? "Create New Activity Button" : `Edit Activity: ${name}`}
            </h4>
            <button type="button" onClick={() => setEditingId(null)} className="p-1 rounded text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Button Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Client Call Start"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category Group</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  maxLength={4}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-2 py-2 text-center text-base text-slate-100"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer p-1"
                />
              </div>
            </div>
          </div>

          {/* Paired Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Paired Start/End Activity?
                </span>
                <input
                  type="checkbox"
                  checked={isPaired}
                  onChange={(e) => setIsPaired(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 w-4 h-4 text-indigo-600"
                />
              </div>
              {isPaired && (
                <input
                  type="text"
                  value={pairLabel}
                  onChange={(e) => setPairLabel(e.target.value)}
                  placeholder="e.g. Client Call Ended"
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
                />
              )}
            </div>

            {/* Expense Trigger Toggle */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Trigger Expense Log?
                </span>
                <input
                  type="checkbox"
                  checked={isExpenseTrigger}
                  onChange={(e) => setIsExpenseTrigger(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 w-4 h-4 text-emerald-600"
                />
              </div>
              {isExpenseTrigger && (
                <select
                  value={expenseRule}
                  onChange={(e) => setExpenseRule(e.target.value as any)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-slate-100 font-mono"
                >
                  <option value="NEVER">Rule: NEVER</option>
                  <option value="CONDITIONAL">Rule: CONDITIONAL (Trip linked)</option>
                  <option value="ALWAYS">Rule: ALWAYS Reimbursable</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Check className="w-3.5 h-3.5" /> Save Activity
            </button>
          </div>
        </form>
      )}

      {/* List / Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {activityTypes.map((act, idx) => (
          <div
            key={act.id}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="text-xl shrink-0">{act.icon || "⚡"}</span>
              <div className="truncate">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{act.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase"
                    style={{ backgroundColor: `${act.color || "#6366F1"}20`, color: act.color || "#6366F1" }}
                  >
                    {act.category}
                  </span>
                  {act.is_paired && (
                    <span className="text-[9px] font-mono text-amber-400">➔ {act.pair_label}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col gap-0.5 mr-1">
                <button
                  onClick={() => onMoveSort(act.id, "UP")}
                  disabled={idx === 0}
                  className="p-0.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onMoveSort(act.id, "DOWN")}
                  disabled={idx === activityTypes.length - 1}
                  className="p-0.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => startEdit(act)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(act.id)}
                className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
