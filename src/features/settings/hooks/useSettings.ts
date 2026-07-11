"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureDatabaseSeeded } from "@/lib/supabase/seeder";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { ActivityType } from "@/features/activities/types";
import { DEFAULT_ACTIVITY_TYPES } from "@/features/activities/types/seedDefaults";
import type { LocationRow } from "@/features/trips/types";
import { DEFAULT_LOCATIONS } from "@/features/trips/types/seedLocations";
import { toast } from "sonner";
import { appMemoryCache } from "@/lib/cache";
import { useAppStore } from "@/store/useAppStore";

export function useSettings() {
  const { user } = useAuth();
  const { impersonatedUserId } = useAppStore();
  const targetUserId = impersonatedUserId || user?.id;
  const isReadOnly = Boolean(impersonatedUserId && impersonatedUserId !== user?.id);

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
    appMemoryCache.activityTypes || DEFAULT_ACTIVITY_TYPES
  );
  const [locations, setLocations] = useState<LocationRow[]>(
    appMemoryCache.locations || DEFAULT_LOCATIONS
  );
  const [loading, setLoading] = useState(!appMemoryCache.hasLoadedSettings);

  const fetchConfig = useCallback(async () => {
    if (!targetUserId) return;
    if (!appMemoryCache.hasLoadedSettings) {
      setLoading(true);
    }
    try {
      await ensureDatabaseSeeded(targetUserId);
      const supabase = getSupabaseBrowserClient();

      // Fetch activity types
      const { data: typesData, error: typesErr } = await supabase
        .from("activity_types")
        .select("*")
        .eq("user_id", targetUserId)
        .order("sort_order", { ascending: true });

      const resolvedTypes = (!typesErr && typesData) ? typesData : (appMemoryCache.activityTypes || []);
      setActivityTypes(resolvedTypes);
      appMemoryCache.activityTypes = resolvedTypes;

      // Fetch locations
      const { data: locsData, error: locsErr } = await supabase
        .from("locations")
        .select("*")
        .eq("user_id", targetUserId)
        .order("name", { ascending: true });

      const resolvedLocs = (!locsErr && locsData) ? locsData : (appMemoryCache.locations || []);
      setLocations(resolvedLocs);
      appMemoryCache.locations = resolvedLocs;
      appMemoryCache.hasLoadedSettings = true;
    } catch (err) {
      console.error("Error fetching configuration:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Activity Types CRUD
  const saveActivityType = async (type: Partial<ActivityType> & { name: string; category: any }) => {
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot modify settings.");
      return;
    }
    if (!user?.id) return;
    const isNew = !type.id || type.id.startsWith("new-");
    const tempId = isNew ? `custom-${Date.now()}` : type.id!;
    const nowIso = new Date().toISOString();

    const record: ActivityType = {
      id: tempId,
      user_id: user.id,
      name: type.name,
      category: type.category,
      is_paired: type.is_paired ?? false,
      pair_label: type.pair_label || null,
      is_expense_trigger: type.is_expense_trigger ?? false,
      expense_reimbursable_rule: type.expense_reimbursable_rule || "NEVER",
      reimbursable_conditions: type.reimbursable_conditions || {},
      icon: type.icon || "⚡",
      color: type.color || "#6366F1",
      sort_order: type.sort_order ?? activityTypes.length + 1,
      active: type.active ?? true,
      created_at: type.created_at || nowIso,
    };

    if (isNew) {
      setActivityTypes((prev) => {
        const next = [...prev, record];
        appMemoryCache.activityTypes = next;
        return next;
      });
      toast.success(`Created Activity: ${record.name}`);
    } else {
      setActivityTypes((prev) => {
        const next = prev.map((t) => (t.id === record.id ? record : t));
        appMemoryCache.activityTypes = next;
        return next;
      });
      toast.success(`Updated Activity: ${record.name}`);
    }

    try {
      const supabase = getSupabaseBrowserClient();
      if (isNew) {
        const { data } = await supabase
          .from("activity_types")
          .insert({
            user_id: user.id,
            name: record.name,
            category: record.category,
            is_paired: record.is_paired,
            pair_label: record.pair_label,
            is_expense_trigger: record.is_expense_trigger,
            expense_reimbursable_rule: record.expense_reimbursable_rule,
            reimbursable_conditions: record.reimbursable_conditions,
            icon: record.icon,
            color: record.color,
            sort_order: record.sort_order,
            active: record.active,
          })
          .select()
          .single();

        if (data) {
          setActivityTypes((prev) => {
            const next = prev.map((t) => (t.id === tempId ? data : t));
            appMemoryCache.activityTypes = next;
            return next;
          });
        }
      } else {
        await supabase
          .from("activity_types")
          .update({
            name: record.name,
            category: record.category,
            is_paired: record.is_paired,
            pair_label: record.pair_label,
            is_expense_trigger: record.is_expense_trigger,
            expense_reimbursable_rule: record.expense_reimbursable_rule,
            reimbursable_conditions: record.reimbursable_conditions,
            icon: record.icon,
            color: record.color,
            sort_order: record.sort_order,
            active: record.active,
          })
          .eq("id", record.id);
      }
    } catch (err) {
      console.error("Error saving activity type:", err);
    }
  };

  const deleteActivityType = async (id: string) => {
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot modify settings.");
      return;
    }
    setActivityTypes((prev) => {
      const next = prev.filter((t) => t.id !== id);
      appMemoryCache.activityTypes = next;
      return next;
    });
    toast.success("Activity button deleted");
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("activity_types").delete().eq("id", id);
    } catch (err) {
      console.error("Error deleting activity type:", err);
    }
  };

  const moveActivitySort = async (id: string, direction: "UP" | "DOWN") => {
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot modify settings.");
      return;
    }
    const idx = activityTypes.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= activityTypes.length) return;

    const newArr = [...activityTypes];
    const temp = newArr[idx];
    newArr[idx] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    // Update sort_order numbers
    const updatedArr = newArr.map((t, i) => ({ ...t, sort_order: i + 1 }));
    setActivityTypes(updatedArr);
    appMemoryCache.activityTypes = updatedArr;

    try {
      const supabase = getSupabaseBrowserClient();
      await Promise.all(
        updatedArr.map((t) =>
          supabase.from("activity_types").update({ sort_order: t.sort_order }).eq("id", t.id)
        )
      );
    } catch (err) {
      console.error("Error reordering:", err);
    }
  };

  // Locations CRUD
  const saveLocation = async (loc: Partial<LocationRow> & { name: string; type: any }) => {
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot modify settings.");
      return;
    }
    if (!user?.id) return;
    const isNew = !loc.id || loc.id.startsWith("new-");
    const tempId = isNew ? `loc-${Date.now()}` : loc.id!;
    const nowIso = new Date().toISOString();

    const record: LocationRow = {
      id: tempId,
      user_id: user.id,
      name: loc.name,
      type: loc.type,
      address: loc.address || null,
      active: loc.active ?? true,
      created_at: loc.created_at || nowIso,
    };

    if (isNew) {
      setLocations((prev) => {
        const next = [...prev, record];
        appMemoryCache.locations = next;
        return next;
      });
      toast.success(`Created Location: ${record.name}`);
    } else {
      setLocations((prev) => {
        const next = prev.map((l) => (l.id === record.id ? record : l));
        appMemoryCache.locations = next;
        return next;
      });
      toast.success(`Updated Location: ${record.name}`);
    }

    try {
      const supabase = getSupabaseBrowserClient();
      if (isNew) {
        const { data } = await supabase
          .from("locations")
          .insert({ user_id: user.id, name: record.name, type: record.type, address: record.address, active: record.active })
          .select()
          .single();
        if (data) {
          setLocations((prev) => {
            const next = prev.map((l) => (l.id === tempId ? data : l));
            appMemoryCache.locations = next;
            return next;
          });
        }
      } else {
        await supabase
          .from("locations")
          .update({ name: record.name, type: record.type, address: record.address, active: record.active })
          .eq("id", record.id);
      }
    } catch (err) {
      console.error("Error saving location:", err);
    }
  };

  const deleteLocation = async (id: string) => {
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot modify settings.");
      return;
    }
    setLocations((prev) => {
      const next = prev.filter((l) => l.id !== id);
      appMemoryCache.locations = next;
      return next;
    });
    toast.success("Location deleted");
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("locations").delete().eq("id", id);
    } catch (err) {
      console.error("Error deleting location:", err);
    }
  };

  // Backup & Restore
  const exportBackupJSON = () => {
    const backup = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      activityTypes,
      locations,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lifelog_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Settings exported to JSON backup");
  };

  const importBackupJSON = async (file: File) => {
    if (isReadOnly) {
      toast.error("SuperAdmin Impersonation is Read-Only. Cannot modify settings.");
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.activityTypes && Array.isArray(parsed.activityTypes)) {
        setActivityTypes(parsed.activityTypes);
      }
      if (parsed.locations && Array.isArray(parsed.locations)) {
        setLocations(parsed.locations);
      }
      toast.success("Configuration restored successfully from backup file!");
    } catch (err) {
      toast.error("Invalid backup JSON file");
      console.error(err);
    }
  };

  return {
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
    refresh: fetchConfig,
  };
}
