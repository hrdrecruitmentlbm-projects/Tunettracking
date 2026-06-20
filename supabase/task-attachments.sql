-- =====================================================
-- TunetOps: Task Attachments (photo proof-of-work)
-- Run this AFTER schema.sql, notifications.sql, travel-history.sql, location-pings.sql
-- =====================================================

-- A) New table: task_attachments
--    One row per uploaded photo. Stores metadata; actual files in Supabase Storage.
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_phase TEXT NOT NULL CHECK (upload_phase IN ('in_progress', 'completed')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B) Indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- C) RLS: disable for anon-key access (app uses PIN auth, not Supabase Auth)
ALTER TABLE task_attachments DISABLE ROW LEVEL SECURITY;

-- D) Grants: ensure anon, authenticated, and service_role can read/write attachments
-- (service_role is used by supabaseAdmin in db-attachments.ts; without this GRANT,
--  fetchTaskAttachments fails with 42501 permission denied)
GRANT SELECT, INSERT, DELETE ON task_attachments TO anon;
GRANT SELECT, INSERT ON task_attachments TO authenticated;
GRANT SELECT, INSERT, DELETE ON task_attachments TO service_role;

-- E) Trigger: enforce max 10 attachments per task
CREATE OR REPLACE FUNCTION check_attachment_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM task_attachments WHERE task_id = NEW.task_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 attachments per task';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attachment_limit ON task_attachments;
CREATE TRIGGER trg_attachment_limit
  BEFORE INSERT ON task_attachments
  FOR EACH ROW EXECUTE FUNCTION check_attachment_limit();

-- E) Enable realtime for live gallery updates
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE task_attachments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
