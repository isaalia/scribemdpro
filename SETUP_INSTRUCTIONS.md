# 🚀 ScribeMD Pro - Setup Instructions

## ✅ What's Been Completed

1. **Monorepo Structure** - Complete project structure with Turbo
2. **Web App Foundation** - React + Vite + TypeScript setup
3. **Database Migration** - SQL schema ready in `packages/database/migrations/001_initial_schema.sql`
4. **Authentication Setup** - Login page and auth store ready

## ⚡ Quick Start

**Already have `.env.local` with Supabase credentials?** 
👉 See `QUICK_START.md` for the fastest path to get running!

## 📋 Next Steps

### Step 1: Install Root Dependencies

```powershell
npm install
```

### Step 2: Setup Supabase

1. **Create Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name: `ScribeMDPro` (or your preferred name)
   - Database Name: `ScribeMDPro`
   - Set a database password (save it! - *Note: You don't need this password for the app, only the API keys*)
   - Choose a region close to you
   - Wait for project to be created (~2 minutes)
   
   **✅ If you already have the project:** Skip this step and proceed to getting credentials.

2. **Get Your Credentials:**
   - Go to Project Settings > API
   - Copy these values:
     - `Project URL` (VITE_SUPABASE_URL)
     - `anon public` key (VITE_SUPABASE_ANON_KEY)
     - `service_role` key (SUPABASE_SERVICE_KEY) - Keep this secret!

3. **Run Database Migration:**
   - Go to SQL Editor in Supabase Dashboard
   - Click "New Query"
   - Open `packages/database/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Verify tables were created:
     ```sql
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public';
     ```
   - You should see: practices, users, patients, encounters, templates, audit_logs, integrations, subscription_events, invoices, usage_metrics

### Step 3: Create .env.local File

Create `.env.local` in the root directory with your Supabase credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Deepgram (for transcription) - Add later
DEEPGRAM_API_KEY=your_deepgram_api_key

# Anthropic (for SOAP generation) - Add later
ANTHROPIC_API_KEY=sk-ant-api03-...

# DrChrono (for EHR integration) - Add later
DRCHRONO_CLIENT_ID=your_drchrono_client_id
DRCHRONO_CLIENT_SECRET=your_drchrono_client_secret

# Stripe (for payments) - Add later
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional) - Add later
RESEND_API_KEY=re_...
```

### Step 4: Install Web App Dependencies

```powershell
cd apps/web
npm install
```

### Step 5: Create Test User in Supabase

1. **Create Auth User:**
   - Go to Authentication > Users in Supabase Dashboard
   - Click "Add User" > "Create New User"
   - Email: `test@scribemd.co`
   - Password: `TestPassword123!`
   - Auto Confirm User: ✅ (check this)
   - Click "Create User"

2. **Create User Record in Database:**
   - Go to SQL Editor
   - Run this query (replace the UUIDs with your actual values):
   ```sql
   -- First, create a practice
   INSERT INTO practices (id, name, slug, subscription_tier, subscription_status)
   VALUES (
     '00000000-0000-0000-0000-000000000001',
     'Test Practice',
     'test-practice',
     'free',
     'trial'
   );

   -- Then create a user (replace auth_user_id with the ID from Authentication > Users)
   INSERT INTO users (id, practice_id, email, full_name, role, title)
   VALUES (
     'YOUR_AUTH_USER_ID_HERE', -- Get this from Authentication > Users
     '00000000-0000-0000-0000-000000000001',
     'test@scribemd.co',
     'Test Doctor',
     'provider',
     'MD'
   );
   ```

### Step 6: Start Development Server

```powershell
# From root directory
npm run dev:web
```

Or:

```powershell
# From apps/web directory
npm run dev
```

The app should open at http://localhost:5173

### Step 7: Test Login

1. Open http://localhost:5173
2. You should see the login page
3. Login with:
   - Email: `test@scribemd.co`
   - Password: `TestPassword123!`
4. You should be redirected to the dashboard

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root directory
- Check that variable names start with `VITE_` for frontend access
- Restart the dev server after creating/updating `.env.local`

### "Error fetching user" in console
- Make sure you created the user record in the `users` table
- Check that the `id` in the users table matches the auth user ID
- Verify the practice_id exists in the practices table

### "Module not found" errors
- Run `npm install` in both root and `apps/web` directories
- Make sure all dependencies are installed

### Database connection errors
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active (not paused)
- Make sure you're using the correct keys (anon key for frontend, service key for backend)

## 📚 Next Development Steps

Once login works, continue with:
1. Patient management CRUD
2. Real-time transcription setup
3. SOAP note generation
4. Mobile app setup

See `docs/CURSOR_INSTRUCTIONS.md` for detailed task breakdown.

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Login page displays correctly
- ✅ You can log in with test credentials
- ✅ Dashboard shows your user information
- ✅ No console errors
- ✅ Logout works

---

**Need Help?** Check `docs/PROJECT_STATE.md` for current status and next tasks.

