-- ============================================
-- CHECK IF USER RECORD EXISTS IN users TABLE
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Check if user exists in users table with the correct ID
SELECT * FROM users WHERE id = '4cad8060-0be7-462e-9644-277ea1ae2943';

-- 2. Check if user exists by email
SELECT * FROM users WHERE email = 'test@scribemd.co';

-- 3. List all users in the users table
SELECT id, email, full_name, practice_id FROM users;

-- 4. Check if practice exists
SELECT * FROM practices WHERE id = '00000000-0000-0000-0000-000000000001';

-- If the user doesn't exist, run this to create it:
-- (Only run if the SELECT queries above return 0 rows)

-- First create practice (if needed)
INSERT INTO practices (id, name, slug, subscription_tier, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Practice',
  'test-practice',
  'free',
  'trial'
)
ON CONFLICT (id) DO NOTHING;

-- Then create user record
INSERT INTO users (id, practice_id, email, full_name, role, title)
VALUES (
  '4cad8060-0be7-462e-9644-277ea1ae2943',
  '00000000-0000-0000-0000-000000000001',
  'test@scribemd.co',
  'Test Doctor',
  'provider',
  'MD'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  practice_id = EXCLUDED.practice_id;

-- Verify it was created
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  p.name as practice_name
FROM users u
JOIN practices p ON u.practice_id = p.id
WHERE u.id = '4cad8060-0be7-462e-9644-277ea1ae2943';

