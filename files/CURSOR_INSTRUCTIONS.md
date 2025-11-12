# CURSOR AI IMPLEMENTATION GUIDE
*Step-by-Step Instructions for Building ScribeMD Pro*

---

## 🎯 YOUR MISSION

You are **Cursor AI**, an intelligent coding assistant. Your job is to implement the ScribeMD Pro platform according to the specifications in `ARCHITECTURE.md`.

**Key principles:**
1. **Follow the architecture exactly** - don't improvise
2. **Update PROJECT_STATE.md** after each task
3. **Write production-ready code** - not prototypes
4. **Test everything** - this is a medical app
5. **Ask for clarification** if requirements are unclear

---

## 📋 IMPLEMENTATION PHASES

### PHASE 1: PROJECT SETUP (Day 1)

#### Task 1.1: Initialize Monorepo
```bash
# Create project structure
mkdir scribemd-pro && cd scribemd-pro
npm init -y
npm install -D turbo typescript @types/node

# Create turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**File structure to create:**
```
scribemd-pro/
├── package.json
├── turbo.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── apps/
│   ├── web/                 # Main web app (React + Vite)
│   ├── admin/               # Admin dashboard (React + Vite)
│   └── mobile/              # Mobile wrapper (Capacitor)
├── packages/
│   ├── ui/                  # Shared UI components (React + Tailwind)
│   ├── database/            # Database types & migrations
│   ├── api-client/          # API client library
│   └── utils/               # Shared utilities
├── api/                     # Vercel serverless functions
└── docs/
    ├── PROJECT_STATE.md     # ✅ Already created
    └── ARCHITECTURE.md      # ✅ Already created
```

**Update PROJECT_STATE.md:**
```markdown
### PHASE 1: Foundation (Week 1)
- [x] Architecture document complete
- [x] Database schema designed
- [x] API endpoints defined
- [x] Project structure created
- [ ] Environment variables configured
- [ ] Supabase project setup
- [ ] Vercel project created
```

---

#### Task 1.2: Setup Supabase Project

**Instructions:**
1. Go to https://supabase.com
2. Create new project: "scribemd-pro"
3. Copy credentials to .env.local
4. Run database migrations (see Task 1.3)

**Environment variables to get:**
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
```

---

#### Task 1.3: Create Database Schema

**File to create:** `packages/database/migrations/001_initial_schema.sql`

**Instructions:**
1. Copy the entire schema from `ARCHITECTURE.md` (Database Schema section)
2. Save it as a SQL file
3. Run in Supabase SQL Editor:
   - Go to Supabase Dashboard > SQL Editor
   - Paste the migration
   - Click "Run"

**Verify:**
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should see: practices, users, patients, encounters, templates, audit_logs, etc.
```

**Update PROJECT_STATE.md:**
```markdown
- [x] Database schema designed
- [x] Supabase project setup
```

---

#### Task 1.4: Setup Vercel Project

**Instructions:**
1. Go to https://vercel.com
2. Import GitHub repository (or link later)
3. Connect domain: scribemd.co
4. Add environment variables:
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_KEY
   DEEPGRAM_API_KEY
   ANTHROPIC_API_KEY
   DRCHRONO_CLIENT_ID
   DRCHRONO_CLIENT_SECRET
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   ```

**Create:** `vercel.json`
```json
{
  "buildCommand": "turbo run build",
  "outputDirectory": "apps/web/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

---

### PHASE 2: CORE WEB APP (Days 2-5)

#### Task 2.1: Create Web App Foundation

**Setup React + Vite + TypeScript:**
```bash
cd apps
npm create vite@latest web -- --template react-ts
cd web
npm install

# Install dependencies
npm install react-router-dom @tanstack/react-query zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**File to create:** `apps/web/src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
```

**File to create:** `apps/web/src/App.tsx`
```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EncounterPage from './pages/EncounterPage'

function App() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
      <Route path="/encounter/:id" element={user ? <EncounterPage /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App
```

---

#### Task 2.2: Setup Tailwind + shadcn/ui

**Configure Tailwind:**
```typescript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f2fe',
          100: '#bae6fd',
          500: '#0ea5e9', // Ocean Blue
          600: '#0284c7',
          900: '#0c4a6e',
        },
        success: '#10b981', // Medical Green
        warning: '#f59e0b', // Sunset Orange
        danger: '#ef4444',  // Clinical Red
      },
    },
  },
  plugins: [],
}
```

