import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";

export const TIMEZONE_IST = "Asia/Kolkata";

/**
 * Merge Tailwind classes cleanly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format timestamp or Date specifically in IST (Asia/Kolkata)
 * Example formats:
 * - 'HH:mm' (e.g. 14:30)
 * - 'dd MMM yyyy, hh:mm a' (e.g. 11 Jul 2026, 02:30 PM)
 * - 'yyyy-MM-dd' (e.g. 2026-07-11)
 */
export function formatIST(dateInput: string | Date | number, formatStr: string = "dd MMM yyyy, hh:mm a"): string {
  try {
    const date = typeof dateInput === "string" || typeof dateInput === "number" ? toDate(dateInput) : dateInput;
    return formatInTimeZone(date, TIMEZONE_IST, formatStr);
  } catch (error) {
    console.error("Error formatting IST date:", error);
    return "Invalid Date";
  }
}

/**
 * Get current date string formatted as YYYY-MM-DD in IST
 */
export function getTodayIST(): string {
  return formatInTimeZone(new Date(), TIMEZONE_IST, "yyyy-MM-dd");
}

/**
 * Format elapsed duration between two timestamps in hours & minutes
 */
export function formatDuration(startInput: string | Date, endInput: string | Date = new Date()): string {
  try {
    const start = typeof startInput === "string" ? new Date(startInput) : startInput;
    const end = typeof endInput === "string" ? new Date(endInput) : endInput;
    const diffMinutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } catch {
    return "0m";
  }
}

/**
 * Get relative time (e.g., "5 mins ago")
 */
export function formatRelativeTime(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "recently";
  }
}
