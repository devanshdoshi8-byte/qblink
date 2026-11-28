-- Security Hardening Migration: RLS & RPC Isolation
-- 1. Restrict perform_queue_reset_internal(uuid) and auto_reset_stale_queues() to service_role
REVOKE ALL ON FUNCTION public.perform_queue_reset_internal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.perform_queue_reset_internal(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.auto_reset_stale_queues() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_reset_stale_queues() TO service_role;

-- 2. Restrict log_queue_activity to internal/service_role only (called by SECURITY DEFINER RPCs)
REVOKE ALL ON FUNCTION public.log_queue_activity(uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_queue_activity(uuid, uuid, text, text, jsonb) TO service_role;

-- 3. Harden check_in_visitor(uuid):
--    If the visitor row is bound to an authenticated user_id, only that user,
--    the business owner, or an admin may check them in.
CREATE OR REPLACE FUNCTION public.check_in_visitor(p_visitor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue uuid;
  v_status text;
  v_already boolean;
  v_visitor_user_id uuid;
  v_owner uuid;
BEGIN
  SELECT qv.queue_id, qv.status, (qv.checked_in_at IS NOT NULL), qv.user_id, b.owner_id
    INTO v_queue, v_status, v_already, v_visitor_user_id, v_owner
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE qv.id = p_visitor_id
  FOR UPDATE OF qv;

  IF v_queue IS NULL THEN
    RAISE EXCEPTION 'visitor not found';
  END IF;

  IF v_visitor_user_id IS NOT NULL THEN
    IF auth.uid() IS DISTINCT FROM v_visitor_user_id
       AND auth.uid() IS DISTINCT FROM v_owner
       AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'not authorized';
    END IF;
  END IF;

  IF v_status NOT IN ('waiting', 'called', 'checked_in') THEN
    RETURN;
  END IF;

  UPDATE public.queue_visitors
    SET status = CASE WHEN status = 'waiting' THEN 'checked_in' ELSE status END,
        checked_in_at = COALESCE(checked_in_at, now())
    WHERE id = p_visitor_id;

  IF NOT v_already THEN
    PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'checked_in', 'customer', '{}'::jsonb);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_visitor(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_visitor(uuid) TO anon, authenticated, service_role;

-- 4. Ensure get_queue_health(uuid, integer) is restricted to authenticated + service_role
REVOKE ALL ON FUNCTION public.get_queue_health(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_queue_health(uuid, integer) TO authenticated, service_role;

-- 5. Restrict sync_restaurant_child_queues(uuid) to internal/service_role (triggers & SECURITY DEFINER RPCs)
REVOKE ALL ON FUNCTION public.sync_restaurant_child_queues(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_restaurant_child_queues(uuid) TO service_role;

-- 6. Tighten sms_logs INSERT policy to service_role only
DROP POLICY IF EXISTS "Service role can insert sms logs" ON public.sms_logs;
CREATE POLICY "Service role can insert sms logs"
  ON public.sms_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 7. Tighten pickup_orders INSERT policy to authenticated users inserting their own orders
DROP POLICY IF EXISTS "Anyone can create pickup orders" ON public.pickup_orders;
CREATE POLICY "Authenticated users can create own pickup orders"
  ON public.pickup_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND customer_user_id = auth.uid()
    AND status = 'received'
    AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id)
  );

-- 8. Harden verify_on_premise_entry: do not leak exact distance_meters or radius_meters
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
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id;
  IF v_queue.id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Queue not found');
  END IF;

  SELECT * INTO v_biz FROM public.businesses WHERE id = v_queue.business_id;
  IF v_biz.id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Business not found');
  END IF;

  IF COALESCE(v_biz.remote_joining_enabled, true) THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'remote_allowed');
  END IF;

  v_on_premise := v_biz.settings->'on_premise_joining';
  v_enabled := COALESCE((v_on_premise->>'enabled')::boolean, false);

  IF NOT v_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'remote_disabled');
  END IF;

  v_radius := COALESCE((v_on_premise->>'radius_meters')::int, 250);
  v_biz_lat := (v_on_premise->>'latitude')::double precision;
  v_biz_lon := (v_on_premise->>'longitude')::double precision;
  v_code := btrim(COALESCE(v_on_premise->>'counter_code', ''));

  IF p_counter_code IS NOT NULL AND btrim(p_counter_code) <> '' THEN
    v_clean_code := btrim(p_counter_code);
    IF v_code <> '' AND lower(v_clean_code) = lower(v_code) THEN
      RETURN jsonb_build_object('allowed', true, 'verified_by', 'counter_code');
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_counter_code', 'message', 'Incorrect counter code. Please check the screen at reception.');
    END IF;
  END IF;

  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL AND v_biz_lat IS NOT NULL AND v_biz_lon IS NOT NULL THEN
    v_dist := 6371000 * 2 * asin(sqrt(
      power(sin(radians(p_latitude - v_biz_lat) / 2), 2) +
      cos(radians(v_biz_lat)) * cos(radians(p_latitude)) *
      power(sin(radians(p_longitude - v_biz_lon) / 2), 2)
    ));

    IF v_dist <= v_radius THEN
      RETURN jsonb_build_object('allowed', true, 'verified_by', 'geofence');
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'outside_radius', 'message', 'You appear to be outside the allowed premise radius.');
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', false, 'reason', 'verification_required');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_on_premise_entry(uuid, double precision, double precision, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_on_premise_entry(uuid, double precision, double precision, text) TO anon, authenticated, service_role;

-- 9. Protect public.businesses from exposing counter_code & internal settings to anon
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'businesses'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.businesses;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.businesses_public AS
SELECT
  b.id,
  b.name,
  b.category,
  b.description,
  b.address,
  b.operating_hours,
  b.remote_joining_enabled,
  b.show_live_queue_info,
  b.discovery_enabled,
  b.is_featured,
  b.is_recommended,
  b.is_sponsored,
  b.display_rank,
  b.logo_url,
  b.rating,
  b.total_reviews,
  b.created_at,
  CASE
    WHEN b.settings IS NULL THEN NULL
    WHEN b.settings ? 'on_premise_joining' THEN
      jsonb_set(
        b.settings,
        '{on_premise_joining}',
        (b.settings->'on_premise_joining') - 'counter_code',
        true
      )
    ELSE b.settings
  END AS settings
FROM public.businesses b;

GRANT SELECT ON public.businesses_public TO anon, authenticated, service_role;
