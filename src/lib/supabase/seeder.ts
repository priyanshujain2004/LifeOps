import { getSupabaseBrowserClient } from "./client";
import { DEFAULT_ACTIVITY_TYPES } from "@/features/activities/types/seedDefaults";
import { DEFAULT_LOCATIONS } from "@/features/trips/types/seedLocations";

let isSeedingInProgress = false;
let hasCheckedAndSeeded = false;

export async function ensureDatabaseSeeded(userId?: string) {
  if (!userId || userId === "demo" || hasCheckedAndSeeded || isSeedingInProgress) return;
  isSeedingInProgress = true;

  try {
    const supabase = getSupabaseBrowserClient();

    // 1. Check if activity_types exist for this user in DB
    const { data: existingTypes, error: typesCheckErr } = await supabase
      .from("activity_types")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!typesCheckErr && (!existingTypes || existingTypes.length === 0)) {
      console.log(`[Seeder] No activity_types in DB for user "${userId}". Auto-seeding 30+ default activity buttons directly into Supabase table...`);

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

      const { error: insertTypesErr } = await supabase.from("activity_types").insert(typesToInsert);
      if (insertTypesErr) {
        console.error("[Seeder] Error auto-seeding activity_types to Supabase table:", insertTypesErr);
      } else {
        console.log(`[Seeder] Successfully seeded ${typesToInsert.length} rows into database table activity_types!`);
      }
    }

    // 2. Check if locations exist for this user in DB
    const { data: existingLocs, error: locsCheckErr } = await supabase
      .from("locations")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!locsCheckErr && (!existingLocs || existingLocs.length === 0)) {
      console.log(`[Seeder] No locations in DB for user "${userId}". Auto-seeding default locations directly into Supabase table...`);

      const locsToInsert = DEFAULT_LOCATIONS.map((l) => ({
        user_id: userId,
        name: l.name,
        type: l.type,
        address: l.address,
        active: l.active,
      }));

      const { error: insertLocsErr } = await supabase.from("locations").insert(locsToInsert);
      if (insertLocsErr) {
        console.error("[Seeder] Error auto-seeding locations to Supabase table:", insertLocsErr);
      } else {
        console.log(`[Seeder] Successfully seeded ${locsToInsert.length} rows into database table locations!`);
      }
    }

    hasCheckedAndSeeded = true;
  } catch (err) {
    console.error("[Seeder] Fatal error during database verification and auto-seeding:", err);
  } finally {
    isSeedingInProgress = false;
  }
}
