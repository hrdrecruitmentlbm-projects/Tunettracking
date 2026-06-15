-- TunetOps Seed Data
-- Run this AFTER schema.sql + notifications.sql in Supabase SQL Editor
--
-- IMPORTANT: User accounts are NOT seeded here.
-- They are created and managed from the web app (POST /api/users or admin UI).
-- This file only seeds:
--   1. Lookup data (priorities, tags)
--   2. (Optional) test telegram_chat_id for any FOC users you've already created

-- =====================================================
-- 1. Lookup data: priorities
-- =====================================================
INSERT INTO priorities (name, color, level, sla_hours) VALUES
  ('Critical', '#EF4444', 1, 4),
  ('High',      '#F97316', 2, 24),
  ('Medium',    '#EAB308', 3, 72),
  ('Low',       '#6B7280', 4, 168)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. Lookup data: tags
-- =====================================================
INSERT INTO tags (name, color) VALUES
  ('Repair',       '#EF4444'),
  ('Installation','#3B82F6'),
  ('Maintenance',  '#F59E0B'),
  ('Inspection',   '#8B5CF6'),
  ('Upgrade',      '#10B981')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. Telegram chat IDs for existing FOC users
-- =====================================================
-- To enable Telegram notifications for a FOC:
--   1. Have them open Telegram and message your bot (e.g., @TunetOpsNotifier)
--   2. They send /start to the bot
--   3. They (or you) grab their chat_id from @userinfobot
--   4. Run an UPDATE like the one below
--
-- Until then, leave telegram_chat_id NULL — tasks will still create notification
-- rows in the database, but no Telegram message will be sent (safe fallback).
--
-- Example for the user you created via the web app:
-- UPDATE users SET telegram_chat_id = 7729492232 WHERE name = 'HRD Test' AND pin = '1256';
