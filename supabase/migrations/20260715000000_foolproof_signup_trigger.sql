-- ==============================================================================
-- FOOLPROOF USER SIGNUP TRIGGER & PROFILE CREATION
-- ==============================================================================
-- Run this inside Supabase Dashboard -> SQL Editor to ensure user signup NEVER
-- crashes, rolls back, or fails when a new user registers via Supabase Auth.
-- ==============================================================================

-- 1. Create or verify profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read profiles if authenticated" ON public.profiles;
CREATE POLICY "Anyone can read profiles if authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Make seed_user_data safe and idempotent
CREATE OR REPLACE FUNCTION public.seed_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 3. Create Foolproof Trigger that wrapped in EXCEPTION handlers so signup NEVER aborts
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A. Create Profile Row
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Profile auto-create warning: %', SQLERRM;
  END;

  -- B. Create User Role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'User role auto-create warning: %', SQLERRM;
  END;

  -- C. Seed Default Activities & Locations
  BEGIN
    PERFORM public.seed_user_data(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Seed user data warning: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created_seed
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();
