# ⚡ Quick Start Guide

## ✅ Prerequisites Check

Since you already have `.env.local` with your environment variables, let's verify everything is ready:

### Required Environment Variables

Make sure your `.env.local` has these (minimum for login to work):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
```

**Note:** The database password is NOT needed - we only use the API keys above.

## 🚀 Next Steps (In Order)

### 1. Verify Database Migration

**Have you run the database migration yet?**

If not:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your **ScribeMDPro** project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `packages/database/migrations/001_initial_schema.sql` in your editor
6. Copy the entire SQL file contents
7. Paste into the SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. Verify success - you should see "Success. No rows returned"

**Verify tables were created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- audit_logs
- encounters
- invoices
- integrations
- patients
- practices
- subscription_events
- templates
- usage_metrics
- users

### 2. Create Test User

**Have you created a test user yet?**

If not, follow these steps:

**💡 Tip:** There's a helper SQL script at `packages/database/migrations/002_create_test_user.sql` that makes this easier!

#### Step A: Create Auth User
1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **Add User** > **Create New User**
3. Fill in:
   - Email: `test@scribemd.co`
   - Password: `TestPassword123!`
   - ✅ Check **Auto Confirm User**
4. Click **Create User**
5. **Copy the User ID** (you'll need it for the next step)

#### Step B: Create Practice and User Record
1. Go to **SQL Editor** in Supabase
2. Run this query (replace `YOUR_USER_ID_HERE` with the ID from Step A):

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

-- Create user record (replace YOUR_USER_ID_HERE with actual ID)
INSERT INTO users (id, practice_id, email, full_name, role, title)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace this!
  '00000000-0000-0000-0000-000000000001',
  'test@scribemd.co',
  'Test Doctor',
  'provider',
  'MD'
)
ON CONFLICT (id) DO NOTHING;
```

### 3. Install Dependencies

```powershell
# Install root dependencies
npm install

# Install web app dependencies
cd apps/web
npm install
cd ../..
```

### 4. Start Development Server

```powershell
# From root directory
npm run dev:web
```

Or:

```powershell
# From apps/web directory
cd apps/web
npm run dev
```

The app should open at **http://localhost:5173**

### 5. Test Login

1. Open http://localhost:5173
2. You should see the login page
3. Login with:
   - Email: `test@scribemd.co`
   - Password: `TestPassword123!`
4. You should be redirected to the dashboard

## ✅ Success Checklist

- [ ] `.env.local` exists with Supabase credentials
- [x] Database migration has been run ✅ (All tables created!)
- [ ] All tables exist in Supabase
- [ ] Test user created in Authentication
- [ ] Practice and user records created in database
- [ ] Dependencies installed (`npm install` in root and apps/web)
- [ ] Dev server starts without errors
- [ ] Login page displays
- [ ] Can log in successfully
- [ ] Dashboard shows user information

## 🐛 Common Issues

### "Missing Supabase environment variables"
- Check that `.env.local` is in the **root directory** (not in apps/web)
- Verify variable names start with `VITE_` for frontend access
- Restart the dev server after creating/updating `.env.local`

### "Error fetching user" in console
- Make sure you created the user record in the `users` table
- Check that the `id` in users table matches the auth user ID exactly
- Verify the practice_id exists in the practices table

### "Failed to fetch" or connection errors
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active (not paused)
- Make sure you're using the correct keys (anon key for frontend)

### Tables don't exist
- Run the migration again in SQL Editor
- Check for any error messages in the SQL Editor
- Verify you're in the correct Supabase project

## 📞 Need Help?

Check:
- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `docs/PROJECT_STATE.md` - Current project status
- `docs/CURSOR_INSTRUCTIONS.md` - Development guide

---

**Ready to continue?** Once login works, we can move on to building patient management and encounter features! 🚀

