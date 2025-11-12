# 🏥 ScribeMD Pro

AI-Powered Medical Scribe SaaS Platform

## 🚀 Features

- **Real-time Transcription** - Ambient AI listening during patient encounters
- **SOAP Note Generation** - Automated clinical documentation using Claude AI
- **Patient Management** - Complete CRUD operations for patient records
- **Multi-tenant Architecture** - Isolated data per practice
- **HIPAA Compliant** - Enterprise-grade security and audit logging
- **Native Mobile Apps** - iOS and Android via Capacitor
- **Web Dashboard** - Progressive Web App for instant access

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **AI Services:** Deepgram (transcription), Anthropic Claude (SOAP generation)
- **Mobile:** Capacitor (iOS/Android)
- **State Management:** Zustand + React Query

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- API keys for Deepgram and Anthropic

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/scribemd-pro.git
cd scribemd-pro
```

### 2. Install dependencies

```bash
npm install
cd apps/web
npm install
```

### 3. Setup environment variables

Create `.env.local` in `apps/web/`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Supabase

1. Create a Supabase project
2. Run the database migrations in `packages/database/migrations/`
3. Create RLS policies (see `packages/database/migrations/003_rls_policies.sql`)

### 5. Start development server

```bash
npm run dev:web
```

Visit http://localhost:5173

## 📁 Project Structure

```
scribemd-pro/
├── apps/
│   ├── web/              # Main web application
│   ├── admin/            # Admin dashboard
│   └── mobile/           # Mobile app (Capacitor)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Database schemas & migrations
│   ├── api-client/       # API client library
│   └── utils/            # Shared utilities
├── api/                  # Vercel serverless functions
└── docs/                 # Documentation
```

## 📚 Documentation

- `docs/ARCHITECTURE.md` - Complete system architecture
- `docs/PROJECT_STATE.md` - Current project status
- `docs/CURSOR_INSTRUCTIONS.md` - Development guide
- `SETUP_INSTRUCTIONS.md` - Setup instructions

## 🧪 Development

```bash
# Run web app
npm run dev:web

# Run admin dashboard
npm run dev:admin

# Build all apps
npm run build

# Run linter
npm run lint
```

## 📝 License

Proprietary - All rights reserved

## 👥 Contributing

This is a private project. For access, please contact the repository owner.

---

**Built with ❤️ for healthcare providers**
