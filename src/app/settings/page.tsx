"use client";

import React, { useState } from "react";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ActivityTypeManager } from "@/features/settings/components/ActivityTypeManager";
import { LocationManager } from "@/features/settings/components/LocationManager";
import { TripRulesManager } from "@/features/settings/components/TripRulesManager";
import { BackupRestoreCard } from "@/features/settings/components/BackupRestoreCard";
import { Sliders, Sparkles, MapPin, Database, DollarSign, User as UserIcon, LogOut, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVITIES" | "LOCATIONS" | "RULES" | "BACKUP" | "ACCOUNT">("ACTIVITIES");
  const { user, role, signOut } = useAuth();
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
            onClick={() => setActiveTab("RULES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === "RULES" ? "bg-emerald-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Trip Rules
          </button>
          <button
            onClick={() => setActiveTab("BACKUP")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === "BACKUP" ? "bg-emerald-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Backup
          </button>
          <button
            onClick={() => setActiveTab("ACCOUNT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === "ACCOUNT" ? "bg-purple-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" /> Account & Role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-800/40 animate-pulse border border-slate-300 dark:border-slate-800" />
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
      ) : activeTab === "RULES" ? (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <TripRulesManager />
        </div>
      ) : activeTab === "BACKUP" ? (
        <BackupRestoreCard
          onExport={exportBackupJSON}
          onImport={(file) => importBackupJSON(file)}
        />
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-500" /> Account Status & Session
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your authenticated session, inspect your assigned role, or securely log out.
              </p>
            </div>
            {user && (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out of LifeLog
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Authenticated Email</span>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 break-all">
                {user?.email || "Unknown / Not Signed In"}
              </div>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">ID: {user?.id}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Role</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                  role === "superadmin"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                }`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {role === "superadmin"
                  ? "You have full SuperAdmin access! The live Impersonation Bar is active at the very top of your screen."
                  : "You are logged in as a standard user. To activate the SuperAdmin Impersonation console, promote your account inside Supabase SQL Editor."}
              </p>
            </div>
          </div>

          {role !== "superadmin" && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-sm text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Want to trigger SuperAdmin Impersonation?
              </div>
              <p>
                Run this quick SQL command inside your <strong>Supabase Dashboard -&gt; SQL Editor</strong> to promote this account ({user?.email || "your email"}):
              </p>
              <pre className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] overflow-x-auto select-all">
{`UPDATE public.user_roles 
SET role = 'superadmin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = '${user?.email || 'your.email@example.com'}');`}
              </pre>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                After running the SQL command, refresh this page or switch tabs to see the orange <strong>SUPERADMIN CONSOLE</strong> bar appear right at the top!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
