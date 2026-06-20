-- =====================================================
-- TunetOps: Error Log
-- Run this to create the error_log table
-- Used by webhook handlers to surface silent failures
-- =====================================================

CREATE TABLE IF NOT EXISTS error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  step TEXT NOT NULL,
  user_id UUID,
  error TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_log_created_at
  ON error_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_log_user_id
  ON error_log(user_id);

-- RLS disabled: this app uses custom PIN auth, not Supabase Auth
ALTER TABLE error_log DISABLE ROW LEVEL SECURITY;

GRANT INSERT ON error_log TO anon;
GRANT INSERT ON error_log TO authenticated;
GRANT SELECT ON error_log TO anon;
GRANT SELECT ON error_log TO authenticated;
