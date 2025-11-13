-- FIX TEMPLATE RLS POLICIES
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view templates in their practice" ON templates;
DROP POLICY IF EXISTS "Users can insert templates in their practice" ON templates;
DROP POLICY IF EXISTS "Users can update templates in their practice" ON templates;
DROP POLICY IF EXISTS "Users can delete templates in their practice" ON templates;

-- SELECT Policy: Users can view templates in their practice
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

-- INSERT Policy: Users can create templates in their practice
CREATE POLICY "Users can insert templates in their practice"
  ON templates
  FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Users can update templates in their practice
CREATE POLICY "Users can update templates in their practice"
  ON templates
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

-- DELETE Policy: Users can delete templates in their practice
CREATE POLICY "Users can delete templates in their practice"
  ON templates
  FOR DELETE
  USING (
    practice_id IN (
      SELECT practice_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- VERIFY POLICIES
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'templates'
ORDER BY cmd, policyname;