**Install shadcn/ui:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label
npx shadcn-ui@latest add form select textarea
npx shadcn-ui@latest add dialog alert badge
```

---

#### Task 2.3: Create Authentication Store

**File to create:** `apps/web/src/stores/authStore.ts`
```typescript
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  practice_id: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      // Fetch user details from users table
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      set({ user: userData, loading: false })
    } else {
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Fetch user details
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user!.id)
      .single()
    
    set({ user: userData })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
```

**File to create:** `apps/web/src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

#### Task 2.4: Create Login Page

**File to create:** `apps/web/src/pages/LoginPage.tsx`
```typescript
import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            ScribeMD Pro
          </CardTitle>
          <p className="text-center text-gray-600">
            AI-Powered Medical Documentation
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### PHASE 3: ENCOUNTER & TRANSCRIPTION (Days 6-10)

#### Task 3.1: Create Encounter Store

**File to create:** `apps/web/src/stores/encounterStore.ts`
```typescript
import { create } from 'zustand'

interface Encounter {
  id: string
  patient_id: string
  provider_id: string
  status: 'in_progress' | 'completed' | 'signed'
  chief_complaint: string
  vitals: Record<string, any>
  raw_transcript: string
  soap_note: Record<string, any>
}

interface EncounterStore {
  currentEncounter: Encounter | null
  isTranscribing: boolean
  transcript: string
  startEncounter: (patientId: string) => Promise<void>
  updateTranscript: (text: string) => void
  generateSOAP: () => Promise<void>
  saveEncounter: () => Promise<void>
}

export const useEncounterStore = create<EncounterStore>((set, get) => ({
  currentEncounter: null,
  isTranscribing: false,
  transcript: '',

  startEncounter: async (patientId: string) => {
    // Create encounter in database
    const response = await fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId }),
    })
    const encounter = await response.json()
    set({ currentEncounter: encounter, transcript: '' })
  },

  updateTranscript: (text: string) => {
    set({ transcript: text })
  },

  generateSOAP: async () => {
    const { currentEncounter, transcript } = get()
    if (!currentEncounter) return

    const response = await fetch('/api/soap/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encounter_id: currentEncounter.id,
        transcript,
      }),
    })
    const { soap_note } = await response.json()
    
    set({
      currentEncounter: {
        ...currentEncounter,
        soap_note,
        raw_transcript: transcript,
      },
    })
  },

  saveEncounter: async () => {
    const { currentEncounter } = get()
    if (!currentEncounter) return

    await fetch(`/api/encounters/${currentEncounter.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentEncounter),
    })
  },
}))
```

---

#### Task 3.2: Create Transcription Component

**File to create:** `apps/web/src/components/TranscriptionPanel.tsx`
```typescript
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useEncounterStore } from '../stores/encounterStore'

export function TranscriptionPanel() {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { updateTranscript, transcript } = useEncounterStore()

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Connect to transcription WebSocket
      const ws = new WebSocket('wss://your-domain.com/api/transcribe/stream')
      websocketRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsRecording(true)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.transcript) {
          updateTranscript(transcript + ' ' + data.transcript)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
        setError('Connection error')
        stopRecording()
      }

      // Setup MediaRecorder to send audio
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data)
        }
      }

      mediaRecorder.start(100) // Send chunks every 100ms
    } catch (err: any) {
      setError(err.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (websocketRef.current) {
      websocketRef.current.close()
    }
    setIsRecording(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Live Transcription</h2>
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? 'destructive' : 'default'}
          className="flex items-center gap-2"
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-50 p-4 rounded">
        {transcript || (
          <p className="text-gray-400">
            Click "Start Recording" to begin transcribing...
          </p>
        )}
      </div>
    </div>
  )
}
```

---

### PHASE 4: API ENDPOINTS (Days 11-15)

#### Task 4.1: Create Authentication API

**File to create:** `api/auth/login.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return res.status(200).json({
      user: data.user,
      session: data.session,
    })
  } catch (error: any) {
    return res.status(401).json({ error: error.message })
  }
}
```

---

#### Task 4.2: Create Transcription WebSocket Handler

**File to create:** `api/transcribe/stream.ts`
```typescript
import type { VercelRequest } from '@vercel/node'
import { createClient } from '@deepgram/sdk'
import { WebSocket } from 'ws'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const config = {
  runtime: 'edge',
}

export default async function handler(req: VercelRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  // Connect to Deepgram
  const dgConnection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    punctuate: true,
    interim_results: true,
  })

  dgConnection.on('open', () => {
    console.log('Deepgram connection opened')
  })

  dgConnection.on('Results', (data) => {
    const transcript = data.channel.alternatives[0].transcript
    if (transcript && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'transcript',
        transcript,
        is_final: data.is_final,
      }))
    }
  })

  socket.addEventListener('message', (event) => {
    // Forward audio chunks to Deepgram
    dgConnection.send(event.data)
  })

  socket.addEventListener('close', () => {
    dgConnection.finish()
  })

  return response
}
```

---

#### Task 4.3: Create SOAP Generation API

**File to create:** `api/soap/generate.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, encounter_type, patient_age } = req.body

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a medical documentation expert. Generate a comprehensive SOAP note from this encounter transcript.

Patient Age: ${patient_age}
Encounter Type: ${encounter_type}

Transcript:
${transcript}

Generate a structured SOAP note with:
- Subjective: Chief complaint, HPI, ROS
- Objective: Physical exam findings, vitals interpretation
- Assessment: Differential diagnosis, ICD-10 codes
- Plan: Treatment plan, medications, follow-up

Format as JSON:
{
  "subjective": {...},
  "objective": {...},
  "assessment": {...},
  "plan": {...},
  "icd10_codes": [...],
  "em_level": "99213",
  "clinical_flags": [...]
}`,
      }],
    })

    const soapNote = JSON.parse(message.content[0].text)

    return res.status(200).json({ soap_note: soapNote })
  } catch (error: any) {
    console.error('SOAP generation error:', error)
    return res.status(500).json({ error: error.message })
  }
}
```

---

### PHASE 5: MOBILE APP (Days 16-20)

#### Task 5.1: Setup Capacitor

**Instructions:**
```bash
cd apps/mobile
npm install @capacitor/core @capacitor/cli
npx cap init

