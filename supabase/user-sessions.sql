-- =====================================================
-- TunetOps: User Sessions (heartbeat-based online tracking)
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- =====================================================

-- A) Schema: one row per user, last_seen updated on heartbeat
CREATE TABLE IF NOT EXISTS user_sessions (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B) Index for fast "active in last N minutes" queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen
  ON user_sessions (last_seen DESC);

-- C) RLS: app uses custom PIN auth (not Supabase Auth), so auth.uid()
--    is always NULL. Disable RLS — the API route already gates writes
--    by validating the user_id parameter against the session cookie.
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- D) Enable realtime so admin pages can subscribe to live count changes
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
