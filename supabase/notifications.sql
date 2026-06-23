-- =====================================================
-- TuTrack: Notifications + Telegram + Reassignment
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- =====================================================

-- A) Schema additions
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS telegram_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- A.1) RLS: this app uses custom PIN auth (not Supabase Auth), so
--      auth.uid() is always NULL and the default SELECT policy blocks
--      the client-side fetchNotifications() query in useTelegramDispatch.
--      Disable RLS on notifications — the app filters by user_id in code.
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- B) Enable realtime for notifications
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- C) Atomic claim RPC (prevents duplicate sends from multiple browser tabs)
CREATE OR REPLACE FUNCTION claim_notification(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notifications
  SET telegram_sent_at = now()
  WHERE id = p_notification_id AND telegram_sent_at IS NULL;
  RETURN FOUND;
END;
$$;

-- D) Trigger: notify FOC when a task is created with an assignee
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_priority_name TEXT;
  v_deadline_text TEXT;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_priority_name FROM priorities WHERE id = NEW.priority_id;

  v_deadline_text := CASE
    WHEN NEW.deadline IS NOT NULL
    THEN to_char(NEW.deadline AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY, HH24:MI')
    ELSE 'No deadline'
  END;

  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.assigned_to,
    'task_assigned',
    'New Task Assigned',
    format(
      '%s priority task: %s at %s. Deadline: %s.',
      COALESCE(v_priority_name, 'Medium'),
      NEW.title,
      NEW.location_name,
      v_deadline_text
    ),
    jsonb_build_object(
      'task_id', NEW.id,
      'title', NEW.title,
      'description', NEW.description,
      'priority', LOWER(COALESCE(v_priority_name, 'medium')),
      'location_name', NEW.location_name,
      'location_lat', NEW.location_lat,
      'location_lng', NEW.location_lng,
      'deadline', NEW.deadline,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_assigned ON tasks;
CREATE TRIGGER trg_task_assigned
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_assigned();

-- E) Trigger: handle reassignment (new FOC + old FOC)
--    GUARD: Only fire when assigned_to actually changes between two non-NULL values.
--    Status-only updates (e.g. "Start Work") must NOT trigger this.
CREATE OR REPLACE FUNCTION notify_task_reassigned()
RETURNS TRIGGER AS $$
DECLARE
  v_priority_name TEXT;
BEGIN
  -- Bail if assigned_to did not change (status-only update, deadline change, etc.)
  IF NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to THEN
    RETURN NEW;
  END IF;
  -- Bail if either side is NULL (initial assignment or un-assignment)
  IF NEW.assigned_to IS NULL OR OLD.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_priority_name FROM priorities WHERE id = NEW.priority_id;

  -- New assignee
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.assigned_to,
    'task_assigned',
    'New Task Assigned',
    format(
      'You have been assigned: %s (%s) at %s.',
      NEW.title,
      COALESCE(v_priority_name, 'Medium'),
      NEW.location_name
    ),
    jsonb_build_object(
      'task_id', NEW.id,
      'title', NEW.title,
      'priority', LOWER(COALESCE(v_priority_name, 'medium')),
      'location_name', NEW.location_name,
      'deadline', NEW.deadline,
      'status', NEW.status
    )
  );

  -- Old assignee
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    OLD.assigned_to,
    'status_update',
    'Penanggung jawab telah diganti',
    format(
      'Task "%s" at %s has been reassigned to another technician.',
      NEW.title,
      NEW.location_name
    ),
    jsonb_build_object(
      'task_id', NEW.id,
      'title', NEW.title,
      'previous_assignee', OLD.assigned_to,
      'new_assignee', NEW.assigned_to
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_reassigned ON tasks;
CREATE TRIGGER trg_task_reassigned
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_reassigned();

-- F) Backfill: populate metadata->>'status' for notifications created
--    before the status field was added to the trigger.
UPDATE notifications n
SET metadata = COALESCE(n.metadata, '{}'::jsonb) || jsonb_build_object('status', t.status)
FROM tasks t
WHERE n.metadata->>'task_id' = t.id::text
  AND n.metadata->>'status' IS NULL;
