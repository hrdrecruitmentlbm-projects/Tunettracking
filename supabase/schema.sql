-- TunetOps Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'noc', 'foc')),
  phone TEXT,
  telegram_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Priorities table
CREATE TABLE priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  level INTEGER NOT NULL,
  sla_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'assigned', 'in_progress', 'review', 'done')),
  priority_id UUID REFERENCES priorities(id),
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  location_name TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task tags junction table
CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Task history table
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Locations table (for real-time tracking)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL NOT NULL,
  lng DECIMAL NOT NULL,
  accuracy FLOAT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'status_update', 'overdue', 'completed')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);

-- Create spatial index for locations
CREATE INDEX idx_locations_coords ON locations USING GIST (ST_SetSRID(ST_MakePoint(lng, lat), 4326));

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - customize as needed)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "NOC can create tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "NOC can update tasks" ON tasks FOR UPDATE USING (true);

CREATE POLICY "Users can view all locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Users can insert own location" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own location" ON locations FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read priorities" ON priorities FOR SELECT USING (true);
CREATE POLICY "Anyone can read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "NOC can create task_tags" ON task_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view task_tags" ON task_tags FOR SELECT USING (true);

-- Function to find nearest FOC
CREATE OR REPLACE FUNCTION find_nearest_foc(
  target_lat DECIMAL,
  target_lng DECIMAL,
  max_distance_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography
    ) AS distance_meters
  FROM users u
  INNER JOIN locations l ON u.id = l.user_id
  WHERE u.role = 'foc'
    AND u.is_active = true
    AND ST_Distance(
      ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography
    ) <= max_distance_meters
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update task status and log history
CREATE OR REPLACE FUNCTION update_task_status(
  p_task_id UUID,
  p_new_status TEXT,
  p_performed_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_old_status TEXT;
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM users WHERE id = p_performed_by AND is_active = true;
  IF v_user_role IS NULL OR v_user_role NOT IN ('admin', 'noc') THEN
    RAISE EXCEPTION 'Permission denied: only admin and NOC can update task status';
  END IF;

  SELECT status INTO v_old_status FROM tasks WHERE id = p_task_id;

  UPDATE tasks
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO task_history (task_id, action, old_value, new_value, performed_by)
  VALUES (p_task_id, 'status_changed', jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_new_status), p_performed_by);
END;
$$ LANGUAGE plpgsql;

-- Insert default priorities
INSERT INTO priorities (name, color, level, sla_hours) VALUES
  ('Critical', '#EF4444', 1, 4),
  ('High', '#F97316', 2, 24),
  ('Medium', '#EAB308', 3, 72),
  ('Low', '#6B7280', 4, 168);

-- Insert default tags
INSERT INTO tags (name, color) VALUES
  ('Repair', '#EF4444'),
  ('Installation', '#3B82F6'),
  ('Maintenance', '#F59E0B'),
  ('Inspection', '#8B5CF6'),
  ('Upgrade', '#10B981');

-- Enable realtime for locations
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE locations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable realtime for tasks
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
