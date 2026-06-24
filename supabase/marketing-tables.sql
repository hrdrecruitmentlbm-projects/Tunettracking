-- Marketing module tables
-- Run this in Supabase SQL Editor AFTER schema.sql
-- Uses GRANT for access (app handles auth at API layer via requireRole)

-- Ensure anon and authenticated can read users (needed for JOINs and fetchUsers)
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  location_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  location_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'belum_diproses'
    CHECK (status IN ('belum_diproses', 'sudah_followup', 'acc', 'tidak')),
  notes TEXT NOT NULL DEFAULT '',
  assigned_to UUID NOT NULL REFERENCES users(id),
  area TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_deleted_at ON prospects(deleted_at);

GRANT ALL ON prospects TO anon;
GRANT ALL ON prospects TO authenticated;

-- Tower sites table
CREATE TABLE IF NOT EXISTS tower_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  site_type TEXT NOT NULL DEFAULT 'other'
    CHECK (site_type IN ('village', 'school', 'corporate', 'government', 'other')),
  contact_person TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  location_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  location_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'baru_ditugaskan'
    CHECK (status IN ('baru_ditugaskan', 'pending', 'diproses', 'acc', 'rejected')),
  notes TEXT NOT NULL DEFAULT '',
  assigned_to UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tower_sites_assigned_to ON tower_sites(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tower_sites_status ON tower_sites(status);
CREATE INDEX IF NOT EXISTS idx_tower_sites_deleted_at ON tower_sites(deleted_at);

GRANT ALL ON tower_sites TO anon;
GRANT ALL ON tower_sites TO authenticated;

-- Visit logs table
CREATE TABLE IF NOT EXISTS visit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('prospek', 'tower')),
  prospect_id UUID REFERENCES prospects(id),
  tower_id UUID REFERENCES tower_sites(id),
  visited_by UUID NOT NULL REFERENCES users(id),
  status_snapshot TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  location_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  location_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_logs_visited_by ON visit_logs(visited_by);
CREATE INDEX IF NOT EXISTS idx_visit_logs_type ON visit_logs(type);
CREATE INDEX IF NOT EXISTS idx_visit_logs_prospect_id ON visit_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_tower_id ON visit_logs(tower_id);

GRANT ALL ON visit_logs TO anon;
GRANT ALL ON visit_logs TO authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prospects_updated_at ON prospects;
CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();

DROP TRIGGER IF EXISTS tower_sites_updated_at ON tower_sites;
CREATE TRIGGER tower_sites_updated_at
  BEFORE UPDATE ON tower_sites
  FOR EACH ROW EXECUTE FUNCTION update_marketing_updated_at();
