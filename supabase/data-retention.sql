-- =====================================================
-- TunetOps: Data Retention Policy
-- Run this AFTER all other migrations
-- Deletes location data older than 30 days
-- =====================================================

-- A) Create the cleanup function
--    This function deletes old location_pings, location_visits, and read notifications
CREATE OR REPLACE FUNCTION cleanup_old_location_data()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_cutoff_date DATE;
  v_pings_deleted BIGINT;
  v_visits_deleted BIGINT;
  v_notifications_deleted BIGINT;
BEGIN
  -- Calculate cutoff date (30 days ago)
  v_cutoff_date := CURRENT_DATE - INTERVAL '30 days';

  -- Delete old location_pings
  DELETE FROM location_pings
  WHERE session_date < v_cutoff_date;

  GET DIAGNOSTICS v_pings_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % location_pings older than %', v_pings_deleted, v_cutoff_date;

  -- Delete old location_visits
  DELETE FROM location_visits
  WHERE session_date < v_cutoff_date;

  GET DIAGNOSTICS v_visits_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % location_visits older than %', v_visits_deleted, v_cutoff_date;

  -- Delete old read notifications (keep unread ones)
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = true;

  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % old read notifications', v_notifications_deleted;

  -- Log the cleanup
  RAISE NOTICE 'Data retention cleanup completed. Cutoff date: %', v_cutoff_date;
END;
$$;

-- B) Create indexes for efficient date-based deletion
--    These indexes speed up the DELETE queries by allowing PostgreSQL to quickly find old rows

-- Index for location_pings cleanup (session_date is already in a composite index, but this is more efficient for bulk deletes)
CREATE INDEX IF NOT EXISTS idx_location_pings_session_date
  ON location_pings(session_date);

-- Index for location_visits cleanup
CREATE INDEX IF NOT EXISTS idx_location_visits_session_date
  ON location_visits(session_date);

-- Index for notifications cleanup (old read notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_created_read
  ON notifications(created_at, read)
  WHERE read = true;

-- C) Create a function to get storage stats (for monitoring)
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  oldest_record DATE,
  newest_record DATE
)
LANGUAGE sql
AS $$
  SELECT
    'location_pings'::TEXT,
    COUNT(*)::BIGINT,
    MIN(session_date),
    MAX(session_date)
  FROM location_pings
  UNION ALL
  SELECT
    'location_visits'::TEXT,
    COUNT(*)::BIGINT,
    MIN(session_date),
    MAX(session_date)
  FROM location_visits
  UNION ALL
  SELECT
    'notifications'::TEXT,
    COUNT(*)::BIGINT,
    MIN(created_at)::DATE,
    MAX(created_at)::DATE
  FROM notifications;
$$;

-- D) Create a function to manually run cleanup (for testing or emergency use)
CREATE OR REPLACE FUNCTION run_manual_cleanup(days_to_keep INT DEFAULT 30)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_cutoff_date DATE;
  v_pings_deleted BIGINT;
  v_visits_deleted BIGINT;
  v_notifications_deleted BIGINT;
  v_result TEXT;
BEGIN
  v_cutoff_date := CURRENT_DATE - (days_to_keep || ' days')::INTERVAL;

  DELETE FROM location_pings WHERE session_date < v_cutoff_date;
  GET DIAGNOSTICS v_pings_deleted = ROW_COUNT;

  DELETE FROM location_visits WHERE session_date < v_cutoff_date;
  GET DIAGNOSTICS v_visits_deleted = ROW_COUNT;

  DELETE FROM notifications
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND read = true;
  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;

  v_result := format(
    'Cleanup completed. Deleted: %s pings, %s visits, %s notifications (cutoff: %s)',
    v_pings_deleted, v_visits_deleted, v_notifications_deleted, v_cutoff_date
  );

  RAISE NOTICE '%', v_result;
  RETURN v_result;
END;
$$;

-- E) Set up pg_cron for automated daily cleanup
--    NOTE: pg_cron is only available on Supabase Pro plan ($25/month)
--    If you're on the free plan, you'll need to run this manually or use a cron service

-- Enable pg_cron extension (run this first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 3 AM UTC (10 AM WIB)
-- SELECT cron.schedule(
--   'cleanup-old-location-data',
--   '0 3 * * *',
--   $$SELECT cleanup_old_location_data()$$
-- );

-- F) Create a view for easy monitoring
CREATE OR REPLACE VIEW data_retention_status AS
SELECT
  'location_pings' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE session_date < CURRENT_DATE - INTERVAL '30 days') AS rows_to_delete,
  COUNT(*) FILTER (WHERE session_date >= CURRENT_DATE - INTERVAL '30 days') AS rows_to_keep,
  MIN(session_date) AS oldest_date,
  MAX(session_date) AS newest_date,
  pg_size_pretty(pg_total_relation_size('location_pings')) AS table_size
FROM location_pings
UNION ALL
SELECT
  'location_visits' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE session_date < CURRENT_DATE - INTERVAL '30 days') AS rows_to_delete,
  COUNT(*) FILTER (WHERE session_date >= CURRENT_DATE - INTERVAL '30 days') AS rows_to_keep,
  MIN(session_date) AS oldest_date,
  MAX(session_date) AS newest_date,
  pg_size_pretty(pg_total_relation_size('location_visits')) AS table_size
FROM location_visits
UNION ALL
SELECT
  'notifications' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days' AND read = true) AS rows_to_delete,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' OR read = false) AS rows_to_keep,
  MIN(created_at)::DATE AS oldest_date,
  MAX(created_at)::DATE AS newest_date,
  pg_size_pretty(pg_total_relation_size('notifications')) AS table_size
FROM notifications;
