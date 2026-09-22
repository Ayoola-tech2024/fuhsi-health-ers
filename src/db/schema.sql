-- FUHSI Health Emergency Service (ERS) schema
-- Core principle: students own/control personal + contact info.
-- Clinicians enter/verify clinical info. Every clinical write is audited.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'clinician', 'responder', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM (
    'reported',        -- SOS just triggered
    'triaged',         -- clinician/dispatcher reviewed
    'responder_assigned',
    'dispatched',       -- responder en route
    'at_facility',
    'resolved',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'student',
  matric_number TEXT UNIQUE, -- students
  staff_id TEXT UNIQUE,      -- clinicians/responders/admin
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student-owned profile: the student can edit this directly.
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  department TEXT,
  hostel_or_address TEXT,
  blood_group TEXT,
  genotype TEXT,
  allergies TEXT[],
  current_medications TEXT[],
  chronic_conditions TEXT[],
  self_reported_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clinician-entered/verified clinical information. Append-oriented + audited.
CREATE TABLE IF NOT EXISTS clinical_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entered_by UUID NOT NULL REFERENCES users(id),
  entry_type TEXT NOT NULL, -- e.g. 'diagnosis', 'allergy_confirmation', 'medication', 'note'
  content JSONB NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  is_emergency_override BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_entry_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_entry_id UUID NOT NULL REFERENCES clinical_entries(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'created', 'verified', 'rejected', 'amended'
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student-owned trusted emergency contacts.
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL DEFAULT 'clinic', -- clinic, dispensary, hospital
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Core ERS flow: SOS -> location -> triage -> responder -> facility -> record
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  status incident_status NOT NULL DEFAULT 'reported',
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  nearest_facility_id UUID REFERENCES facilities(id),
  assigned_responder_id UUID REFERENCES users(id),
  triage_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Live location trail for an active incident.
CREATE TABLE IF NOT EXISTS incident_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full audit trail / timeline of an incident.
CREATE TABLE IF NOT EXISTS incident_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL, -- 'reported','triaged','responder_assigned','dispatched','arrived','resolved','cancelled','note'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification stub (channel-agnostic; wire to SMS/push/email provider later)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  incident_id UUID REFERENCES incidents(id),
  channel TEXT NOT NULL DEFAULT 'push', -- push, sms, email
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Doctor appointment booking requests
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  physician TEXT NOT NULL,
  appointment_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_student ON incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_locations_incident ON incident_locations(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_incident ON incident_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_clinical_entries_student ON clinical_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student ON emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
