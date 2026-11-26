-- Pengaturan global interval pelacakan GPS karyawan lapangan (dalam menit).
-- Jalankan di Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS location_tracking_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  interval_minutes INTEGER NOT NULL DEFAULT 2 CHECK (interval_minutes >= 1 AND interval_minutes <= 60),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO location_tracking_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON location_tracking_settings TO anon, authenticated, service_role;
