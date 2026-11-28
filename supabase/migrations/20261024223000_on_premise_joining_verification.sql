-- Function to validate on-premise presence without persisting customer coordinates
CREATE OR REPLACE FUNCTION public.verify_on_premise_entry(
  p_queue_id uuid,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_counter_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_biz public.businesses;
  v_queue public.queues;
  v_on_premise jsonb;
  v_enabled boolean;
  v_radius int;
  v_biz_lat double precision;
  v_biz_lon double precision;
  v_code text;
  v_dist double precision;
  v_clean_code text;
BEGIN
  -- 1. Fetch queue and business
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id;
  IF v_queue.id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Queue not found');
  END IF;

  SELECT * INTO v_biz FROM public.businesses WHERE id = v_queue.business_id;
  IF v_biz.id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Business not found');
  END IF;

  -- 2. If remote joining is ON, on-premise check is bypassed completely
  IF COALESCE(v_biz.remote_joining_enabled, true) THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'remote_allowed');
  END IF;

  -- 3. Extract on_premise_joining configuration from business settings
  v_on_premise := v_biz.settings->'on_premise_joining';
  v_enabled := COALESCE((v_on_premise->>'enabled')::boolean, false);

  -- If business has not enabled on-premise verification while remote joining is OFF,
  -- then in-person only means no digital join.
  IF NOT v_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'remote_disabled');
  END IF;

  v_radius := COALESCE((v_on_premise->>'radius_meters')::int, 250);
  v_biz_lat := (v_on_premise->>'latitude')::double precision;
  v_biz_lon := (v_on_premise->>'longitude')::double precision;
  v_code := btrim(COALESCE(v_on_premise->>'counter_code', ''));

  -- 4. Check Counter Code fallback first if supplied
  IF p_counter_code IS NOT NULL AND btrim(p_counter_code) <> '' THEN
    v_clean_code := btrim(p_counter_code);
    IF v_code <> '' AND lower(v_clean_code) = lower(v_code) THEN
      RETURN jsonb_build_object('allowed', true, 'verified_by', 'counter_code');
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_counter_code', 'message', 'Incorrect counter code. Please check the screen at reception.');
    END IF;
  END IF;

  -- 5. Check GPS coordinates if supplied and business has set its coordinates
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL AND v_biz_lat IS NOT NULL AND v_biz_lon IS NOT NULL THEN
    -- Haversine formula in meters (approx earth radius = 6371000m)
    v_dist := 6371000 * 2 * asin(sqrt(
      power(sin(radians(p_latitude - v_biz_lat) / 2), 2) +
      cos(radians(v_biz_lat)) * cos(radians(p_latitude)) *
      power(sin(radians(p_longitude - v_biz_lon) / 2), 2)
    ));

    IF v_dist <= v_radius THEN
      RETURN jsonb_build_object('allowed', true, 'verified_by', 'geofence', 'distance_meters', round(v_dist));
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'outside_radius', 'distance_meters', round(v_dist), 'radius_meters', v_radius);
    END IF;
  END IF;

  -- 6. Neither valid GPS nor Counter Code provided
  RETURN jsonb_build_object('allowed', false, 'reason', 'verification_required');
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_on_premise_entry(uuid, double precision, double precision, text) TO anon, authenticated, service_role;
