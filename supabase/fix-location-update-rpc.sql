-- =====================================================
-- TunetOps: Fix record_location_update RPC
-- 1. Remove internal ping inserts — pings are now created
--    exclusively by the explicit recordPing() call in the webhook.
--    This consolidates to ONE ping creation path, eliminating
--    the "one silently dropped by ON CONFLICT" confusion.
-- 2. Fix visit session_date — derive from arrived_at instead of now(),
--    so cross-midnight stays are attributed to the day the user
--    actually arrived.
-- =====================================================

CREATE OR REPLACE FUNCTION record_location_update(
  p_user_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_source TEXT DEFAULT 'web_app',
  p_accuracy DOUBLE PRECISION DEFAULT NULL,
  p_stay_threshold_meters DOUBLE PRECISION DEFAULT 100,
  p_min_stay_minutes INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing RECORD;
  v_session_date DATE;
  v_visit_session_date DATE;
  v_now TIMESTAMPTZ := now();
  v_distance FLOAT;
  v_arrival_lat DOUBLE PRECISION;
  v_arrival_lng DOUBLE PRECISION;
  v_stay_minutes FLOAT;
  v_new_visit JSONB := NULL;
  v_next_visit_num INT;
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

    RETURN jsonb_build_object('ok', true, 'stayedAt', jsonb_build_object('lat', v_arrival_lat, 'lng', v_arrival_lng));
  END IF;

  -- 5. Moved >= threshold — check if previous stay qualifies as a visit
  v_stay_minutes := EXTRACT(EPOCH FROM (v_now - v_existing.arrived_at)) / 60;

  IF v_stay_minutes >= p_min_stay_minutes THEN
    -- Save previous stay as a visit
    -- Derive visit session_date from arrived_at (not now), so cross-midnight
    -- stays are attributed to the day the user actually arrived.
    v_visit_session_date := (v_existing.arrived_at AT TIME ZONE 'Asia/Jakarta' - INTERVAL '6 hours')::date;

    SELECT COALESCE(MAX(visit_number), 0) + 1 INTO v_next_visit_num
    FROM location_visits WHERE user_id = p_user_id AND session_date = v_visit_session_date;

    INSERT INTO location_visits (user_id, session_date, visit_number, lat, lng, arrived_at, departed_at, duration_minutes, source)
    VALUES (p_user_id, v_visit_session_date, v_next_visit_num, v_arrival_lat, v_arrival_lng,
            v_existing.arrived_at, v_now, round(v_stay_minutes)::int, p_source)
    RETURNING to_jsonb(location_visits.*) INTO v_new_visit;
  END IF;

  -- 6. Update location to reflect new stay
  UPDATE locations
  SET lat = p_lat, lng = p_lng, accuracy = p_accuracy,
      updated_at = v_now, arrived_at = v_now, session_date = v_session_date
  WHERE id = v_existing.id;

  RETURN jsonb_build_object(
    'ok', true,
    'newVisit', v_new_visit,
    'stayedAt', jsonb_build_object('lat', p_lat, 'lng', p_lng)
  );
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION record_location_update TO anon;
GRANT EXECUTE ON FUNCTION record_location_update TO authenticated;
