-- =====================================================
-- MIGRATION: Fix RLS Policies for user_profiles
-- Resolves "new row violates row-level security policy"
-- =====================================================

-- 1. Create Helper Function (Bypasses RLS to avoid recursion)
-- Uses SECURITY DEFINER to run as owner (superuser)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR 'admin' = ANY(roles))
  );
$$;

-- 2. Reset Policies on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all known existing policies to start fresh
DROP POLICY IF EXISTS "Allow all access" ON user_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins full access" ON user_profiles;
DROP POLICY IF EXISTS "User self access" ON user_profiles;

-- 3. Create New Policies

-- Policy A: ADMINS HAVE FULL ACCESS
-- (Select, Insert, Update, Delete ANY row)
CREATE POLICY "Admins full access" 
ON user_profiles
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy B: USERS HAVE SELF ACCESS
-- (Can Select and Update their own row. Insert handled by Sign Up logic usually, but we allow if ID matches)
CREATE POLICY "User self access" 
ON user_profiles
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Grant access to function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. Add fallback for public (unauthenticated) if needed? 
-- No, only authenticated users should touch profiles.
