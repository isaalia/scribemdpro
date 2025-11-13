-- FIX PRACTICE RLS POLICIES - Add INSERT for signup
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert practices" ON practices;

-- INSERT Policy: Anyone can create a practice (for signup)
-- In production, you might want to add additional checks
CREATE POLICY "Users can insert practices"
  ON practices
  FOR INSERT
  WITH CHECK (true);

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

-- Also need INSERT policy for users table for signup
DROP POLICY IF EXISTS "Users can insert their own record" ON users;

CREATE POLICY "Users can insert their own record"
  ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- VERIFY POLICIES
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('practices', 'users')
ORDER BY tablename, cmd, policyname;

