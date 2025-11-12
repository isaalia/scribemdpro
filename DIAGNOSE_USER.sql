-- ============================================
-- DIAGNOSTIC QUERIES - Run these in Supabase SQL Editor
-- ============================================

-- 1. Check if practice exists
SELECT * FROM practices WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Check if user exists with the User ID
SELECT * FROM users WHERE id = '4cad8060-0be7-462e-9644-277ea1ae2943';

-- 3. Check if user exists with the email
SELECT * FROM users WHERE email = 'test@scribemd.co';

-- 4. List all users (to see what's there)
SELECT id, email, full_name, practice_id FROM users;

-- 5. List all practices
SELECT id, name, slug FROM practices;

-- 6. Check auth.users table (to verify the auth user ID)
SELECT id, email FROM auth.users WHERE email = 'test@scribemd.co';

