-- Finance role ("Admin Keuangan") — presence-only role for finance staff.
-- Run this in Supabase SQL Editor BEFORE deploying the UI changes that allow
-- creating finance users, otherwise user creation fails the CHECK constraint.
-- Mirrors the marketing role migration in marketing-tables.sql.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'noc', 'foc', 'marketing', 'finance'));
