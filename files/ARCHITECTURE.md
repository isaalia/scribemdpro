# SCRIBEMD PRO - SYSTEM ARCHITECTURE
*Enterprise-Grade Medical Scribe SaaS Platform*

---

## 🎯 SYSTEM OVERVIEW

### What We're Building
A **multi-tenant SaaS platform** that provides AI-powered medical transcription and documentation for healthcare practices. Deployable as:
- Native iOS app
- Native Android app  
- Progressive Web App
- Admin dashboard

### Key Differentiators
1. **Real-time ambient listening** (not post-encounter)
2. **Clinical intelligence** during encounter (red flags, DDx)
3. **Voice-first interface** (completely hands-free)
4. **Multi-tenant with practice management**
5. **White-label ready** for resale

---

## 🏗️ HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   iOS App    │ Android App  │   Web App    │ Admin Dashboard│
│  (Capacitor) │ (Capacitor)  │    (React)   │    (React)     │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                            │
                     [API Gateway]
                            │
       ┌────────────────────┴────────────────────┐
       │                                         │
┌──────▼──────┐                          ┌──────▼──────┐
│   Vercel    │                          │  Supabase   │
│ Serverless  │◄────────────────────────►│   Cloud     │
│ Functions   │                          │             │
│             │                          │ • Auth      │
│ • REST API  │                          │ • Database  │
│ • GraphQL   │                          │ • Storage   │
│ • WebSocket │                          │ • Realtime  │
└──────┬──────┘                          └─────────────┘
       │
       │ (External Services)
       │
       ├─────────► Deepgram (Transcription)
       ├─────────► Anthropic Claude (SOAP/Intelligence)
       ├─────────► DrChrono (EHR Integration)
       ├─────────► Stripe (Payments)
       ├─────────► Resend (Email)
       └─────────► Twilio (SMS - optional)
```

---

## 🗄️ DATABASE SCHEMA

### Multi-Tenant Design
Every table has `practice_id` for tenant isolation.
Row Level Security (RLS) enforces data segregation.

```sql
-- ============================================
-- PRACTICES (TENANTS)
-- ============================================
CREATE TABLE practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, solo, team, enterprise
  subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, past_due, canceled
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin, provider, ma, staff
  title VARCHAR(100), -- MD, DO, NP, PA, MA, etc.
  npi VARCHAR(10), -- National Provider Identifier
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_practice ON users(practice_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- PATIENTS
-- ============================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  external_id VARCHAR(100), -- ID from EHR (DrChrono, etc.)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  mrn VARCHAR(50), -- Medical Record Number
  phone VARCHAR(20),
  email VARCHAR(255),
  address JSONB,
  insurance JSONB,
  allergies JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  medical_history JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_practice ON patients(practice_id);
CREATE INDEX idx_patients_external_id ON patients(external_id);
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);

-- ============================================
-- ENCOUNTERS
-- ============================================
CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  encounter_type VARCHAR(50) NOT NULL, -- new_patient, established, telemedicine, procedure
  encounter_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, signed, exported
  
  -- Chief Complaint
  chief_complaint TEXT,
  
  -- Vitals
  vitals JSONB,
  -- {
  --   "temperature": {"value": 98.6, "unit": "F", "timestamp": "..."},
  --   "blood_pressure": {"systolic": 120, "diastolic": 80, "timestamp": "..."},
  --   "heart_rate": {"value": 72, "unit": "bpm", "timestamp": "..."},
  --   "respiratory_rate": {"value": 16, "unit": "breaths/min", "timestamp": "..."},
  --   "oxygen_saturation": {"value": 98, "unit": "%", "timestamp": "..."},
  --   "weight": {"value": 150, "unit": "lbs", "timestamp": "..."},
  --   "height": {"value": 68, "unit": "in", "timestamp": "..."},
  --   "bmi": {"value": 22.8, "category": "normal", "timestamp": "..."}
  -- }
  
  -- Transcription
  raw_transcript TEXT,
  transcript_segments JSONB DEFAULT '[]',
  -- [{
  --   "speaker": "provider|patient|other",
  --   "text": "...",
  --   "timestamp": "...",
  --   "confidence": 0.95
  -- }]
  
  -- SOAP Note
  soap_note JSONB,
  -- {
  --   "subjective": "...",
  --   "objective": "...",
  --   "assessment": "...",
  --   "plan": "..."
  -- }
  
  -- Clinical Intelligence
  icd10_codes JSONB DEFAULT '[]',
  -- [{"code": "J02.9", "description": "Acute pharyngitis", "confidence": 0.92}]
  
  em_level VARCHAR(10), -- 99213, 99214, etc.
  em_reasoning TEXT,
  
  differential_diagnosis JSONB DEFAULT '[]',
  clinical_flags JSONB DEFAULT '[]',
  -- [{"type": "red_flag", "message": "Chest pain + SOB", "severity": "high"}]
  
  -- Orders & Prescriptions
  orders JSONB DEFAULT '[]',
  prescriptions JSONB DEFAULT '[]',
  
  -- Attachments
  files JSONB DEFAULT '[]',
  
  -- Metadata
  duration_seconds INTEGER,
  word_count INTEGER,
  completed_at TIMESTAMP,
  signed_at TIMESTAMP,
  signed_by UUID REFERENCES users(id),
  exported_at TIMESTAMP,
  exported_to VARCHAR(100), -- drchrono, pdf, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_encounters_practice ON encounters(practice_id);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_encounters_provider ON encounters(provider_id);
