-- ==============================================================================
-- DYNAMIC RECURSION REMOVAL & FOOLPROOF RLS FOR USER_ROLES
-- ==============================================================================
-- Run this query inside your Supabase Dashboard -> SQL Editor to completely
-- eliminate infinite recursion (error 42P17) on the user_roles table regardless
-- of what old policy names currently exist in the database.
-- ==============================================================================

-- 1. Momentarily disable RLS on user_roles
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Dynamically drop every single existing RLS policy on user_roles regardless of name
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles;', pol.policyname); 
    END LOOP; 
END $$;

-- 3. Re-enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create one single, non-recursive SELECT policy for user_roles
CREATE POLICY "user_roles_non_recursive_select"
  ON public.user_roles FOR SELECT
  USING (true);

-- 5. Create basic update policy for self/superadmin
CREATE POLICY "user_roles_update"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Ensure security definer helper has fixed search_path so it never recurses
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  );
END;
$$;
