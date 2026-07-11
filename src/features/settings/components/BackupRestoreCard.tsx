"use client";

import React, { useRef } from "react";
import { Download, Upload, ShieldCheck, Database } from "lucide-react";

interface BackupRestoreCardProps {
  onExport: () => void;
  onImport: (file: File) => void;
}

export function BackupRestoreCard({ onExport, onImport }: BackupRestoreCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Configuration Backup & Restore</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Export your custom activity buttons, categories, rules, and locations to JSON</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export Configuration JSON
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Save a local JSON backup file containing all your activity buttons, custom categories, expense rules, and saved locations.
            </p>
          </div>
          <button
            onClick={onExport}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup File (.json)</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Restore from JSON Backup
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a previously exported `.json` file from your device to instantly overwrite/restore your configuration.
            </p>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Select Backup File to Restore</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>All data remains 100% private in your single-user cloud / local instance.</span>
      </div>
    </div>
  );
}
