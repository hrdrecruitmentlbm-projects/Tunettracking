-- =====================================================
-- TuTrack: Attendance Photo (Google Drive)
-- Run this AFTER attendance.sql
-- Adds photo_file_id column to store Google Drive file IDs
-- =====================================================

-- A) Add photo column (nullable — photo required only for berangkat)
alter table public.attendance add column if not exists photo_file_id text;

-- B) Grant update privilege to service_role (for photo_file_id updates)
grant update on public.attendance to service_role;
