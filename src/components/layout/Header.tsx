"use client";

import React, { useEffect, useState } from "react";
import { formatIST } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Wifi, WifiOff, RefreshCw, Activity } from "lucide-react";

export function Header() {
  const [currentIST, setCurrentIST] = useState<string>("");
  const { isOffline, setIsOffline, pendingQueueCount, isSyncing, triggerSync, updatePendingCount } = useAppStore();
  const { theme, toggleTheme } = useTheme();

  // Update clock every second in IST
  useEffect(() => {
    const updateTime = () => {
      setCurrentIST(formatIST(new Date(), "EEEE, dd MMM • hh:mm:ss a"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor network status & offline queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      triggerSync();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOffline, triggerSync, updatePendingCount]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:bg-slate-950/80 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & IST Live Clock */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-1.5">
              LifeLog
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              {currentIST || "Syncing IST Clock..."}
            </p>
          </div>
        </div>

        {/* Sync & Network Badge + Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Offline/Online status & queue counter */}
          {isOffline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
              {pendingQueueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full font-bold text-[10px]">
                  {pendingQueueCount}
                </span>
              )}
            </div>
          ) : isSyncing || pendingQueueCount > 0 ? (
            <button
              onClick={() => triggerSync()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-500/25 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : `${pendingQueueCount} Queued`}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium" title="Online & Synced to Supabase">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
