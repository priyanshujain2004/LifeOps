import type { Database } from "@/lib/supabase/types";

export type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
export type BankAccountInsert = Database["public"]["Tables"]["bank_accounts"]["Insert"];
export type BankAccountUpdate = Database["public"]["Tables"]["bank_accounts"]["Update"];

export type AccountType = 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD' | 'WALLET' | 'CASH';

export const ACCOUNT_TYPE_CONFIG: { [key in AccountType]: { label: string; icon: string; color: string } } = {
  SAVINGS: { label: "Savings Account", icon: "🏛️", color: "#10B981" },
  CURRENT: { label: "Current Account", icon: "💼", color: "#3B82F6" },
  CREDIT_CARD: { label: "Credit Card", icon: "💳", color: "#8B5CF6" },
  WALLET: { label: "Digital Wallet (PayTM/GPay)", icon: "📱", color: "#F59E0B" },
  CASH: { label: "Physical Cash / Petty Cash", icon: "💵", color: "#64748B" },
};
