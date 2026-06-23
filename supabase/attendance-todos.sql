-- =====================================================
-- TunetOps: Attendance To-Do List
-- Run this AFTER attendance.sql
-- Stores daily to-do items recorded at clock-in time
-- =====================================================

-- A) Create the attendance_todos table
create table if not exists public.attendance_todos (
  id            uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendance(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  title         text not null,
  created_at    timestamptz not null default now()
);

-- B) Indexes for efficient queries
create index if not exists idx_attendance_todos_attendance_id
  on public.attendance_todos (attendance_id);

create index if not exists idx_attendance_todos_user_id_date
  on public.attendance_todos (user_id, created_at desc);

-- C) Row Level Security
--    Same pattern as attendance table: app uses PIN auth (auth.uid() is NULL),
--    all reads/writes go through API routes using supabaseAdmin (service-role).
--    Policies remain as defense-in-depth.
alter table public.attendance_todos enable row level security;

-- Users can read their own todos
drop policy if exists "users can read own attendance_todos" on public.attendance_todos;
create policy "users can read own attendance_todos"
  on public.attendance_todos for select
  using (auth.uid() = user_id);

-- Users can insert their own todos
drop policy if exists "users can insert own attendance_todos" on public.attendance_todos;
create policy "users can insert own attendance_todos"
  on public.attendance_todos for insert
  with check (auth.uid() = user_id);

-- Admins can read all todos
drop policy if exists "admins can read all attendance_todos" on public.attendance_todos;
create policy "admins can read all attendance_todos"
  on public.attendance_todos for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin' and is_active = true
    )
  );

-- D) Service-role grants (required for supabaseAdmin access)
grant select, insert, delete on public.attendance_todos to service_role;
