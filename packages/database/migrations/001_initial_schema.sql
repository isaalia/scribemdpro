-- ============================================
-- SCRIBEMD PRO - INITIAL DATABASE SCHEMA
-- ============================================
-- Run this migration in Supabase SQL Editor
-- This creates all tables, indexes, and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  
  -- Transcription
  raw_transcript TEXT,
  transcript_segments JSONB DEFAULT '[]',
  
  -- SOAP Note
  soap_note JSONB,
  
  -- Clinical Intelligence
  icd10_codes JSONB DEFAULT '[]',
  em_level VARCHAR(10), -- 99213, 99214, etc.
  em_reasoning TEXT,
  differential_diagnosis JSONB DEFAULT '[]',
  clinical_flags JSONB DEFAULT '[]',
  
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
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be created in a separate migration
-- after authentication is set up, as they depend on auth.uid()

