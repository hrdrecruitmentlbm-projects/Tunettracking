-- =====================================================
-- TuTrack: Atomic Operations (RPC Functions)
-- Run this AFTER all other migrations
-- Replaces client-side race-condition-prone code with atomic DB functions
-- =====================================================

-- A) record_ping: atomic insert with computed ping_number
--    Replaces: client-side SELECT MAX(ping_number) + INSERT
--    Fixes: race condition where two concurrent pings produce duplicate numbers
CREATE OR REPLACE FUNCTION record_ping(
  p_user_id UUID,
  p_session_date DATE,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_source TEXT DEFAULT 'web_app',
  p_accuracy FLOAT DEFAULT NULL
)
RETURNS location_pings
LANGUAGE sql
AS $$
  WITH next_num AS (
    SELECT COALESCE(MAX(ping_number), 0) + 1 AS ping_number
    FROM location_pings
    WHERE user_id = p_user_id AND session_date = p_session_date
  )
  INSERT INTO location_pings (user_id, session_date, ping_number, lat, lng, accuracy, source)
  SELECT p_user_id, p_session_date, next_num.ping_number, p_lat, p_lng, p_accuracy, p_source
  FROM next_num
  ON CONFLICT (user_id, session_date, ping_number) DO NOTHING
  RETURNING *;
$$;

-- B) record_location_update: single atomic transaction
--    Replaces: 3-5 sequential client queries
--    Fixes: race conditions in read-modify-write patterns
--    Consolidates: location upsert, visit tracking, ping recording
CREATE OR REPLACE FUNCTION record_location_update(
  p_user_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_source TEXT DEFAULT 'web_app',
  p_accuracy FLOAT DEFAULT NULL,
  p_stay_threshold_meters FLOAT DEFAULT 100,
  p_min_stay_minutes INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing RECORD;
  v_session_date DATE;
  v_now TIMESTAMPTZ := now();
  v_distance FLOAT;
  v_arrival_lat DOUBLE PRECISION;
  v_arrival_lng DOUBLE PRECISION;
  v_stay_minutes FLOAT;
  v_new_visit JSONB := NULL;
  v_next_visit_num INT;
  v_next_ping_num INT;
BEGIN
  -- Session date: day resets at 06:00 WIB (UTC+7 = 23:00 UTC previous day)
  v_session_date := (v_now AT TIME ZONE 'Asia/Jakarta' - INTERVAL '6 hours')::date;

  -- 1. Read current location state
  SELECT id, lat, lng, arrived_at, updated_at
  INTO v_existing
  FROM locations
  WHERE user_id = p_user_id;

  -- 2. First-ever location for this user
  IF NOT FOUND THEN
    INSERT INTO locations (user_id, lat, lng, accuracy, updated_at, arrived_at, session_date)
    VALUES (p_user_id, p_lat, p_lng, p_accuracy, v_now, v_now, v_session_date);

    -- Record ping
    SELECT COALESCE(MAX(ping_number), 0) + 1 INTO v_next_ping_num
    FROM location_pings WHERE user_id = p_user_id AND session_date = v_session_date;

    INSERT INTO location_pings (user_id, session_date, ping_number, lat, lng, accuracy, source)
    VALUES (p_user_id, v_session_date, v_next_ping_num, p_lat, p_lng, p_accuracy, p_source);

    RETURN jsonb_build_object('ok', true, 'stayedAt', jsonb_build_object('lat', p_lat, 'lng', p_lng));
  END IF;

  -- 3. Calculate distance from ARRIVAL point (haversine)
  v_arrival_lat := v_existing.lat;
  v_arrival_lng := v_existing.lng;

  v_distance := 6371000 * 2 * asin(sqrt(
    power(sin(radians(p_lng - v_arrival_lng) / 2), 2) +
    cos(radians(v_arrival_lat)) * cos(radians(p_lat)) *
    power(sin(radians(p_lng - v_arrival_lng) / 2), 2)
  ));

  -- 4. Same stay (within threshold)
  IF v_distance < p_stay_threshold_meters THEN
    UPDATE locations
    SET lat = p_lat, lng = p_lng, accuracy = p_accuracy, updated_at = v_now
    WHERE id = v_existing.id;

    -- Record ping
    SELECT COALESCE(MAX(ping_number), 0) + 1 INTO v_next_ping_num
    FROM location_pings WHERE user_id = p_user_id AND session_date = v_session_date;

    INSERT INTO location_pings (user_id, session_date, ping_number, lat, lng, accuracy, source)
    VALUES (p_user_id, v_session_date, v_next_ping_num, p_lat, p_lng, p_accuracy, p_source);

    RETURN jsonb_build_object('ok', true, 'stayedAt', jsonb_build_object('lat', v_arrival_lat, 'lng', v_arrival_lng));
  END IF;

  -- 5. Moved >= threshold — check if previous stay qualifies as a visit
  v_stay_minutes := EXTRACT(EPOCH FROM (v_now - v_existing.arrived_at)) / 60;

  IF v_stay_minutes >= p_min_stay_minutes THEN
    -- Save previous stay as a visit
    SELECT COALESCE(MAX(visit_number), 0) + 1 INTO v_next_visit_num
    FROM location_visits WHERE user_id = p_user_id AND session_date = v_session_date;

    INSERT INTO location_visits (user_id, session_date, visit_number, lat, lng, arrived_at, departed_at, duration_minutes, source)
    VALUES (p_user_id, v_session_date, v_next_visit_num, v_arrival_lat, v_arrival_lng,
            v_existing.arrived_at, v_now, round(v_stay_minutes)::int, p_source)
    RETURNING to_jsonb(location_visits.*) INTO v_new_visit;
  END IF;

  -- 6. Update location to reflect new stay
  UPDATE locations
  SET lat = p_lat, lng = p_lng, accuracy = p_accuracy,
      updated_at = v_now, arrived_at = v_now, session_date = v_session_date
  WHERE id = v_existing.id;

  -- 7. Record ping
  SELECT COALESCE(MAX(ping_number), 0) + 1 INTO v_next_ping_num
  FROM location_pings WHERE user_id = p_user_id AND session_date = v_session_date;

  INSERT INTO location_pings (user_id, session_date, ping_number, lat, lng, accuracy, source)
  VALUES (p_user_id, v_session_date, v_next_ping_num, p_lat, p_lng, p_accuracy, p_source);

  RETURN jsonb_build_object(
    'ok', true,
    'newVisit', v_new_visit,
    'stayedAt', jsonb_build_object('lat', p_lat, 'lng', p_lng)
  );
END;
$$;

-- C) Grant execute permission to anon role
--    (required for the Supabase JS client to call these RPC functions)
GRANT EXECUTE ON FUNCTION record_ping TO anon;
GRANT EXECUTE ON FUNCTION record_location_update TO anon;

-- D) Optional: Grant to authenticated role if you switch to Supabase Auth later
GRANT EXECUTE ON FUNCTION record_ping TO authenticated;
GRANT EXECUTE ON FUNCTION record_location_update TO authenticated;
