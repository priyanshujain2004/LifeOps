"use client";

import React, { useState } from "react";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { ActivityTypeManager } from "@/features/settings/components/ActivityTypeManager";
import { LocationManager } from "@/features/settings/components/LocationManager";
import { BackupRestoreCard } from "@/features/settings/components/BackupRestoreCard";
import { Sliders, Sparkles, MapPin, Database } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVITIES" | "LOCATIONS" | "BACKUP">("ACTIVITIES");
  const {
    activityTypes,
    locations,
    loading,
    saveActivityType,
    deleteActivityType,
    moveActivitySort,
    saveLocation,
    deleteLocation,
    exportBackupJSON,
    importBackupJSON,
  } = useSettings();

  return (
    <div className="space-y-6 pb-8">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl text-slate-900 dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-300 dark:border-indigo-500/30">
            <Sliders className="w-3.5 h-3.5" /> App Configuration & Customization
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Flexible Configuration Studio</h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
            Nothing is hard-coded. Add, sort, and customize your activity buttons, start/end pairs, expense rules, and saved mobility locations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 w-full sm:w-auto overflow-x-auto shadow-sm">
          <button
            onClick={() => setActiveTab("ACTIVITIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === "ACTIVITIES" ? "bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Activities ({activityTypes.length})
          </button>
          <button
            onClick={() => setActiveTab("LOCATIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === "LOCATIONS" ? "bg-rose-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Locations ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab("BACKUP")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === "BACKUP" ? "bg-emerald-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Backup
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : activeTab === "ACTIVITIES" ? (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <ActivityTypeManager
            activityTypes={activityTypes}
            onSave={saveActivityType}
            onDelete={(id) => deleteActivityType(id)}
            onMoveSort={(id, dir) => moveActivitySort(id, dir)}
          />
        </div>
      ) : activeTab === "LOCATIONS" ? (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <LocationManager
            locations={locations}
            onSave={saveLocation}
            onDelete={(id) => deleteLocation(id)}
          />
        </div>
      ) : (
        <BackupRestoreCard
          onExport={exportBackupJSON}
          onImport={(file) => importBackupJSON(file)}
        />
      )}
    </div>
  );
}
