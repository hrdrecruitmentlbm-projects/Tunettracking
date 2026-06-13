-- Full cleanup: delete all data and re-seed
-- Run this in Supabase SQL Editor, then run seed.sql

-- Clear all data (order matters due to foreign keys)
DELETE FROM task_tags;
DELETE FROM task_history;
DELETE FROM notifications;
DELETE FROM locations;
DELETE FROM tasks;
DELETE FROM users;

-- Verify clean state
SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'locations', COUNT(*) FROM locations;
