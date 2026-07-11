"use client";

import React, { useState, useEffect } from "react";
import {
  getConfiguredReimbursableRules,
  saveConfiguredReimbursableRules,
  DEFAULT_REIMBURSABLE_RULES,
  TripReimbursabilityRulesMap,
} from "@/features/trips/utils/reimbursability";
import { TRIP_TYPE_OPTIONS } from "@/features/trips/types";
import { CheckCircle2, XCircle, RotateCcw, ShieldCheck, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function TripRulesManager() {
  const [rules, setRules] = useState<TripReimbursabilityRulesMap>(() => getConfiguredReimbursableRules());

  const handleToggle = (value: string) => {
    const nextValue = !(rules[value] ?? DEFAULT_REIMBURSABLE_RULES[value] ?? false);
    const updated = { ...rules, [value]: nextValue };
    setRules(updated);
    saveConfiguredReimbursableRules(updated);
    toast.success(`Updated rule for ${value}: ${nextValue ? "Reimbursable" : "Personal / Non-Reimbursable"}`);
  };

  const handleReset = () => {
    setRules({ ...DEFAULT_REIMBURSABLE_RULES });
    saveConfiguredReimbursableRules({ ...DEFAULT_REIMBURSABLE_RULES });
    toast.success("Reimbursability rules reset to default configurations.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Configurable Mobility & Commute Reimbursability Rules
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Toggle which mobility trip types automatically qualify for expense reimbursement when starting a new trip.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRIP_TYPE_OPTIONS.map((opt) => {
          const isEnabled = rules[opt.value] ?? DEFAULT_REIMBURSABLE_RULES[opt.value] ?? false;
          return (
            <div
              key={opt.value}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isEnabled
                  ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{opt.label}</h4>
                  <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    Code: {opt.value}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                      isEnabled
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isEnabled ? "Reimbursable by Default" : "Personal / Non-Reimbursable"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(opt.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  isEnabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {isEnabled ? "Turn OFF" : "Turn ON"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Dynamic & Interactive Override Active</span>
          When starting a specific trip inside the Trips tab, you can also override these configured rules on the fly if an individual commute requires an exception.
        </div>
      </div>
    </div>
  );
}
