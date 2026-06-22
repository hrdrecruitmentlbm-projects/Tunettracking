-- =====================================================
-- TunetOps: Attendance Feature
-- Run this AFTER schema.sql and data-retention.sql
-- Tracks daily Berangkat / Pulang check-in/out per employee
-- Records are auto-deleted after 60 days via cleanup route
-- =====================================================

-- A) Create the attendance table
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('berangkat', 'pulang')),
  timestamp timestamptz not null default now(),
  attendance_date date not null,
  location_lat double precision,
  location_lng double precision,
  notes text,
  created_at timestamptz not null default now()
);

-- B) Unique constraint: one Berangkat + one Pulang per user per WIB date
create unique index if not exists attendance_user_date_type_idx
  on public.attendance (user_id, attendance_date, type);

-- C) Index for efficient per-user history queries (newest first)
create index if not exists attendance_user_date_idx
  on public.attendance (user_id, attendance_date desc);

-- D) Index for efficient admin date-range queries
create index if not exists attendance_date_idx
  on public.attendance (attendance_date desc);

-- E) Row Level Security
--    The app uses custom PIN-based auth (not Supabase Auth), so auth.uid()
--    is always NULL when connecting with the anon key. All writes/reads go
--    through API routes using the service-role client (supabaseAdmin) which
--    bypasses RLS. Policies below remain as defense-in-depth in case anyone
--    connects with the anon key directly — they would simply see 0 rows
--    and be unable to insert.
alter table public.attendance enable row level security;

-- Users can read their own attendance
drop policy if exists "users can read own attendance" on public.attendance;
create policy "users can read own attendance"
  on public.attendance for select
  using (auth.uid() = user_id);

-- Users can insert their own attendance
drop policy if exists "users can insert own attendance" on public.attendance;
create policy "users can insert own attendance"
  on public.attendance for insert
  with check (auth.uid() = user_id);

-- Admins can read all attendance
drop policy if exists "admins can read all attendance" on public.attendance;
create policy "admins can read all attendance"
  on public.attendance for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin' and is_active = true
    )
  );

-- F) Cleanup function: delete attendance older than 60 days
-- Called from /api/cleanup route. Idempotent — safe to run daily.
create or replace function cleanup_old_attendance()
returns bigint
language plpgsql
as $$
declare
  v_cutoff_date date;
  v_deleted bigint;
begin
  v_cutoff_date := current_date - interval '60 days';

  delete from public.attendance
  where attendance_date < v_cutoff_date;

  get diagnostics v_deleted = row_count;
  raise notice 'Deleted % attendance records older than %', v_deleted, v_cutoff_date;

  return v_deleted;
end;
$$;

-- G) Helper function: return current attendance_date in Asia/Jakarta (WIB)
-- Used by the API to enforce one Berangkat/Pulang per day regardless of
-- the user's device timezone.
create or replace function attendance_today_jakarta()
returns date
language sql
immutable
as $$
  select (now() at time zone 'Asia/Jakarta')::date;
$$;
