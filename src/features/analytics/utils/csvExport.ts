import Papa from "papaparse";
import type { ActivityLog, ActivityType } from "@/features/activities/types";
import type { TripRow } from "@/features/trips/types";
import type { ExpenseRow } from "@/features/expenses/types";
import { formatIST } from "@/lib/utils";

export function exportActivitiesToCSV(
  logs: ActivityLog[],
  activityTypes: ActivityType[],
  trips: TripRow[]
) {
  const formattedData = logs.map((log) => {
    const typeInfo = activityTypes.find((t) => t.id === log.activity_type_id);
    const tripInfo = trips.find((t) => t.id === log.trip_id);

    return {
      "Log ID": log.id,
      "Activity Name": typeInfo?.name || "Unknown Activity",
      Category: typeInfo?.category || "N/A",
      "Timestamp (IST)": formatIST(log.logged_at, "yyyy-MM-dd HH:mm:ss"),
      Notes: log.notes || "",
      "Linked Trip Origin": tripInfo?.origin_label || "",
      "Linked Trip Destination": tripInfo?.destination_label || "",
      "Trip Reimbursable": tripInfo ? (tripInfo.reimbursable ? "YES" : "NO") : "",
    };
  });

  const csv = Papa.unparse(formattedData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `lifelog_activities_${formatIST(new Date().toISOString(), "yyyyMMdd")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportExpensesToCSV(expenses: ExpenseRow[]) {
  const formattedData = expenses.map((exp) => ({
    "Expense ID": exp.id,
    Category: exp.category,
    "Amount (INR)": Number(exp.amount).toFixed(2),
    Description: exp.description || "",
    "Reimbursable?": exp.reimbursable ? "YES" : "NO",
    "Timestamp (IST)": formatIST(exp.logged_at, "yyyy-MM-dd HH:mm:ss"),
    "Linked Trip ID": exp.trip_id || "",
    "Receipt URL": exp.receipt_url || "",
  }));

  const csv = Papa.unparse(formattedData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `lifelog_expenses_${formatIST(new Date().toISOString(), "yyyyMMdd")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
