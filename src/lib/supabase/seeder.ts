import { getSupabaseBrowserClient } from "./client";
import { DEFAULT_ACTIVITY_TYPES } from "@/features/activities/types/seedDefaults";
import { DEFAULT_LOCATIONS } from "@/features/trips/types/seedLocations";

let isSeedingInProgress = false;

export async function ensureDatabaseSeeded(userId?: string) {
  if (!userId || userId === "demo" || isSeedingInProgress) return;

  // 1. Check local persistent flag: if we have checked or seeded this user before on this device, NEVER seed on refresh
  const storageKey = `lifelog_seeded_${userId}`;
  if (typeof window !== "undefined" && localStorage.getItem(storageKey) === "true") {
    return;
  }

  isSeedingInProgress = true;

  try {
    const supabase = getSupabaseBrowserClient();

    // 2. Check if this user already has a profile or role (meaning their account was created previously and DB trigger already ran)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .limit(1);

    const { data: existingTypes } = await supabase
      .from("activity_types")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    const { data: existingLocs } = await supabase
      .from("locations")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    const hasAccountOrData = 
      (existingProfile && existingProfile.length > 0) ||
      (existingTypes && existingTypes.length > 0) ||
      (existingLocs && existingLocs.length > 0);

    // If the user already exists or has any data, mark seeded in localStorage and NEVER re-insert defaults
    if (hasAccountOrData) {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
      }
      return;
    }

    // 4. Only if 100% empty across the database on very first check (e.g. brand new account before DB trigger completed), seed defaults ONCE
    console.log(`[Seeder] First-time login verified for "${userId}". Auto-seeding initial defaults...`);

    const typesToInsert = DEFAULT_ACTIVITY_TYPES.map((t) => ({
      user_id: userId,
      name: t.name,
      category: t.category,
      is_paired: t.is_paired,
      pair_label: t.pair_label,
      is_expense_trigger: t.is_expense_trigger,
      expense_reimbursable_rule: t.expense_reimbursable_rule,
      reimbursable_conditions: t.reimbursable_conditions,
      icon: t.icon,
      color: t.color,
      sort_order: t.sort_order,
      active: t.active,
    }));

    const locsToInsert = DEFAULT_LOCATIONS.map((l) => ({
      user_id: userId,
      name: l.name,
      type: l.type,
      address: l.address,
      active: l.active,
    }));

    const [{ error: typesErr }, { error: locsErr }] = await Promise.all([
      supabase.from("activity_types").insert(typesToInsert),
      supabase.from("locations").insert(locsToInsert),
    ]);

    if (typesErr || locsErr) {
      console.error("[Seeder] Error auto-seeding initial defaults:", { typesErr, locsErr });
    } else {
      console.log(`[Seeder] Successfully seeded initial defaults for new user "${userId}"!`);
    }

    // Mark permanently seeded across sessions so refresh or future logins NEVER recreate deleted defaults
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
  } catch (err) {
    console.error("[Seeder] Fatal error during first-time database verification:", err);
  } finally {
    isSeedingInProgress = false;
  }
}
