-- ==============================================================================
-- LIFELOG PRODUCTION SCHEMA UPGRADE & SUPERADMIN IMPERSONATION RLS
-- ==============================================================================
-- Run this entire script inside your Supabase Dashboard -> SQL Editor.
-- It establishes profiles, superadmin roles, strict RLS policies, and automatic
-- seeding triggers for all new users.
-- ==============================================================================

-- 1. PROFILES TABLE (Stores full name & email for search inside SuperAdmin dropdown)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profiles if authenticated" ON public.profiles;
CREATE POLICY "Anyone can view profiles if authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. AUTOMATIC PROFILE POPULATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for all existing users right now
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);


-- 3. USER ROLES TABLE (Enforces 'user' vs 'superadmin')
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role or superadmins view all" ON public.user_roles;
CREATE POLICY "Users can view own role or superadmins view all"
  ON public.user_roles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Helper security definer function to check superadmin status reliably inside RLS
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

-- Backfill standard user role for any users not yet in user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- OPTIONAL: To promote an existing account to SuperAdmin right away, uncomment & edit:
-- UPDATE public.user_roles SET role = 'superadmin' WHERE user_id = 'YOUR_USER_UUID_HERE';


-- 4. ENFORCE STRICT RLS ON CORE DATA TABLES (+ SUPERADMIN READ ACCESS)

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


-- 5. AUTOMATIC DATABASE SEEDING FUNCTION & TRIGGER ON NEW USER CREATION
CREATE OR REPLACE FUNCTION public.seed_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Assign standard user role
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'user') ON CONFLICT DO NOTHING;

  -- Seed default locations
  INSERT INTO public.locations (user_id, name, type, address) VALUES
    (target_user_id, 'Home', 'HOME', 'Residential Address'),
    (target_user_id, 'Main Office', 'OFFICE', 'Corporate Headquarters'),
    (target_user_id, 'Project Site Alpha', 'SITE', 'Industrial Plant Alpha'),
    (target_user_id, 'Client Site Beta', 'SITE', 'Tech Park Sector 42')
  ON CONFLICT DO NOTHING;

  -- Seed required activity buttons
  INSERT INTO public.activity_types (
    user_id, name, category, is_paired, pair_label, is_expense_trigger, expense_reimbursable_rule, reimbursable_conditions, icon, color, sort_order
  ) VALUES
    (target_user_id, 'Left Home', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏠', '#64748B', 1),
    (target_user_id, 'Reached Office', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏢', '#64748B', 2),
    (target_user_id, 'Left Office', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🚗', '#64748B', 3),
    (target_user_id, 'Reached Home', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🏠', '#64748B', 4),
    (target_user_id, 'Left for Site', 'COMMUTE', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["OFFICE_TO_SITE", "SITE_TO_SITE"]}'::jsonb, '🚧', '#F59E0B', 5),
    (target_user_id, 'Reached Site', 'COMMUTE', false, NULL, false, 'NEVER', '{}'::jsonb, '🚧', '#F59E0B', 6),
    (target_user_id, 'Left Site', 'COMMUTE', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_OFFICE", "SITE_TO_SITE"]}'::jsonb, '🚧', '#F59E0B', 7),
    (target_user_id, 'Work Started', 'WORK', true, 'Work Ended', false, 'NEVER', '{}'::jsonb, '💼', '#6366F1', 8),
    (target_user_id, 'Tea Break Start', 'BREAK', true, 'Tea Break End', false, 'NEVER', '{}'::jsonb, '☕', '#92400E', 9),
    (target_user_id, 'Lunch Start', 'MEAL', true, 'Lunch End', true, 'CONDITIONAL', '{"rule_type": "ACTIVE_TRIP_REIMBURSABLE"}'::jsonb, '🍽️', '#10B981', 10),
    (target_user_id, 'Dinner Start', 'MEAL', true, 'Dinner End', true, 'CONDITIONAL', '{"rule_type": "ACTIVE_TRIP_REIMBURSABLE"}'::jsonb, '🍽️', '#10B981', 11),
    (target_user_id, 'Went to Sleep', 'SLEEP', true, 'Woke Up', false, 'NEVER', '{}'::jsonb, '🌙', '#8B5CF6', 12),
    (target_user_id, 'Reached Site (From Home)', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["HOME_TO_SITE", "OFFICE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 13),
    (target_user_id, 'Hotel Check-In', 'SITE_VISIT', true, 'Hotel Check-Out', true, 'ALWAYS', '{}'::jsonb, '🏗️', '#EF4444', 14),
    (target_user_id, 'Site Work Started', 'SITE_VISIT', true, 'Site Work Ended', false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 15),
    (target_user_id, 'Left Site for Office', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_OFFICE", "SITE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 16),
    (target_user_id, 'Left Site for Home', 'SITE_VISIT', false, NULL, true, 'CONDITIONAL', '{"rule_type": "TRIP_TYPE_MATCH", "allowed_trip_types": ["SITE_TO_HOME", "SITE_TO_SITE"]}'::jsonb, '🏗️', '#EF4444', 17),
    (target_user_id, 'Gym Start', 'PERSONAL', true, 'Gym End', false, 'NEVER', '{}'::jsonb, '💪', '#06B6D4', 18),
    (target_user_id, 'Prayer/Namaz Start', 'PERSONAL', true, 'Prayer/Namaz End', false, 'NEVER', '{}'::jsonb, '🕌', '#D97706', 19),
    (target_user_id, 'Personal Errand Start', 'PERSONAL', true, 'Personal Errand End', false, 'NEVER', '{}'::jsonb, '🛒', '#6B7280', 20),

    -- End pairs
    (target_user_id, 'Work Ended', 'WORK', false, NULL, false, 'NEVER', '{}'::jsonb, '💼', '#6366F1', 101),
    (target_user_id, 'Tea Break End', 'BREAK', false, NULL, false, 'NEVER', '{}'::jsonb, '☕', '#92400E', 102),
    (target_user_id, 'Lunch End', 'MEAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🍽️', '#10B981', 103),
    (target_user_id, 'Dinner End', 'MEAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🍽️', '#10B981', 104),
    (target_user_id, 'Woke Up', 'SLEEP', false, NULL, false, 'NEVER', '{}'::jsonb, '🌙', '#8B5CF6', 105),
    (target_user_id, 'Hotel Check-Out', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 106),
    (target_user_id, 'Site Work Ended', 'SITE_VISIT', false, NULL, false, 'NEVER', '{}'::jsonb, '🏗️', '#EF4444', 107),
    (target_user_id, 'Gym End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '💪', '#06B6D4', 108),
    (target_user_id, 'Prayer/Namaz End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🕌', '#D97706', 109),
    (target_user_id, 'Personal Errand End', 'PERSONAL', false, NULL, false, 'NEVER', '{}'::jsonb, '🛒', '#6B7280', 110)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_user_data(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seed ON auth.users;
CREATE TRIGGER on_auth_user_created_seed
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();

-- Backfill trigger run for all existing users right now
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_user_data(u.id);
  END LOOP;
END;
$$;
