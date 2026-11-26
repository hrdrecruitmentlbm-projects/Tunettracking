-- Attendance alarm & reminder settings + dispatch log
-- Run in Supabase SQL Editor when deploying with Supabase

CREATE TABLE IF NOT EXISTS attendance_reminder_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT true,
  berangkat_time TEXT NOT NULL DEFAULT '08:00',
  pulang_time TEXT NOT NULL DEFAULT '17:00',
  grace_minutes INTEGER NOT NULL DEFAULT 0 CHECK (grace_minutes >= 0 AND grace_minutes <= 120),
  active_days INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5, 6],
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  telegram_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO attendance_reminder_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS attendance_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('berangkat', 'pulang')),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'telegram',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reminder_date, type, user_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_attendance_reminder_logs_date
  ON attendance_reminder_logs(reminder_date, type);
