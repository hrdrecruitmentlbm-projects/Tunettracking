-- Prospect status labels (admin-managed via Settings page)
-- Run this in Supabase SQL Editor AFTER marketing-tables.sql
--
-- Makes Prospek statuses dynamic: admins can add/rename/recolor/delete
-- labels from Settings > Label Status Prospek. Prospect rows store the
-- stable `key`, so renaming a label never breaks history.

CREATE TABLE IF NOT EXISTS prospect_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_deletable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the four original statuses (is_deletable = false protects them)
INSERT INTO prospect_statuses (key, label, color, sort_order, is_deletable) VALUES
  ('belum_diproses', 'Belum Diproses', '#6B7280', 10, false),
  ('sudah_followup', 'Sudah di Followup', '#3B82F6', 20, false),
  ('acc', 'Acc', '#10B981', 30, false),
  ('tidak', 'Tidak', '#EF4444', 40, false)
ON CONFLICT (key) DO NOTHING;

GRANT ALL ON prospect_statuses TO anon;
GRANT ALL ON prospect_statuses TO authenticated;

-- Allow custom statuses on prospects (the fixed 4-value CHECK would
-- reject any label added from Settings)
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
