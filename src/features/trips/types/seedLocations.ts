import type { LocationRow } from "./index";

export const DEFAULT_LOCATIONS: LocationRow[] = [
  { id: "loc-1", user_id: "demo", name: "Home", type: "HOME", address: "Residential Address", active: true, created_at: new Date().toISOString() },
  { id: "loc-2", user_id: "demo", name: "Main Office", type: "OFFICE", address: "Corporate Headquarters", active: true, created_at: new Date().toISOString() },
  { id: "loc-3", user_id: "demo", name: "Project Site Alpha", type: "SITE", address: "Industrial Plant Alpha", active: true, created_at: new Date().toISOString() },
  { id: "loc-4", user_id: "demo", name: "Client Site Beta", type: "SITE", address: "Tech Park Sector 42", active: true, created_at: new Date().toISOString() },
];
