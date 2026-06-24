-- =====================================================
-- TunetOps: Status Rename + Custom Tags
-- Run this AFTER all previous migrations in Supabase SQL Editor
-- =====================================================

-- A) Migrate existing 'todo' tasks to 'assigned'
UPDATE tasks SET status = 'assigned' WHERE status = 'todo';

-- B) Update the CHECK constraint: remove 'todo'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('assigned', 'in_progress', 'review', 'done'));

-- C) Update the default value
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'assigned';

-- D) Enable RLS writes for tags (admin manages via settings page)
--    RLS is already disabled on tags (app uses custom PIN auth, not Supabase Auth),
--    so these policies are a safety net only.
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin can insert tags" ON tags;
  DROP POLICY IF EXISTS "Admin can update tags" ON tags;
  DROP POLICY IF EXISTS "Admin can delete tags" ON tags;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admin can insert tags" ON tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update tags" ON tags
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete tags" ON tags
  FOR DELETE USING (true);
