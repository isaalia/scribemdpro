-- ============================================
-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- ============================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own practice data" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can view their own practice" ON practices;
DROP POLICY IF EXISTS "Users can view patients in their practice" ON patients;
DROP POLICY IF EXISTS "Users can view encounters in their practice" ON encounters;
DROP POLICY IF EXISTS "Users can view templates in their practice" ON templates;

-- ============================================
-- PRACTICES POLICIES
-- ============================================
CREATE POLICY "Users can view their own practice"
  ON practices
  FOR SELECT
  USING (
    id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- USERS POLICIES
-- ============================================
-- Users can view their own record (most important!)
-- This must be first and simple to avoid recursion
CREATE POLICY "Users can view their own record"
  ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can view other users in their practice
-- Use a function to avoid recursion, or use a simpler approach
-- For now, we'll use a subquery that references auth.uid() directly
-- This works because we're checking the practice_id against a direct lookup
CREATE POLICY "Users can view their own practice data"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM users u
      WHERE u.id = auth.uid()
      AND u.practice_id = users.practice_id
    )
  );

-- ============================================
-- PATIENTS POLICIES
-- ============================================
CREATE POLICY "Users can view patients in their practice"
  ON patients
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- ENCOUNTERS POLICIES
-- ============================================
CREATE POLICY "Users can view encounters in their practice"
  ON encounters
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- TEMPLATES POLICIES
-- ============================================
CREATE POLICY "Users can view templates in their practice"
  ON templates
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- VERIFY POLICIES WERE CREATED
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

