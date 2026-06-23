-- =====================================================
-- TuTrack: Pending Photo Uploads (persistent session)
-- Run this AFTER schema.sql, task-attachments.sql
-- Replaces in-memory Map to survive Vercel cold starts
-- =====================================================

-- A) New table: pending_photo_uploads
--    Stores photo upload sessions until user selects a task.
CREATE TABLE IF NOT EXISTS pending_photo_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  file_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B) Indexes
CREATE INDEX IF NOT EXISTS idx_pending_photos_chat_id ON pending_photo_uploads(chat_id);
CREATE INDEX IF NOT EXISTS idx_pending_photos_created_at ON pending_photo_uploads(created_at);

-- C) RLS: disable for anon-key access (app uses PIN auth, not Supabase Auth)
ALTER TABLE pending_photo_uploads DISABLE ROW LEVEL SECURITY;

-- D) Grants
GRANT SELECT, INSERT, DELETE ON pending_photo_uploads TO anon;
GRANT SELECT, INSERT, DELETE ON pending_photo_uploads TO service_role;
