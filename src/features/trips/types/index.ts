import type { Database } from "@/lib/supabase/types";
import type { TripType } from "../utils/reimbursability";

export type TripRow = Database["public"]["Tables"]["trips"]["Row"];
export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

export { TripType };

export const TRIP_TYPE_OPTIONS: { value: TripType; label: string; defaultReimbursable: boolean }[] = [
  { value: "OFFICE_TO_SITE", label: "Office ➔ Site", defaultReimbursable: true },
  { value: "SITE_TO_SITE", label: "Site ➔ Site", defaultReimbursable: true },
  { value: "SITE_TO_OFFICE", label: "Site ➔ Office", defaultReimbursable: true },
  { value: "HOME_TO_SITE", label: "Home ➔ Site (Personal Commute)", defaultReimbursable: false },
  { value: "SITE_TO_HOME", label: "Site ➔ Home", defaultReimbursable: false },
  { value: "HOME_TO_OFFICE", label: "Home ➔ Office", defaultReimbursable: false },
  { value: "OFFICE_TO_HOME", label: "Office ➔ Home", defaultReimbursable: false },
];