CREATE INDEX idx_encounters_date ON encounters(encounter_date);
CREATE INDEX idx_encounters_status ON encounters(status);

-- ============================================
-- TEMPLATES
-- ============================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- soap, hpi, ros, exam, etc.
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  content JSONB NOT NULL,
  -- {
  --   "sections": [...],
  --   "prompts": {...},
  --   "style": "..."
  -- }
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_practice ON templates(practice_id);

-- ============================================
-- AUDIT LOGS (HIPAA Compliance)
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- view, create, update, delete, export, print
  resource_type VARCHAR(50) NOT NULL, -- patient, encounter, user, etc.
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_practice ON audit_logs(practice_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- INTEGRATIONS
-- ============================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- drchrono, epic, athenahealth, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, error, disconnected
  credentials JSONB, -- Encrypted OAuth tokens
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP,
  sync_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_practice ON integrations(practice_id);

-- ============================================
-- SUBSCRIPTIONS & BILLING
-- ============================================
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  stripe_event_id VARCHAR(255),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  status VARCHAR(50), -- draft, open, paid, void
  invoice_pdf_url TEXT,
  due_date DATE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USAGE TRACKING (for billing & analytics)
-- ============================================
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- transcription_minutes, soap_notes_generated, etc.
  value NUMERIC NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_practice_date ON usage_metrics(practice_id, recorded_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy for users table
CREATE POLICY "Users can view their own practice data"
  ON users
  FOR SELECT
  USING (practice_id = auth.uid()::uuid OR auth.jwt() ->> 'practice_id' = practice_id::text);

-- (Additional RLS policies would be defined for each table)
```

---

## 🔌 API ENDPOINTS

### Authentication
```
POST   /api/auth/signup              # Register new practice
POST   /api/auth/login               # User login
POST   /api/auth/logout              # User logout
POST   /api/auth/forgot-password     # Reset password
POST   /api/auth/reset-password      # Confirm password reset
GET    /api/auth/me                  # Get current user
PUT    /api/auth/profile              # Update profile
```

### Practices (Admin)
```
GET    /api/practices                # List all practices (super admin)
GET    /api/practices/:id            # Get practice details
PUT    /api/practices/:id            # Update practice
DELETE /api/practices/:id            # Delete practice
GET    /api/practices/:id/users      # List practice users
POST   /api/practices/:id/users      # Invite user
```

### Users
```
GET    /api/users                    # List users in practice
GET    /api/users/:id                # Get user details
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Deactivate user
POST   /api/users/:id/reset-password # Send password reset
```

### Patients
```
GET    /api/patients                 # List patients
POST   /api/patients                 # Create patient
GET    /api/patients/:id             # Get patient details
PUT    /api/patients/:id             # Update patient
DELETE /api/patients/:id             # Delete patient (soft)
GET    /api/patients/search?q=...    # Search patients
GET    /api/patients/:id/encounters  # Get patient's encounters
```

### Encounters
```
GET    /api/encounters               # List encounters
POST   /api/encounters               # Create encounter
GET    /api/encounters/:id           # Get encounter details
PUT    /api/encounters/:id           # Update encounter
DELETE /api/encounters/:id           # Delete encounter
POST   /api/encounters/:id/sign      # Sign/finalize encounter
POST   /api/encounters/:id/export    # Export (PDF/DOCX/EHR)
```

### Real-time Transcription
```
WS     /api/transcribe/stream        # WebSocket for real-time audio
POST   /api/transcribe/audio         # Upload audio file
GET    /api/transcribe/status/:jobId # Check transcription status
```

### SOAP Generation
```
POST   /api/soap/generate            # Generate SOAP note from transcript
POST   /api/soap/refine              # Refine existing SOAP note
POST   /api/soap/translate           # Translate SOAP note
```

### Clinical Intelligence
```
POST   /api/clinical/icd10           # Get ICD-10 suggestions
POST   /api/clinical/em-level        # Calculate E/M level
POST   /api/clinical/drug-interactions # Check drug interactions
POST   /api/clinical/red-flags       # Detect clinical red flags
POST   /api/clinical/differential    # Generate differential diagnosis
```

### Templates
```
GET    /api/templates                # List templates
POST   /api/templates                # Create template
GET    /api/templates/:id            # Get template
PUT    /api/templates/:id            # Update template
DELETE /api/templates/:id            # Delete template
```

### Integrations
```
GET    /api/integrations             # List integrations
POST   /api/integrations/drchrono/connect    # Connect DrChrono
POST   /api/integrations/drchrono/callback   # OAuth callback
POST   /api/integrations/drchrono/sync       # Sync data
DELETE /api/integrations/:id         # Disconnect integration
```

### File Uploads
```
POST   /api/files/upload             # Upload file (labs, imaging, etc.)
GET    /api/files/:id                # Get file
DELETE /api/files/:id                # Delete file
POST   /api/files/analyze            # AI analysis of uploaded file
```

### Subscriptions & Billing
```
POST   /api/billing/create-checkout  # Create Stripe checkout session
POST   /api/billing/portal           # Stripe customer portal
GET    /api/billing/invoices         # List invoices
POST   /api/billing/webhook          # Stripe webhook handler
GET    /api/billing/usage            # Get usage metrics
```

### Analytics (Admin Dashboard)
```
GET    /api/analytics/overview       # Practice overview
GET    /api/analytics/encounters     # Encounter metrics
GET    /api/analytics/providers      # Provider performance
GET    /api/analytics/patients       # Patient statistics
GET    /api/analytics/revenue        # Revenue/billing stats
GET    /api/analytics/usage          # AI usage metrics
```

---

## 🔐 AUTHENTICATION FLOW

### User Authentication (Supabase Auth + JWT)

```
1. User Registration:
   - User signs up via /api/auth/signup
   - Supabase creates auth user
   - App creates user record in users table
   - User receives verification email
   - Practice is created (if first user)

2. User Login:
   - User submits email/password
   - Supabase validates credentials
   - Returns JWT access token + refresh token
   - Frontend stores tokens securely
   - All API requests include: Authorization: Bearer <token>

3. Token Refresh:
   - Access token expires after 1 hour
   - Frontend automatically refreshes using refresh token
   - New access token returned

4. Multi-tenancy Enforcement:
   - JWT contains practice_id claim
   - All API endpoints validate practice_id
   - RLS policies enforce data isolation
   - Users can only access their practice data
```

### Role-Based Access Control (RBAC)

```
Roles:
- super_admin: Full system access (Anthropic/ScribeMD team)
- practice_admin: Manage practice, users, billing
- provider: Full clinical access, create encounters
- medical_assistant: Limited access, vitals entry
- staff: Scheduling, patient demographics only

Permissions Matrix:
                    Patients | Encounters | Users | Billing | Settings
super_admin           ✓          ✓          ✓        ✓         ✓
practice_admin        ✓          ✓          ✓        ✓         ✓
provider              ✓          ✓          ✗        ✗         ✗
medical_assistant     ✓          ✓ (own)    ✗        ✗         ✗
staff                 ✓          ✗          ✗        ✗         ✗
```

---

## 📱 MOBILE APP ARCHITECTURE (Capacitor)

### Why Capacitor?
- Single React codebase for iOS/Android/Web
- Native APIs (camera, microphone, push notifications)
- Deploy to App Store/Play Store
- Offline support via SQLite
- Background audio processing

### Capacitor Plugins Needed
```javascript
@capacitor/core
@capacitor/camera          // Photo capture for wounds/rashes
@capacitor/filesystem      // Local file storage
@capacitor/haptics         // Tactile feedback
@capacitor/network         // Connection status
@capacitor/push-notifications // Alerts
@capacitor/splash-screen   // Launch screen
@capacitor/status-bar      // iOS status bar styling
@capacitor-community/sqlite // Offline data storage
@capacitor-community/audio-recorder // Voice recording
```

### Mobile-Specific Features
1. **Offline Mode:**
   - Queue encounters for sync when offline
   - Local SQLite cache of recent patients
   - Background sync when connection restored

2. **Push Notifications:**
   - "New patient checked in"
   - "Lab results available"
   - "Pending signature needed"

3. **Native Camera:**
   - Photo documentation (wounds, rashes)
   - Document scanning (insurance cards, labs)
   - OCR for handwritten notes

4. **Voice Recording:**
   - Background audio recording during encounters
   - Audio file encryption
   - Automatic upload when complete

---

## 🎨 ADMIN DASHBOARD FEATURES

### Dashboard Homepage
- Today's encounter count
- Active users
- AI usage metrics (minutes transcribed, SOAP notes generated)
- Revenue this month
- Subscription status

### User Management
- List all users in practice
- Invite new users (email invitation)
- Deactivate/reactivate users
- Assign roles
- View user activity logs

### Practice Settings
- Practice profile (name, address, contact)
- Billing information
- Subscription management (upgrade/downgrade)
- Integration connections (DrChrono, etc.)
- Template library management
- Branding (logo, colors for white-label)

### Analytics & Reports
- Encounter volume over time
- Provider productivity metrics
- E/M code distribution
- Revenue optimization opportunities
- AI usage and cost tracking

### Audit Logs
- All user actions (HIPAA compliance)
- Data access tracking
- Export history
- Failed login attempts

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Vercel (Web + API)
```
scribemd-pro/
├── vercel.json              # Vercel configuration
├── api/                     # Serverless functions
│   ├── auth/
│   ├── patients/
│   ├── encounters/
│   ├── transcribe/
│   └── ...
└── apps/
    ├── web/                 # Main web app
    └── admin/               # Admin dashboard

Environment Variables (Vercel):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- DEEPGRAM_API_KEY
- ANTHROPIC_API_KEY
- DRCHRONO_CLIENT_ID
- DRCHRONO_CLIENT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
```

### Supabase (Database + Auth + Storage)
```
Tables: ✅ (see database schema above)
Auth: JWT-based authentication
Storage: Encrypted file storage for PHI
Realtime: WebSocket subscriptions for live updates
Edge Functions: Optional for complex logic
```

### Mobile Deployment

**iOS (App Store):**
```bash
# Build iOS app
npm run build:ios
npx cap sync ios
npx cap open ios

# In Xcode:
1. Configure signing & capabilities
2. Add HealthKit entitlements (optional)
3. Add microphone usage description
4. Set version/build number
5. Archive and upload to TestFlight
6. Submit for App Store review
```

**Android (Google Play):**
```bash
# Build Android app
npm run build:android
npx cap sync android
npx cap open android

# In Android Studio:
1. Configure signing key
2. Add microphone permission in manifest
3. Set version code/name
4. Generate signed APK/AAB
5. Upload to Google Play Console
6. Submit for review
```

### Domain & SSL
```
Domain: scribemd.co (GoDaddy DNS)
DNS Configuration:
- A record → Vercel IP
- CNAME www → Vercel
- TXT _vercel → verification

SSL: Automatic via Vercel (Let's Encrypt)
```

---

## 🔒 SECURITY & HIPAA COMPLIANCE

### Data Encryption
- **At Rest:** Supabase encrypted database (AES-256)
- **In Transit:** TLS 1.3 for all connections
- **Application Level:** Sensitive fields double-encrypted

### Access Controls
- Role-based access control (RBAC)
- Multi-factor authentication (optional)
- Session timeout after 1 hour
- IP whitelisting (optional for admin)

### Audit Logging
- Every PHI access logged
- Immutable audit trail
- Retention: 7 years (HIPAA requirement)
- Tamper-evident (checksums)

### Business Associate Agreements (BAA)
- ✅ Supabase (HIPAA-compliant tier)
- ✅ Deepgram (BAA available)
- ✅ Anthropic (BAA required for production)
- ✅ AWS (underlying Supabase/Vercel infrastructure)

### Compliance Checklist
- [ ] BAA signed with all vendors
- [ ] Encryption at rest enabled
- [ ] Audit logging implemented
- [ ] Access controls configured
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
- [ ] Penetration testing completed

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Jest + React Testing Library
- API endpoint tests
- Database query tests
- AI prompt validation

### Integration Tests
- End-to-end encounter flow
- Transcription → SOAP generation
- DrChrono sync
- Stripe payment flow

### Manual Testing Checklist
- [ ] User registration/login
- [ ] Patient CRUD operations
- [ ] Real-time transcription
- [ ] SOAP note generation
- [ ] File uploads
- [ ] Export to PDF/DOCX
- [ ] DrChrono integration
- [ ] Mobile app (iOS/Android)
- [ ] Offline mode
- [ ] Push notifications
- [ ] Subscription changes
- [ ] Multi-user collaboration

---

## 📊 MONITORING & OBSERVABILITY

### Error Tracking
- Sentry for frontend errors
- Sentry for backend errors
- Real-time alerts for critical issues

### Performance Monitoring
- Vercel Analytics
- Web Vitals tracking
- API response times
- Database query performance

### Business Metrics
- Daily active users
- Encounters created per day
- Transcription minutes used
- SOAP notes generated
- Conversion rate (trial → paid)
- Churn rate

### Logging
- Structured JSON logs
- Log aggregation (optional: Datadog, LogRocket)
- Real-time log streaming in development

---

## 💰 PRICING & BILLING (Stripe)

### Subscription Tiers
```
Free Trial (14 days):
- 10 encounters
- All features unlocked
- No credit card required

Solo Provider: $99/month
- 1 provider account
- Unlimited encounters
- All AI features
- Basic support

Small Practice: $79/month per provider
- 2-5 providers
- Team collaboration
- DrChrono integration
- Priority support

Enterprise: Custom pricing
- 6+ providers
- White-label option
- Dedicated account manager
- Custom integrations
- SLA guarantee
```

### Stripe Integration
```javascript
// Create checkout session
POST /api/billing/create-checkout
Body: {
  priceId: "price_xxx",
  practiceId: "uuid"
}

// Webhook events to handle:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
```

---

## 🎯 SUCCESS METRICS

### Technical KPIs
- API response time: < 500ms (p95)
- Transcription accuracy: > 95%
- SOAP generation time: < 10 seconds
- Uptime: 99.9% SLA
- Mobile app crash rate: < 1%

### Business KPIs
- Time savings: 10+ min per encounter
- Documentation quality: 95%+ provider satisfaction
- Revenue capture: +$20k/year per provider (better coding)
- User retention: > 85% after 3 months
- NPS score: > 50

---

## 📝 HANDOFF INSTRUCTIONS FOR CURSOR/OTHER AI

**When you start working on this project:**

1. **Read PROJECT_STATE.md first** - understand what's done
2. **Read this ARCHITECTURE.md** - understand the big picture
3. **Check the completion checklist** - know your next tasks
4. **Update PROJECT_STATE.md** when you complete something
5. **Ask questions if unclear** - don't assume

**Critical things to remember:**
- This is MULTI-TENANT - never forget practice_id filtering
- This is HIPAA-compliant - encrypt everything, log everything
- This is PRODUCTION-READY - handle errors gracefully
- This is SALEABLE - make it beautiful and reliable

**Development workflow:**
1. Start feature branch
2. Implement feature
3. Write tests
4. Update PROJECT_STATE.md
5. Commit with clear message
6. Deploy to staging
7. Test thoroughly
8. Deploy to production

---

**END OF ARCHITECTURE DOCUMENT**

This is your blueprint. Build it beautifully. 🚀
