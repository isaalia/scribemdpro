-- ============================================
-- FIX RLS RECURSION ERROR
-- ============================================
-- The issue: "Users can view their own practice data" policy causes recursion
-- Solution: Use a simpler approach or remove the redundant policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own practice data" ON users;

-- Keep only the essential policy (users can view their own record)
-- This is all we need for login to work
-- The "Users can view their own record" policy already exists and works

-- If you need users to see other users in their practice, we can add a function-based policy later
-- For now, the "Users can view their own record" policy is sufficient for login

-- Verify policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

