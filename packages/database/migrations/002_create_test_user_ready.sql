-- ============================================
-- CREATE TEST USER AND PRACTICE
-- ============================================
-- This script is ready to run with the User ID: 4cad8060-0be7-462e-9644-277ea1ae2943

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

-- Create user record with the provided User ID
INSERT INTO users (id, practice_id, email, full_name, role, title)
VALUES (
  '4cad8060-0be7-462e-9644-277ea1ae2943',
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

