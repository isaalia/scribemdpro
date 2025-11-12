# 📝 Create .env.local File

## Quick Steps:

1. **Open your file explorer** and navigate to:
   ```
   C:\Users\YEMAY\Dropbox\A-Computer\scribemdpro\apps\web
   ```

2. **Create a new file** called `.env.local` (note the dot at the beginning)

3. **Copy and paste this** into the file (replace with your complete Supabase key):
   ```env
   VITE_SUPABASE_URL=https://gvuwhiyxzdsipeafvvxi.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dXdoaXl4emRzaXBlYWZ2dnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjY0NjUsImV4cCI6MjA3ODUwMjI2NX0.YOUR_COMPLETE_KEY
   ```

4. **Get your complete key** from Supabase Dashboard:
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Settings → API
   - Copy the **anon public** key (it's very long!)

5. **Save the file**

6. **Restart the dev server** (I've already started it, but you may need to refresh)

## Or Use PowerShell:

```powershell
cd apps\web
@"
VITE_SUPABASE_URL=https://gvuwhiyxzdsipeafvvxi.supabase.co
VITE_SUPABASE_ANON_KEY=PASTE_YOUR_COMPLETE_KEY_HERE
"@ | Out-File -FilePath .env.local -Encoding utf8
```

Then edit `.env.local` and replace `PASTE_YOUR_COMPLETE_KEY_HERE` with your actual key.

