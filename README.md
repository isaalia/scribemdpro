# ScribeMD Pro

AI-Powered Medical Scribe SaaS Platform - Production-Ready MVP

## 🎯 Overview

ScribeMD Pro is a comprehensive medical scribe platform that uses AI to transcribe patient encounters in real-time and generate structured SOAP notes. Built for healthcare providers who need efficient, HIPAA-compliant documentation.

## ✨ Features

### Core Features
- **Real-time Transcription** - Live audio transcription using Deepgram
- **AI-Powered SOAP Notes** - Automatic SOAP note generation using Claude Sonnet 4
- **Patient Management** - Complete patient CRUD with search
- **Encounter Management** - Full encounter lifecycle management
- **Template System** - Reusable note templates
- **Vital Signs Tracking** - BMI calculation and abnormal value detection

### Clinical Intelligence
- **ICD-10 Code Suggestions** - AI-powered diagnosis code recommendations
- **E/M Level Calculation** - Automatic evaluation and management level calculation
- **Red Flag Detection** - Clinical warning system
- **Differential Diagnosis** - AI-generated differential diagnoses
- **Drug Interaction Warnings** - Medication safety checks
- **Smart Vitals Interpretation** - Abnormal vital sign detection

### Admin & Business
- **Admin Dashboard** - System-wide analytics and management
- **User Management** - Role-based access control
- **Subscription Management** - Stripe integration for billing
- **Analytics Dashboard** - Usage metrics and insights
- **Billing & Invoicing** - Complete billing management
- **Practice Management** - Multi-tenant practice administration

### Integrations
- **DrChrono EHR** - OAuth integration for EHR sync
- **PDF Export** - Professional encounter note export
- **Email Notifications** - Automated email alerts
- **Calendar Integration** - iCal export for scheduling
- **Lab Result Imports** - File-based lab result import

### Security & Compliance
- **HIPAA-Compliant Audit Logging** - Complete access tracking
- **Row Level Security** - Multi-tenant data isolation
- **Encrypted Storage** - Secure file handling
- **Role-Based Access Control** - Granular permissions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions + Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI Services**: Anthropic Claude, Deepgram
- **Payments**: Stripe
- **Email**: Resend

### Project Structure
```
scribemdpro/
├── apps/
│   └── web/              # React web application
├── api/                   # Vercel serverless functions
├── packages/
│   └── database/          # Database migrations
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/isaalia/scribemdpro.git
   cd scribemdpro
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   ```bash
   cp .env.example apps/web/.env.local
   # Edit apps/web/.env.local with your credentials
   ```

4. **Run Database Migrations**
   - Go to Supabase Dashboard → SQL Editor
   - Run migrations in order:
     - `packages/database/migrations/001_initial_schema.sql`
     - `packages/database/migrations/003_rls_policies.sql`
     - `SETUP_STORAGE_POLICIES.sql`

5. **Start Development Server**
   ```bash
   npm run dev:web
   ```

6. **Access Application**
   - Open http://localhost:5173
   - Login with test credentials

## 📚 Documentation

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Project State](docs/PROJECT_STATE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Security Checklist](SECURITY_CHECKLIST.md)
- [Setup Instructions](SETUP_INSTRUCTIONS.md)

## 🔒 Security

- All PHI is encrypted at rest and in transit
- Comprehensive audit logging for HIPAA compliance
- Row Level Security (RLS) for multi-tenant isolation
- Role-based access control
- Secure API endpoints

See [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for complete security details.

## 📋 License

Proprietary - All Rights Reserved

## 🤝 Support

For support, email support@scribemd.co

---

**Built with ❤️ for healthcare providers**
