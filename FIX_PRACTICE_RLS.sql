-- FIX PRACTICE RLS POLICIES - Admin-only creation
-- Run this in Supabase SQL Editor
-- NOTE: Public signup is disabled. Only admins can create practices/users.

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert practices" ON practices;
DROP POLICY IF EXISTS "Admins can insert practices" ON practices;
DROP POLICY IF EXISTS "Practice admins can update their practice" ON practices;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- INSERT Policy: Only admins can create practices
-- This requires checking if the user is an admin in another practice first
-- For now, we'll use a service role or allow if user doesn't exist yet (first admin)
CREATE POLICY "Admins can insert practices"
  ON practices
  FOR INSERT
  WITH CHECK (
    -- Allow if no user exists yet (first admin creating first practice)
    -- OR if user is admin in any practice
    NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE Policy: Practice admins can update their practice
CREATE POLICY "Practice admins can update their practice"
  ON practices
  FOR UPDATE
  USING (
    id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT Policy: Only admins can create users in their practice
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  WITH CHECK (
    -- User being created must belong to a practice where current user is admin
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- VERIFY POLICIES
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('practices', 'users')
ORDER BY tablename, cmd, policyname;

