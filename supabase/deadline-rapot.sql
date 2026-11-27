-- =====================================================
-- TuTrack: Task Deadline Tracking & Rapot Karyawan
-- Run this in the Supabase SQL Editor
-- =====================================================

-- 1) Add completed_at to track exact completion timestamps (so later edits don't shift updated_at)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2) Backfill completed_at for existing completed tasks using task_history first, then updated_at
UPDATE tasks t
SET completed_at = COALESCE(
  (
    SELECT th.created_at
    FROM task_history th
    WHERE th.task_id = t.id
      AND th.action = 'status_changed'
      AND th.new_value->>'status' = 'done'
    ORDER BY th.created_at DESC
    LIMIT 1
  ),
  t.updated_at
)
WHERE t.status = 'done' AND t.completed_at IS NULL;

-- 3) Automatically set / clear completed_at when task status changes
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done' OR NEW.completed_at IS NULL) THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'done' AND OLD.status = 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_set_completed_at ON tasks;
CREATE TRIGGER trg_tasks_set_completed_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_task_completed_at();

-- 4) Speed up overdue detection & Rapot Karyawan queries
CREATE INDEX IF NOT EXISTS idx_tasks_overdue_lookup
  ON tasks(deadline, status)
  WHERE deleted_at IS NULL AND deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type_user
  ON notifications(type, user_id, created_at DESC);