# Install platform-specific packages
npm install @capacitor/ios @capacitor/android

# Add platforms
npx cap add ios
npx cap add android
```

**Configure:** `capacitor.config.ts`
```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.scribemd.pro',
  appName: 'ScribeMD Pro',
  webDir: 'dist',
  server: {
    url: 'https://scribemd.co',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
```

---

#### Task 5.2: Build & Deploy iOS

**Instructions:**
```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select your team for signing
# 2. Update bundle identifier
# 3. Add capabilities: Microphone, Camera
# 4. Archive and upload to TestFlight
```

---

#### Task 5.3: Build & Deploy Android

**Instructions:**
```bash
# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Configure signing key
# 2. Update permissions in AndroidManifest.xml
# 3. Build > Generate Signed Bundle
# 4. Upload to Google Play Console
```

---

## 🧪 TESTING CHECKLIST

After implementing each phase, test thoroughly:

### Authentication Tests
- [ ] User can sign up
- [ ] User can log in
- [ ] Invalid credentials show error
- [ ] Session persists on refresh
- [ ] User can log out

### Encounter Tests
- [ ] Can create new encounter
- [ ] Real-time transcription works
- [ ] SOAP note generates correctly
- [ ] Can save encounter
- [ ] Can sign encounter
- [ ] Can export to PDF

### Mobile Tests
- [ ] App launches on iOS
- [ ] App launches on Android
- [ ] Microphone permission works
- [ ] Offline mode functions
- [ ] Push notifications work

---

## 📝 UPDATING PROJECT STATE

**After completing each task, update PROJECT_STATE.md:**

Example:
```markdown
### PHASE 2: Core Features (Week 2)
- [x] User authentication (signup/login/reset)
- [x] Patient management CRUD
- [x] Real-time transcription (Deepgram)
- [ ] SOAP note generation (Claude)
- [ ] Template system
- [ ] Vital signs tracking
- [ ] File uploads

**Current Task:** Implementing SOAP note generation API
**Blockers:** None
**Next Steps:** Test SOAP generation with sample transcripts
```

---

## 🚨 CRITICAL REMINDERS

1. **HIPAA Compliance:** Encrypt all PHI, log all access
2. **Multi-tenancy:** Always filter by practice_id
3. **Error Handling:** Never expose sensitive errors to frontend
4. **Testing:** Test on real devices, not just emulators
5. **Documentation:** Comment complex logic
6. **Git Commits:** Clear, descriptive commit messages

---

## 🆘 WHEN YOU NEED HELP

If you encounter issues:

1. **Check PROJECT_STATE.md** - see what's been done
2. **Check ARCHITECTURE.md** - verify requirements
3. **Search existing code** - look for similar patterns
4. **Ask the user** - if truly stuck, ask for clarification
5. **Document the blocker** - update PROJECT_STATE.md

---

## ✅ COMPLETION CRITERIA

**You've succeeded when:**
- All checkboxes in PROJECT_STATE.md are marked [x]
- All tests pass
- App deploys successfully to web + mobile
- User can complete full encounter flow
- Documentation is updated

---

**NOW GO BUILD SOMETHING AMAZING! 🚀**
