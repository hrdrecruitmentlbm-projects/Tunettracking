-- TunetOps Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- Users (all PINs are 1234)
INSERT INTO users (id, pin, name, role, phone, telegram_id, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', '1234', 'Admin Tunet', 'admin', '+628123456789', NULL, true),
  ('22222222-2222-2222-2222-222222222222', '1234', 'Budi Santoso', 'noc', '+628123456790', NULL, true),
  ('33333333-3333-3333-3333-333333333333', '1234', 'Ahmad Fauzi', 'foc', '+628123456791', '@ahmadfauzi', true),
  ('44444444-4444-4444-4444-444444444444', '1234', 'Ali Rahman', 'foc', '+628123456792', '@alirahman', true),
  ('55555555-5555-5555-5555-555555555555', '1234', 'Siti Nurhaliza', 'foc', '+628123456793', NULL, true),
  ('66666666-6666-6666-6666-666666666666', '1234', 'Rizky Pratama', 'noc', '+628123456794', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Tasks (priority_id references the priorities table inserted by schema.sql)
INSERT INTO tasks (id, title, description, status, priority_id, created_by, assigned_to, location_name, location_lat, location_lng, deadline) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tower Repair - Jl. Merdeka', 'Cable is damaged after storm. Need to replace main cable and check connection stability.', 'in_progress', (SELECT id FROM priorities WHERE name = 'Critical'), '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Jl. Merdeka No. 45, Kota Bandung', -6.9175, 107.6191, '2026-06-13T18:00:00Z'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fiber Installation - Perumahan Griya', 'New fiber optic installation for residential complex. 50 households to connect.', 'assigned', (SELECT id FROM priorities WHERE name = 'High'), '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Perumahan Griya Asri, Bandung Utara', -6.8853, 107.6132, '2026-06-15T18:00:00Z'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Network Check - Kantor Pusat', 'Routine network stability check at head office. Check all access points and switches.', 'todo', (SELECT id FROM priorities WHERE name = 'Medium'), '22222222-2222-2222-2222-222222222222', NULL, 'Jl. Gatot Subroto No. 28, Bandung', -6.9059, 107.6131, NULL),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cable Check - Gang Sari', 'Customer reported intermittent connection. Check cable integrity and signal strength.', 'review', (SELECT id FROM priorities WHERE name = 'Medium'), '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Gang Sari No. 12, Kota Bandung', -6.9214, 107.6089, NULL),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Router Upgrade - Cafe Kopi', 'Upgrade router to support higher bandwidth for cafe POS system.', 'done', (SELECT id FROM priorities WHERE name = 'Low'), '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Jl. Dago No. 55, Bandung', -6.8821, 107.6172, NULL),
  ('aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Antenna Alignment - Tower Cibiru', 'Antenna misaligned after high winds. Recalibrate to optimal angle.', 'todo', (SELECT id FROM priorities WHERE name = 'High'), '22222222-2222-2222-2222-222222222222', NULL, 'Tower Cibiru, Bandung Timur', -6.9385, 107.7215, NULL)
ON CONFLICT (id) DO NOTHING;

-- Task tags
INSERT INTO task_tags (task_id, tag_id) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM tags WHERE name = 'Repair')),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM tags WHERE name = 'Installation')),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM tags WHERE name = 'Inspection')),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM tags WHERE name = 'Repair')),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM tags WHERE name = 'Upgrade')),
  ('aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM tags WHERE name = 'Maintenance'))
ON CONFLICT DO NOTHING;

-- Locations (FOC users in Bandung area)
INSERT INTO locations (user_id, lat, lng, accuracy) VALUES
  ('33333333-3333-3333-3333-333333333333', -6.9185, 107.6195, 10),
  ('44444444-4444-4444-4444-444444444444', -6.8860, 107.6140, 15),
  ('55555555-5555-5555-5555-555555555555', -6.9220, 107.6095, 8)
ON CONFLICT DO NOTHING;
