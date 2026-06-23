-- =====================================================
-- TuTrack: Location Pings (route history)
-- Run this AFTER schema.sql, notifications.sql, and travel-history.sql
-- =====================================================

-- A) New table: location_pings
--    One row per location share (one-time Telegram share or live location update).
--    Captures full route history even when stays are < 10 min.
CREATE TABLE IF NOT EXISTS location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  ping_number INT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy FLOAT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_pings_user_date
  ON location_pings(user_id, session_date);

-- Unique constraint: prevents duplicate pings when recordPing() is called
-- alongside upsertLocation() (which also creates pings via RPC)
ALTER TABLE location_pings
  ADD CONSTRAINT unique_user_session_ping
  UNIQUE (user_id, session_date, ping_number);

-- B) RLS: this app uses custom PIN auth (not Supabase Auth), so
--      auth.uid() is always NULL. Disable RLS to allow anon-key access.
ALTER TABLE location_pings DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_visits DISABLE ROW LEVEL SECURITY;

-- C) Enable realtime so the radar map updates live when new pings arrive
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE location_pings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
