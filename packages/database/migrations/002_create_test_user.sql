-- ============================================
-- CREATE TEST USER AND PRACTICE
-- ============================================
-- Run this AFTER creating the auth user in Supabase Authentication
-- 
-- Steps:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" > "Create New User"
-- 3. Email: test@scribemd.co
-- 4. Password: TestPassword123!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create User"
-- 7. Copy the User ID from the users list
-- 8. Replace 'YOUR_AUTH_USER_ID_HERE' below with that ID
-- 9. Run this SQL script

-- Create a practice
INSERT INTO practices (id, name, slug, subscription_tier, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Practice',
  'test-practice',
  'free',
  'trial'
)
ON CONFLICT (id) DO NOTHING;

-- Create user record
-- ⚠️ IMPORTANT: Replace 'YOUR_AUTH_USER_ID_HERE' with the actual User ID from Authentication > Users
INSERT INTO users (id, practice_id, email, full_name, role, title)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- ⚠️ REPLACE THIS with the User ID from Authentication > Users
  '00000000-0000-0000-0000-000000000001',
  'test@scribemd.co',
  'Test Doctor',
  'provider',
  'MD'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  p.name as practice_name
FROM users u
JOIN practices p ON u.practice_id = p.id
WHERE u.email = 'test@scribemd.co';

