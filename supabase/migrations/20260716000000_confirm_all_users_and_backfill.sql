-- ==============================================================================
-- INSTANT RECOVERY: CONFIRM ALL USERS, BACKFILL PROFILES & FIX SIGNUP
-- ==============================================================================
-- Run this script inside your Supabase Dashboard -> SQL Editor to immediately
-- confirm every unconfirmed email in `auth.users` and backfill their profile/roles.
-- ==============================================================================

-- 1. FORCE CONFIRM ALL USERS IN auth.users
-- This immediately fixes "Invalid login credentials" / "Email not confirmed"
-- for all users who previously signed up (like test accounts).
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at = COALESCE(confirmed_at, now())
WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;

-- 2. ENSURE PROFILES & USER_ROLES TABLES EXIST WITH CLEAN RLS
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

-- 3. BACKFILL PROFILES FOR EVERY USER IN auth.users WHO IS MISSING ONE
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- 4. BACKFILL USER_ROLES FOR EVERY USER IN auth.users WHO IS MISSING ONE
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 5. FOOLPROOF SEED FUNCTION & TRIGGER FOR FUTURE SIGNUPS
CREATE OR REPLACE FUNCTION public.seed_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.locations (user_id, name, type, address) VALUES
    (target_user_id, 'Home', 'HOME', 'Residential Address'),
    (target_user_id, 'Main Office', 'OFFICE', 'Corporate Headquarters'),
    (target_user_id, 'Project Site Alpha', 'SITE', 'Industrial Plant Alpha'),
    (target_user_id, 'Client Site Beta', 'SITE', 'Tech Park Sector 42')
  ON CONFLICT DO NOTHING;

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
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Profile auto-create warning: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'User role auto-create warning: %', SQLERRM;
  END;

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

-- 6. RUN BACKFILL ON ALL EXISTING USERS FOR ACTIVITIES/LOCATIONS
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_user_data(u.id);
  END LOOP;
END;
$$;
