# 🔧 Fix Environment Variables

## The Problem
Vite looks for `.env.local` in the **`apps/web`** directory, not the root directory.

## The Solution

### Step 1: Get Your Complete Supabase Key

Your key appears to be cut off. Get the complete key from:
1. Go to https://supabase.com/dashboard
2. Select your **ScribeMDPro** project
3. Go to **Settings** > **API**
4. Copy the **anon public** key (it should be much longer)

### Step 2: Create .env.local in apps/web

Create a file called `.env.local` in the `apps/web` directory with:

```env
VITE_SUPABASE_URL=https://gvuwhiyxzdsipeafvvxi.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_COMPLETE_KEY_HERE
```

**Important:** 
- The key should be very long (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- Make sure there are NO spaces around the `=` sign
- Make sure there are NO quotes around the values

### Step 3: Restart the Dev Server

After creating the file:
1. Stop the dev server (Ctrl+C in terminal)
2. Start it again: `npm run dev` (from apps/web) or `npm run dev:web` (from root)

### Step 4: Refresh Your Browser

Hard refresh: Ctrl+Shift+R or Ctrl+F5

## Quick Copy-Paste Template

Create `apps/web/.env.local`:

```
VITE_SUPABASE_URL=https://gvuwhiyxzdsipeafvvxi.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_complete_key_here
```

## Verify It's Working

After restarting, you should see:
- ✅ The login page (not the configuration error)
- ✅ No errors in browser console (F12)

