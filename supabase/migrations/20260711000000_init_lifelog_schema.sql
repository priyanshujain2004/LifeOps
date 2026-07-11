-- LifeLog Database Schema & RLS Migrations
-- Target: Supabase PostgreSQL (Free Tier)

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. TABLES
-- =========================================================

-- Locations table (Origin / Destination autocomplete for Trips)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('HOME', 'OFFICE', 'SITE')),
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity types catalog (User configurable)
CREATE TABLE IF NOT EXISTS public.activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('COMMUTE', 'WORK', 'BREAK', 'MEAL', 'SLEEP', 'SITE_VISIT', 'PERSONAL')),
  is_paired BOOLEAN NOT NULL DEFAULT false,
  pair_label TEXT,
  is_expense_trigger BOOLEAN NOT NULL DEFAULT false,
  expense_reimbursable_rule TEXT NOT NULL DEFAULT 'NEVER' CHECK (expense_reimbursable_rule IN ('NEVER', 'ALWAYS', 'CONDITIONAL')),
  reimbursable_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trips table (Mobility sessions)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('HOME_TO_OFFICE', 'HOME_TO_SITE', 'OFFICE_TO_SITE', 'SITE_TO_SITE', 'SITE_TO_OFFICE', 'SITE_TO_HOME', 'OFFICE_TO_HOME')),
  origin_label TEXT NOT NULL,
  destination_label TEXT NOT NULL,
  origin_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  destination_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  departed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  arrived_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  reimbursable BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs table (Time is server stamped or explicit timestamped)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type_id UUID REFERENCES public.activity_types(id) ON DELETE CASCADE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table (Tied to trips or activity logs or standalone)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  activity_log_id UUID REFERENCES public.activity_logs(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('FOOD', 'TRAVEL', 'HOTEL', 'MISC')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  reimbursable BOOLEAN NOT NULL DEFAULT false,
  receipt_url TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 2. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_locations_user_active ON public.locations(user_id, active);
CREATE INDEX IF NOT EXISTS idx_activity_types_user_sort ON public.activity_types(user_id, sort_order, active);
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON public.trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_departed_at ON public.trips(user_id, departed_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON public.activity_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_trip ON public.activity_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_time ON public.expenses(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);

-- =========================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Locations RLS
CREATE POLICY "Users can manage their own locations"
  ON public.locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Activity Types RLS
CREATE POLICY "Users can manage their own activity types"
  ON public.activity_types FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trips RLS
CREATE POLICY "Users can manage their own trips"
  ON public.trips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Activity Logs RLS
CREATE POLICY "Users can manage their own activity logs"
  ON public.activity_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expenses RLS
CREATE POLICY "Users can manage their own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 4. STORAGE BUCKET FOR RECEIPTS
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid() = owner);

-- =========================================================
-- 5. SEED DATA GENERATION FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION public.seed_user_defaults(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Seed default locations
  INSERT INTO public.locations (user_id, name, type, address) VALUES
    (target_user_id, 'Home', 'HOME', 'Residential Address'),
    (target_user_id, 'Main Office', 'OFFICE', 'Corporate Headquarters'),
    (target_user_id, 'Project Site Alpha', 'SITE', 'Industrial Plant Alpha')
  ON CONFLICT DO NOTHING;

  -- 2. Seed exactly the 20 required activity types + 10 pair end activities
  INSERT INTO public.activity_types (
    user_id, name, category, is_paired, pair_label, is_expense_trigger, expense_reimbursable_rule, reimbursable_conditions, icon, color, sort_order
  ) VALUES
    -- #1 Left Home
    (target_user_id, 'Left Home', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏠', '#64748B', 1),
    -- #2 Reached Office
    (target_user_id, 'Reached Office', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏢', '#64748B', 2),
    -- #3 Left Office
    (target_user_id, 'Left Office', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🚗', '#64748B', 3),
    -- #4 Reached Home
    (target_user_id, 'Reached Home', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏠', '#64748B', 4),
    -- #5 Left for Site -> reimbursable ONLY if active trip is OFFICE_TO_SITE or SITE_TO_SITE
    (target_user_id, 'Left for Site', 'COMMUTE', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["OFFICE_TO_SITE", "SITE_TO_SITE"]}'::jsonb, '🚧', '#F59E0B', 5),
    -- #6 Reached Site
    (target_user_id, 'Reached Site', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🚧', '#F59E0B', 6),
    -- #7 Left Site -> reimbursable ONLY if active trip is SITE_TO_OFFICE or SITE_TO_SITE
    (target_user_id, 'Left Site', 'COMMUTE', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_OFFICE", "SITE_TO_SITE"]}'::jsonb, '🚧', '#F59E0B', 7),
    -- #8 Work Started -> paired with Work Ended
    (target_user_id, 'Work Started', 'WORK', true, 'Work Ended', false, 'NEVER', '{}'::jsonb, '💼', '#6366F1', 8),
    -- #9 Tea Break Start -> paired with Tea Break End
    (target_user_id, 'Tea Break Start', 'BREAK', true, 'Tea Break End', false, 'NEVER', '{}'::jsonb, '☕', '#92400E', 9),
    -- #10 Lunch Start -> reimbursable ONLY if active trip exists and trip.reimbursable = true
    (target_user_id, 'Lunch Start', 'MEAL', true, 'Lunch End', true, 'CONDITIONAL', '{"rule_type": "ACTIVE_TRIP_REIMBURSABLE"}'::jsonb, '🍽️', '#10B981', 10),
    -- #11 Dinner Start -> reimbursable ONLY if active trip exists and trip.reimbursable = true
    (target_user_id, 'Dinner Start', 'MEAL', true, 'Dinner End', true, 'CONDITIONAL', '{"rule_type": "ACTIVE_TRIP_REIMBURSABLE"}'::jsonb, '🍽️', '#10B981', 11),
    -- #12 Went to Sleep -> paired with Woke Up
    (target_user_id, 'Went to Sleep', 'SLEEP', true, 'Woke Up', false, 'NEVER', '{}'::jsonb, '🌙', '#8B5CF6', 12),
    -- #13 Reached Site (From Home) -> reimbursable ONLY if active trip is HOME_TO_SITE or OFFICE_TO_SITE
    (target_user_id, 'Reached Site (From Home)', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["HOME_TO_SITE", "OFFICE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 13),
    -- #14 Hotel Check-In -> paired with Hotel Check-Out
    (target_user_id, 'Hotel Check-In', 'SITE_VISIT', true, 'Hotel Check-Out', true, 'ALWAYS', '{}'::jsonb, '🏗️', '#EF4444', 14),
    -- #15 Site Work Started -> paired with Site Work Ended
    (target_user_id, 'Site Work Started', 'SITE_VISIT', true, 'Site Work Ended', false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 15),
    -- #16 Left Site for Office -> reimbursable ONLY if active trip is SITE_TO_OFFICE or SITE_TO_SITE
    (target_user_id, 'Left Site for Office', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_OFFICE", "SITE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 16),
    -- #17 Left Site for Home
    (target_user_id, 'Left Site for Home', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 17),
    -- #18 Gym Start -> paired with Gym End
    (target_user_id, 'Gym Start', 'PERSONAL', true, 'Gym End', false, 'NEVER', '{}'::jsonb, '💪', '#06B6D4', 18),
    -- #19 Prayer/Namaz Start -> paired with Prayer/Namaz End
    (target_user_id, 'Prayer/Namaz Start', 'PERSONAL', true, 'Prayer/Namaz End', false, 'NEVER', '{}'::jsonb, '🕌', '#D97706', 19),
    -- #20 Personal Errand Start -> paired with Personal Errand End
    (target_user_id, 'Personal Errand Start', 'PERSONAL', true, 'Personal Errand End', false, 'NEVER', '{}'::jsonb, '🛒', '#6B7280', 20),

    -- END PAIRS (seeded with sort_order > 100 so they can be logged when paired starts are stopped)
    (target_user_id, 'Work Ended', 'WORK', false, NULL, false, 'NEVER', '{}'::jsonb, '💼', '#6366F1', 101),
    (target_user_id, 'Tea Break End', 'BREAK', false, NULL, false, 'NEVER', '{}'::jsonb, '☕', '#92400E', 102),
    (target_user_id, 'Lunch End', 'MEAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🍽️', '#10B981', 103),
    (target_user_id, 'Dinner End', 'MEAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🍽️', '#10B981', 104),
    (target_user_id, 'Woke Up', 'SLEEP', false, NULL, false, 'NEVER', '{}'::jsonb, '🌙', '#8B5CF6', 105),
    (target_user_id, 'Hotel Check-Out', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 106),
    (target_user_id, 'Site Work Ended', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 107),
    (target_user_id, 'Gym End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '💪', '#06B6D4', 108),
    (target_user_id, 'Prayer/Namaz End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🕌', '#D97706', 109),
    (target_user_id, 'Personal Errand End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🛒', '#6B7280', 110);
END;
$$;

-- Trigger to automatically seed new users upon creation
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_user_defaults(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_seed();
