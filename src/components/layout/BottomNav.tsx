"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Navigation, DollarSign, BarChart2, Settings } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function BottomNav() {
  const pathname = usePathname();
  const { activeTrip, activePairedActivities } = useAppStore();

  const navItems = [
    { href: "/", label: "Home", icon: Home, badge: Object.keys(activePairedActivities).length > 0 ? Object.keys(activePairedActivities).length : null },
    { href: "/timeline", label: "Timeline", icon: Clock },
    { href: "/trips", label: "Trips", icon: Navigation, badge: activeTrip ? "Active" : null },
    { href: "/expenses", label: "Expenses", icon: DollarSign },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-900/95 backdrop-blur-lg dark:bg-slate-950/95 transition-all">
      <div className="max-w-4xl mx-auto px-2 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isActive
                  ? "text-indigo-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-bold text-[9px] shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
