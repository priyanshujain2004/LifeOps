import type { ExpenseRow } from "./index";

export const DEFAULT_EXPENSES: ExpenseRow[] = [
  { id: "exp-1", user_id: "demo", trip_id: null, activity_log_id: null, category: "TRAVEL", amount: 450.00, description: "Uber cab from Office to Site Alpha", reimbursable: true, receipt_url: null, logged_at: new Date(Date.now() - 3600000 * 4).toISOString(), created_at: new Date().toISOString() },
  { id: "exp-2", user_id: "demo", trip_id: null, activity_log_id: null, category: "FOOD", amount: 320.00, description: "Team lunch near Site Alpha", reimbursable: true, receipt_url: null, logged_at: new Date(Date.now() - 3600000 * 3).toISOString(), created_at: new Date().toISOString() },
  { id: "exp-3", user_id: "demo", trip_id: null, activity_log_id: null, category: "FOOD", amount: 180.00, description: "Personal evening coffee & snacks", reimbursable: false, receipt_url: null, logged_at: new Date(Date.now() - 3600000 * 1).toISOString(), created_at: new Date().toISOString() },
  { id: "exp-4", user_id: "demo", trip_id: null, activity_log_id: null, category: "HOTEL", amount: 3400.00, description: "Overnight lodging near Site Beta (Check-in)", reimbursable: true, receipt_url: null, logged_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date().toISOString() },
];
