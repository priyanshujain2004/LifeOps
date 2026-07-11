import type { Database } from "@/lib/supabase/types";

export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseCategory = "FOOD" | "TRAVEL" | "HOTEL" | "MISC";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: "FOOD", label: "Food & Dining", icon: "🍽️", color: "#10B981" },
  { value: "TRAVEL", label: "Travel (Cab/Fuel/Toll)", icon: "🚗", color: "#6366F1" },
  { value: "HOTEL", label: "Hotel & Lodging", icon: "🏨", color: "#EF4444" },
  { value: "MISC", label: "Miscellaneous", icon: "🛒", color: "#F59E0B" },
];
