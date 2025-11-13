-- ============================================
-- FIX PATIENT RLS POLICIES - Add INSERT, UPDATE, DELETE
-- ============================================
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert patients in their practice" ON patients;
DROP POLICY IF EXISTS "Users can update patients in their practice" ON patients;
DROP POLICY IF EXISTS "Users can delete patients in their practice" ON patients;

-- INSERT Policy: Users can create patients in their own practice
CREATE POLICY "Users can insert patients in their practice"
  ON patients
  FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Users can update patients in their own practice
CREATE POLICY "Users can update patients in their practice"
  ON patients
  FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Users can delete patients in their own practice
CREATE POLICY "Users can delete patients in their practice"
  ON patients
  FOR DELETE
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- FIX ENCOUNTER RLS POLICIES - Add INSERT, UPDATE, DELETE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert encounters in their practice" ON encounters;
DROP POLICY IF EXISTS "Users can update encounters in their practice" ON encounters;
DROP POLICY IF EXISTS "Users can delete encounters in their practice" ON encounters;

-- INSERT Policy: Users can create encounters in their own practice
CREATE POLICY "Users can insert encounters in their practice"
  ON encounters
  FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Users can update encounters in their own practice
CREATE POLICY "Users can update encounters in their practice"
  ON encounters
  FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Users can delete encounters in their own practice
CREATE POLICY "Users can delete encounters in their practice"
  ON encounters
  FOR DELETE
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
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('patients', 'encounters')
ORDER BY tablename, cmd, policyname;

