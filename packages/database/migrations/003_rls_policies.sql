-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
-- Run this in Supabase SQL Editor
-- This allows users to access their own data

-- Drop ALL existing policies on these tables
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
CREATE POLICY "Users can view their own practice data"
  ON users
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Users can view their own record
CREATE POLICY "Users can view their own record"
  ON users
  FOR SELECT
  USING (id = auth.uid());

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
-- VERIFY POLICIES
-- ============================================
-- Check that policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

