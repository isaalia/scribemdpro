# ⚡ QUICK REFERENCE CARD
*Keep This Open While Building*

---

## 📁 DOCUMENTATION FILES

| File | Purpose | When to Use |
|------|---------|-------------|
| **PROJECT_STATE.md** | Current status & progress | Start of every session |
| **ARCHITECTURE.md** | Complete technical specs | When implementing features |
| **CURSOR_INSTRUCTIONS.md** | Step-by-step tasks | When Cursor needs guidance |
| **START_HERE.md** | Quick-start guide | When beginning implementation |
| **MISSION_CONTROL.md** | Supervision & control guide | When managing Cursor |

---

## 🎯 CURSOR COMMAND TEMPLATES

### Start New Session
```
Cursor, continue building ScribeMD Pro.
Check PROJECT_STATE.md for current status.
Resume from [Current Task].
```

### Implement Specific Feature
```
Cursor, implement [Feature Name].
Follow specifications in ARCHITECTURE.md section [X].
Update PROJECT_STATE.md when complete.
```

### Debug Issue
```
Cursor, debug [Issue].
Check ARCHITECTURE.md for correct implementation.
Compare our code vs specification.
```

### Status Check
```
Cursor, status update:
1. Read PROJECT_STATE.md
2. What phase are we in?
3. What percentage complete?
4. What's next?
```

---

## 🔧 COMMON COMMANDS

### Development
```bash
# Start web app
npm run dev

# Start API locally
vercel dev

# Run tests
npm test

# Build for production
npm run build
```

### Deployment
```bash
# Deploy to Vercel
vercel --prod

# Build iOS
npm run build:ios
npx cap sync ios
npx cap open ios

# Build Android
npm run build:android
npx cap sync android
npx cap open android
```

---

## 🗄️ DATABASE QUICK ACCESS

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard
- **Tables:** practices, users, patients, encounters
- **Auth:** Authentication > Users
- **SQL Editor:** For running queries

### Common Queries
```sql
-- List all users
SELECT * FROM users;

-- List all encounters
SELECT * FROM encounters ORDER BY created_at DESC LIMIT 10;

-- Check practice subscriptions
SELECT * FROM practices;
```

---

## 🔌 API ENDPOINTS

### Authentication
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### Encounters
- GET `/api/encounters`
- POST `/api/encounters`
- GET `/api/encounters/:id`
- PUT `/api/encounters/:id`

### Transcription
- WS `/api/transcribe/stream`
- POST `/api/transcribe/audio`

### SOAP
- POST `/api/soap/generate`
- POST `/api/soap/refine`

Full list in `ARCHITECTURE.md`

---

## 🚨 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Module not found | `npm install` in correct directory |
| CORS error | Check vercel.json rewrites |
| Supabase error | Verify .env.local credentials |
| TypeScript error | `npm install -D @types/node @types/react` |
| Build fails | Clear cache: `rm -rf node_modules && npm install` |

---

## 📊 CURRENT PHASE CHECKLIST

*Update this manually as you progress*

### PHASE 1: Foundation
- [ ] Project structure
- [ ] Supabase setup
- [ ] Web app running
- [ ] Login working

### PHASE 2: Core Features
- [ ] Patient management
- [ ] Transcription
- [ ] SOAP generation
- [ ] Vitals tracking

### PHASE 3: Clinical Intelligence
- [ ] ICD-10 codes
- [ ] E/M calculator
- [ ] Red flags
- [ ] Drug interactions

### PHASE 4: Admin
- [ ] User management
- [ ] Subscriptions
- [ ] Analytics
- [ ] Billing

### PHASE 5: Mobile
- [ ] iOS app
- [ ] Android app
- [ ] Push notifications
- [ ] Offline mode

---

## 💰 BUSINESS METRICS

| Metric | Target | Status |
|--------|--------|--------|
| Time per encounter | 5 min | - |
| Cost savings | $10,800/yr | ✅ |
| User capacity | 1,000 users | - |
| Annual revenue | $950k | - |
| Trial conversion | 40% | - |

---

## 🔐 ENV VARIABLES CHECKLIST

- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_KEY
- [ ] DEEPGRAM_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] DRCHRONO_CLIENT_ID
- [ ] DRCHRONO_CLIENT_SECRET
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET

---

## 📱 APP STORE SUBMISSION

### iOS Checklist
- [ ] Apple Developer account active
- [ ] Bundle identifier configured
- [ ] Signing certificate setup
- [ ] App Store Connect metadata
- [ ] Screenshots prepared
- [ ] Privacy policy URL
- [ ] TestFlight beta testing

### Android Checklist
- [ ] Google Play Developer account
- [ ] Signing key generated
- [ ] App listing created
- [ ] Store listing metadata
- [ ] Screenshots prepared
- [ ] Privacy policy URL
- [ ] Internal testing track

---

## 🎯 SUCCESS CRITERIA

**MVP is complete when:**
1. User can log in
2. User can create encounter
3. Real-time transcription works
4. SOAP note generates correctly
5. Encounter can be exported
6. Mobile apps build successfully
7. Domain (scribemd.co) works

---

## 🆘 WHEN STUCK

1. Check PROJECT_STATE.md - where are we?
2. Check ARCHITECTURE.md - what should it be?
3. Ask Cursor to compare code vs spec
4. Search Cursor forum
5. Start new Claude conversation with context

---

## 🔥 MOTIVATIONAL QUOTES

*Read when you need a boost*

"You're saving $10,800/year. Worth it?"
"You're building $950k ARR. Keep going."
"Every line of code = more freedom."
"DeepScribe charges $199/mo. You'll charge $99."
"This isn't just code. It's your financial future."

---

**Print this. Pin it. Reference it daily.** 📌
