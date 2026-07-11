-- ==============================================================================
-- BANK ACCOUNTS, WALLETS & REIMBURSEMENT SETTLEMENT TRACKER
-- ==============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor to create the
-- bank_accounts table and add reimbursement settlement tracking to expenses.
-- ==============================================================================

-- 1. CREATE bank_accounts TABLE
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('SAVINGS', 'CURRENT', 'CREDIT_CARD', 'WALLET', 'CASH')),
  account_number TEXT,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES & RLS FOR bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_active ON public.bank_accounts(user_id, active);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can manage own bank accounts"
  ON public.bank_accounts FOR ALL
  USING (auth.uid() = user_id OR public.is_superadmin())
  WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3. ADD REIMBURSEMENT SETTLEMENT COLUMNS TO expenses TABLE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'bank_account_id') THEN
    ALTER TABLE public.expenses ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reimbursed_status') THEN
    ALTER TABLE public.expenses ADD COLUMN reimbursed_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE' CHECK (reimbursed_status IN ('PENDING', 'REIMBURSED', 'REJECTED', 'NOT_APPLICABLE'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reimbursed_amount') THEN
    ALTER TABLE public.expenses ADD COLUMN reimbursed_amount NUMERIC(10,2) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reimbursed_to_account_id') THEN
    ALTER TABLE public.expenses ADD COLUMN reimbursed_to_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reimbursed_at') THEN
    ALTER TABLE public.expenses ADD COLUMN reimbursed_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reimbursed_notes') THEN
    ALTER TABLE public.expenses ADD COLUMN reimbursed_notes TEXT DEFAULT NULL;
  END IF;
END;
$$;

-- 4. UPDATE EXISTING EXPENSES REIMBURSED STATUS IF APPLICABLE
UPDATE public.expenses
SET reimbursed_status = 'PENDING'
WHERE reimbursable = true AND (reimbursed_status IS NULL OR reimbursed_status = 'NOT_APPLICABLE');

UPDATE public.expenses
SET reimbursed_status = 'NOT_APPLICABLE'
WHERE reimbursable = false AND (reimbursed_status IS NULL OR reimbursed_status = 'PENDING');

-- 5. FUNCTION TO SEED A DEFAULT BANK ACCOUNT / CASH WALLET FOR USERS
CREATE OR REPLACE FUNCTION public.seed_user_bank_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.bank_accounts (user_id, account_name, account_type, initial_balance, is_default)
  VALUES (target_user_id, 'Primary Bank Account', 'SAVINGS', 0.00, true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- 6. RUN DEFAULT SEED ON EXISTING USERS IF THEY HAVE NO BANK ACCOUNTS YET
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE user_id = u.id) THEN
      PERFORM public.seed_user_bank_account(u.id);
    END IF;
  END LOOP;
END;
$$;
