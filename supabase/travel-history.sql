-- =====================================================
-- TunetOps: FOC Travel History / Route Tracking
-- Run this AFTER schema.sql and notifications.sql
-- =====================================================

-- A) Extend locations table to track current-stay state
ALTER TABLE locations ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE locations ADD COLUMN IF NOT EXISTS session_date DATE;

-- B) New table: location_visits (one row per qualifying stay)
CREATE TABLE IF NOT EXISTS location_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  visit_number INT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  arrived_at TIMESTAMPTZ NOT NULL,
  departed_at TIMESTAMPTZ,
  duration_minutes INT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_visits_user_date
  ON location_visits(user_id, session_date);

-- C) Reassign arrived_at for any existing locations rows that don't have it
--    (so the first new location update doesn't immediately trigger a 10-min visit
--    based on a 30-day-old arrival)
UPDATE locations
SET arrived_at = updated_at
WHERE arrived_at IS NULL OR arrived_at < updated_at - INTERVAL '1 hour';
