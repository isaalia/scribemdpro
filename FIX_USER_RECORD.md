# 🔧 Fix User Record Issue

## Step 1: Get Your Actual Auth User ID

1. **Open your browser console** (F12 → Console tab)
2. **Try to log in** with `test@scribemd.co` / `TestPassword123!`
3. **Look for the error message** - it should show your actual Auth User ID
4. **Copy that ID**

OR

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find the user with email `test@scribemd.co`
3. **Copy the User ID** (it might be different from `4cad8060-0be7-462e-9644-277ea1ae2943`)

## Step 2: Run Diagnostic Queries

Run these in Supabase SQL Editor to see what's in your database:

```sql
-- Check what users exist
SELECT id, email, full_name FROM users;

-- Check what practices exist
SELECT id, name FROM practices;

-- Check auth user
SELECT id, email FROM auth.users WHERE email = 'test@scribemd.co';
```

## Step 3: Create/Update User Record

Use the **actual Auth User ID** you found in Step 1:

```sql
-- First, create practice if it doesn't exist
INSERT INTO practices (id, name, slug, subscription_tier, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Practice',
  'test-practice',
  'free',
  'trial'
)
ON CONFLICT (id) DO NOTHING;

-- Then create user with YOUR ACTUAL AUTH USER ID
-- Replace 'YOUR_ACTUAL_AUTH_USER_ID' with the ID from Step 1
INSERT INTO users (id, practice_id, email, full_name, role, title)
VALUES (
  'YOUR_ACTUAL_AUTH_USER_ID',  -- ⚠️ REPLACE THIS!
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
  title = EXCLUDED.title;

-- Verify
SELECT * FROM users WHERE email = 'test@scribemd.co';
```

## Common Issues

### Issue: User ID doesn't match
- The User ID in the database must **exactly match** the Auth User ID
- Get the Auth User ID from Authentication → Users in Supabase
- Update the INSERT statement with the correct ID

### Issue: Practice doesn't exist
- Make sure you run the practice INSERT first
- Or the user INSERT will fail with a foreign key error

### Issue: User exists but with wrong ID
- Delete the old user record:
```sql
DELETE FROM users WHERE email = 'test@scribemd.co';
```
- Then create it again with the correct Auth User ID

