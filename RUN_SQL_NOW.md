# 🚨 IMPORTANT: Run This SQL in Supabase

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard
- Select your **ScribeMDPro** project
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### 2. Copy and Paste This SQL

```sql
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

-- Verify the user was created (you should see 1 row)
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  p.name as practice_name
FROM users u
JOIN practices p ON u.practice_id = p.id
WHERE u.email = 'test@scribemd.co';
```

### 3. Run the Query
- Click the **Run** button (or press Ctrl+Enter)
- You should see "Success" message
- The SELECT query at the end should return 1 row with your user details

### 4. Verify It Worked
You should see output like:
```
id                                   | email            | full_name   | role     | practice_name
4cad8060-0be7-462e-9644-277ea1ae2943 | test@scribemd.co | Test Doctor | provider | Test Practice
```

### 5. Try Login Again
- Go back to your browser
- Refresh the page
- Try logging in with:
  - Email: `test@scribemd.co`
  - Password: `TestPassword123!`

## Troubleshooting

### If you get "duplicate key" error:
- That's OK! It means the records already exist
- Just run the SELECT query to verify:
```sql
SELECT * FROM users WHERE email = 'test@scribemd.co';
```

### If you get "foreign key" error:
- Make sure you run BOTH INSERT statements (practice first, then user)
- Or run them together in one query

### If the SELECT returns 0 rows:
- Check that the User ID matches: `4cad8060-0be7-462e-9644-277ea1ae2943`
- Verify the email is exactly: `test@scribemd.co`

