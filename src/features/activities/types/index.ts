import type { Database } from "@/lib/supabase/types";

export type ActivityType = Database["public"]["Tables"]["activity_types"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

export type CategoryKey = "COMMUTE" | "WORK" | "BREAK" | "MEAL" | "SLEEP" | "SITE_VISIT" | "PERSONAL";

export interface CategoryGroup {
  category: CategoryKey;
  label: string;
  colorClass: string;
  badgeBg: string;
  activities: ActivityType[];
}
