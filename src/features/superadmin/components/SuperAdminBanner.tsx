"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAppStore } from "@/store/useAppStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ShieldAlert, Search, UserCheck, XCircle, ChevronDown, Lock } from "lucide-react";
import { toast } from "sonner";

interface SelectableUser {
  id: string;
  email?: string;
  label: string;
}

export function SuperAdminBanner() {
  const { user, role } = useAuth();
  const { impersonatedUserId, setImpersonatedUserId } = useAppStore();
  const [selectableUsers, setSelectableUsers] = useState<SelectableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (role !== "superadmin" || !user) return;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const supabase = getSupabaseBrowserClient();
        // Collect distinct user IDs across user_roles, activity_logs, and trips
        const [{ data: rolesData }, { data: logsData }, { data: tripsData }] = await Promise.all([
          supabase.from("user_roles").select("user_id, role").limit(100),
          supabase.from("activity_logs").select("user_id").limit(100),
          supabase.from("trips").select("user_id").limit(100),
        ]);

        const uniqueIds = new Set<string>();
        if (user.id) uniqueIds.add(user.id);
        rolesData?.forEach((r) => r.user_id && uniqueIds.add(r.user_id));
        logsData?.forEach((l) => l.user_id && uniqueIds.add(l.user_id));
        tripsData?.forEach((t) => t.user_id && uniqueIds.add(t.user_id));

        const userList: SelectableUser[] = Array.from(uniqueIds).map((id) => {
          const isSelf = id === user.id;
          return {
            id,
            label: isSelf ? `${id.slice(0, 8)}... (SuperAdmin - Self)` : `User ${id}`,
          };
        });

        setSelectableUsers(userList);
      } catch (err) {
        console.error("Failed to fetch user list for superadmin", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [role, user]);

  if (role !== "superadmin") return null;

  const filteredUsers = selectableUsers.filter(
    (u) =>
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (targetId: string | null) => {
    setImpersonatedUserId(targetId === user?.id ? null : targetId);
    setIsOpen(false);
    setSearchQuery("");
    if (targetId && targetId !== user?.id) {
      toast.info(`Impersonating User: ${targetId} (Read-Only Mode active)`);
    } else {
      toast.success("Returned to SuperAdmin Self View.");
    }
  };

  const isImpersonating = Boolean(impersonatedUserId && impersonatedUserId !== user?.id);

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border-b border-amber-500/30 dark:border-amber-500/20 px-4 py-2.5 transition-colors shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
          <span>SUPERADMIN CONSOLE:</span>
          {isImpersonating ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <Lock className="w-3 h-3" /> Read-Only Impersonation ({impersonatedUserId})
            </span>
          ) : (
            <span className="text-slate-700 dark:text-slate-300 font-medium">Viewing Self Workspace</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          {/* Selectable Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-400/50 dark:border-amber-500/30 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between shadow-sm hover:border-amber-500 transition-colors"
          >
            <span className="truncate">
              {isImpersonating ? `User: ${impersonatedUserId}` : "Switch Target User..."}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          {isImpersonating && (
            <button
              type="button"
              onClick={() => handleSelectUser(null)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wider shrink-0 shadow transition-all"
            >
              Exit
            </button>
          )}

          {/* Searchable Dropdown Modal/Menu */}
          {isOpen && (
            <div className="absolute right-0 top-10 w-full sm:w-80 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 space-y-3 animate-fade-in">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user ID or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 text-xs">
                {loadingUsers ? (
                  <div className="p-3 text-center text-slate-500 animate-pulse">Scanning users across DB...</div>
                ) : filteredUsers.length === 0 && searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => handleSelectUser(searchQuery.trim())}
                    className="w-full text-left p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold hover:bg-indigo-500/20 transition-colors"
                  >
                    + Impersonate raw ID: &quot;{searchQuery.trim()}&quot;
                  </button>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = impersonatedUserId === u.id || (!impersonatedUserId && u.id === user?.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u.id)}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 font-mono transition-colors ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate">{u.label}</span>
                        {isSelected && <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
