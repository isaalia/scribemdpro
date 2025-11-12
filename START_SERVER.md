# 🚀 How to Start the Dev Server

If you're getting "refused to connect", try these steps:

## Option 1: Start from Web Directory (Recommended)

```powershell
cd apps\web
npm run dev
```

Wait for the output:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Option 2: Start from Root with Turbo

```powershell
npm run dev:web
```

## Troubleshooting

### Port 5173 Already in Use

If port 5173 is busy, Vite will automatically try the next port (5174, 5175, etc.)
Check the terminal output for the actual port number.

### Kill Existing Node Processes

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

Then try starting again.

### Check for Errors

Look in your terminal for any error messages. Common issues:
- Missing environment variables (check .env.local)
- Port conflicts
- Missing dependencies

### Verify .env.local

Make sure `.env.local` exists in the **root directory** with:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Manual Port Check

```powershell
# Check if port 5173 is in use
netstat -ano | findstr :5173
```

If something is using it, either:
- Kill that process
- Or let Vite use a different port (it will show in the output)

## Still Not Working?

1. Check the terminal output for specific error messages
2. Make sure you're in the correct directory
3. Try: `cd apps\web && npm run dev`
4. Check that all dependencies are installed: `npm install` in both root and apps/web

