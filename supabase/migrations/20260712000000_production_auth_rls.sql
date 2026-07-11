-- =========================================================
-- LifeLog Production Authentication, Roles & RLS Schema
-- Eliminates demo/anonymous users. Enforces auth.uid() and superadmin access.
-- =========================================================

-- 1. Create User Roles Table (`user` vs `superadmin`)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'
  ));

-- 2. Create Security Definer helper function public.is_superadmin()
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  );
END;
$$;

-- 3. Enforce Strict RLS across all 5 Core Tables
-- Table 1: activity_types
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Users can select own activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Users can insert own activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Users can update own activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Users can delete own activity types" ON public.activity_types;

CREATE POLICY "Users can select own activity types" ON public.activity_types
  FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can insert own activity types" ON public.activity_types
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can update own activity types" ON public.activity_types
  FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin()) WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can delete own activity types" ON public.activity_types
  FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- Table 2: locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can select own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON public.locations;

CREATE POLICY "Users can select own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can insert own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin()) WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can delete own locations" ON public.locations
  FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- Table 3: activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can select own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can update own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can delete own activity logs" ON public.activity_logs;

CREATE POLICY "Users can select own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can update own activity logs" ON public.activity_logs
  FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin()) WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can delete own activity logs" ON public.activity_logs
  FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- Table 4: expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can select own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can select own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin()) WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- Table 5: trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can select own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

CREATE POLICY "Users can select own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can insert own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin()) WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id OR public.is_superadmin());

-- 4. Update Trigger Function to assign default role + seed database upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Assign standard user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  -- Seed default locations
  INSERT INTO public.locations (user_id, name, type, address) VALUES
    (NEW.id, 'Home', 'HOME', 'Residential Address'),
    (NEW.id, 'Main Office', 'OFFICE', 'Corporate Headquarters'),
    (NEW.id, 'Project Site Alpha', 'SITE', 'Industrial Plant Alpha'),
    (NEW.id, 'Client Site Beta', 'SITE', 'Tech Park Sector 42')
  ON CONFLICT DO NOTHING;

  -- Seed required activity buttons
  INSERT INTO public.activity_types (
    user_id, name, category, is_paired, pair_label, is_expense_trigger, expense_reimbursable_rule, reimbursable_conditions, icon, color, sort_order
  ) VALUES
    (NEW.id, 'Left Home', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏠', '#64748B', 1),
    (NEW.id, 'Reached Office', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏢', '#64748B', 2),
    (NEW.id, 'Left Office', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🚗', '#64748B', 3),
    (NEW.id, 'Reached Home', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏠', '#64748B', 4),
    (NEW.id, 'Left for Site', 'COMMUTE', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["OFFICE_TO_SITE", "SITE_TO_SITE"]}'::jsonb, '🚧', '#F59E0B', 5),
    (NEW.id, 'Reached Site', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🚧', '#F59E0B', 6),
    (NEW.id, 'Left Site', 'COMMUTE', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_OFFICE", "SITE_TO_SITE"]}'::jsonb, '🚧', '#F59E0B', 7),
    (NEW.id, 'Work Started', 'WORK', true, 'Work Ended', false, 'NEVER', '{}'::jsonb, '💼', '#6366F1', 8),
    (NEW.id, 'Tea Break Start', 'BREAK', true, 'Tea Break End', false, 'NEVER', '{}'::jsonb, '☕', '#92400E', 9),
    (NEW.id, 'Lunch Start', 'MEAL', true, 'Lunch End', true, 'CONDITIONAL', '{"rule_type": "ACTIVE_TRIP_REIMBURSABLE"}'::jsonb, '🍽️', '#10B981', 10),
    (NEW.id, 'Dinner Start', 'MEAL', true, 'Dinner End', true, 'CONDITIONAL', '{"rule_type": "ACTIVE_TRIP_REIMBURSABLE"}'::jsonb, '🍽️', '#10B981', 11),
    (NEW.id, 'Went to Sleep', 'SLEEP', true, 'Woke Up', false, 'NEVER', '{}'::jsonb, '🌙', '#8B5CF6', 12),
    (NEW.id, 'Reached Site (From Home)', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["HOME_TO_SITE", "OFFICE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 13),
    (NEW.id, 'Hotel Check-In', 'SITE_VISIT', true, 'Hotel Check-Out', true, 'ALWAYS', '{}'::jsonb, '🏗️', '#EF4444', 14),
    (NEW.id, 'Site Work Started', 'SITE_VISIT', true, 'Site Work Ended', false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 15),
    (NEW.id, 'Left Site for Office', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_OFFICE", "SITE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 16),
    (NEW.id, 'Left Site for Home', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 17),
    (NEW.id, 'Gym Start', 'PERSONAL', true, 'Gym End', false, 'NEVER', '{}'::jsonb, '💪', '#06B6D4', 18),
    (NEW.id, 'Prayer/Namaz Start', 'PERSONAL', true, 'Prayer/Namaz End', false, 'NEVER', '{}'::jsonb, '🕌', '#D97706', 19),
    (NEW.id, 'Personal Errand Start', 'PERSONAL', true, 'Personal Errand End', false, 'NEVER', '{}'::jsonb, '🛒', '#6B7280', 20),

    -- End pairs
    (NEW.id, 'Work Ended', 'WORK', false, NULL, false, 'NEVER', '{}'::jsonb, '💼', '#6366F1', 101),
    (NEW.id, 'Tea Break End', 'BREAK', false, NULL, false, 'NEVER', '{}'::jsonb, '☕', '#92400E', 102),
    (NEW.id, 'Lunch End', 'MEAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🍽️', '#10B981', 103),
    (NEW.id, 'Dinner End', 'MEAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🍽️', '#10B981', 104),
    (NEW.id, 'Woke Up', 'SLEEP', false, NULL, false, 'NEVER', '{}'::jsonb, '🌙', '#8B5CF6', 105),
    (NEW.id, 'Hotel Check-Out', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 106),
    (NEW.id, 'Site Work Ended', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 107),
    (NEW.id, 'Gym End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '💪', '#06B6D4', 108),
    (NEW.id, 'Prayer/Namaz End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🕌', '#D97706', 109),
    (NEW.id, 'Personal Errand End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🛒', '#6B7280', 110)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
