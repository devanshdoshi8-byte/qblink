CREATE OR REPLACE FUNCTION public.get_active_pickup_count(p_business_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT CASE
    WHEN b.owner_id = (select auth.uid())
      OR (select public.is_admin())
      OR b.show_live_queue_info
    THEN (
      SELECT count(*)::int
      FROM public.pickup_orders o
      WHERE o.business_id = b.id
        AND o.status IN ('received','preparing','almost_ready')
    )
    ELSE NULL
  END
  FROM public.businesses b
  WHERE b.id = p_business_id
$function$;

REVOKE ALL ON FUNCTION public.get_active_pickup_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_pickup_count(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_queue_activity(p_queue_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, action text, token_number integer, actor text, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT l.id, l.action, l.token_number, l.actor, l.created_at
  FROM public.queue_activity_log l
  JOIN public.queues q ON q.id = l.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE l.queue_id = p_queue_id
    AND (b.show_live_queue_info OR b.owner_id = (select auth.uid()) OR (select public.is_admin()))
    AND l.created_at > now() - interval '12 hours'
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 20)
$function$;

REVOKE ALL ON FUNCTION public.get_public_queue_activity(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_queue_activity(uuid, integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_queue_pulse(p_queue_id uuid)
RETURNS TABLE(waiting integer, joined_today integer, served_today integer, avg_wait_minutes numeric, avg_service_minutes numeric, reliability_pct numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_visible boolean;
  v_waiting int := 0;
  v_joined int := 0;
  v_served int := 0;
  v_lost int := 0;
  v_wait numeric;
  v_service numeric;
BEGIN
  SELECT b.show_live_queue_info OR b.owner_id = (select auth.uid()) OR (select public.is_admin())
    INTO v_visible
  FROM public.queues q
  JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id;

  IF COALESCE(v_visible, false) IS NOT TRUE THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE qv.status IN ('waiting','checked_in')),
    COUNT(*) FILTER (WHERE (qv.joined_at AT TIME ZONE 'utc')::date = v_today),
    COUNT(*) FILTER (WHERE qv.status = 'served' AND (qv.served_at AT TIME ZONE 'utc')::date = v_today),
    COUNT(*) FILTER (WHERE qv.status IN ('no_show','skipped','removed') AND (qv.joined_at AT TIME ZONE 'utc')::date = v_today),
    AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.joined_at))/60.0)
      FILTER (WHERE qv.status = 'served' AND qv.served_at IS NOT NULL AND (qv.served_at AT TIME ZONE 'utc')::date = v_today),
    AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.called_at))/60.0)
      FILTER (WHERE qv.status = 'served' AND qv.served_at IS NOT NULL AND qv.called_at IS NOT NULL
              AND qv.served_at > qv.called_at AND (qv.served_at AT TIME ZONE 'utc')::date = v_today)
  INTO v_waiting, v_joined, v_served, v_lost, v_wait, v_service
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id;

  waiting := COALESCE(v_waiting, 0);
  joined_today := COALESCE(v_joined, 0);
  served_today := COALESCE(v_served, 0);
  avg_wait_minutes := CASE WHEN v_wait IS NULL THEN NULL ELSE ROUND(v_wait::numeric, 1) END;
  avg_service_minutes := CASE WHEN v_service IS NULL THEN NULL ELSE ROUND(v_service::numeric, 1) END;
  reliability_pct := CASE
    WHEN (v_served + v_lost) >= 5 THEN ROUND((v_served::numeric / (v_served + v_lost)) * 100, 0)
    ELSE NULL END;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_queue_pulse(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_queue_pulse(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_queue_forecast(p_queue_id uuid, p_day_of_week integer DEFAULT NULL::integer)
RETURNS TABLE(hour integer, day_of_week integer, avg_joins numeric, avg_wait_minutes numeric, no_show_rate numeric, sample_count integer, total_sample integer, distinct_days integer, confidence numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_dow int;
  v_total int;
  v_days int;
  v_visible boolean;
BEGIN
  SELECT b.show_live_queue_info OR b.owner_id = (select auth.uid()) OR (select public.is_admin())
    INTO v_visible
  FROM public.queues q
  JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id;

  IF COALESCE(v_visible, false) IS NOT TRUE THEN
    RETURN;
  END IF;

  v_dow := COALESCE(p_day_of_week, EXTRACT(DOW FROM (now() AT TIME ZONE 'UTC'))::int);

  SELECT COUNT(*), COUNT(DISTINCT (qv.joined_at AT TIME ZONE 'UTC')::date)
    INTO v_total, v_days
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id
    AND qv.joined_at > now() - interval '60 days'
    AND EXTRACT(DOW FROM (qv.joined_at AT TIME ZONE 'UTC'))::int = v_dow;

  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(0, 23) AS h
  ),
  per_day AS (
    SELECT
      EXTRACT(HOUR FROM (qv.joined_at AT TIME ZONE 'UTC'))::int AS h,
      (qv.joined_at AT TIME ZONE 'UTC')::date AS d,
      COUNT(*) AS joins,
      AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.joined_at)) / 60.0)
        FILTER (WHERE qv.status = 'served' AND qv.served_at IS NOT NULL) AS wait_min,
      AVG(CASE WHEN qv.status = 'no_show' THEN 1.0 ELSE 0.0 END) AS no_show
    FROM public.queue_visitors qv
    WHERE qv.queue_id = p_queue_id
      AND qv.joined_at > now() - interval '60 days'
      AND EXTRACT(DOW FROM (qv.joined_at AT TIME ZONE 'UTC'))::int = v_dow
    GROUP BY 1, 2
  ),
  agg AS (
    SELECT
      h.h AS hour,
      COALESCE(AVG(pd.joins), 0)::numeric AS avg_joins,
      COALESCE(AVG(pd.wait_min), 0)::numeric AS avg_wait_minutes,
      COALESCE(AVG(pd.no_show), 0)::numeric AS no_show_rate,
      COALESCE(SUM(pd.joins), 0)::int AS sample_count
    FROM hours h
    LEFT JOIN per_day pd ON pd.h = h.h
    GROUP BY h.h
  )
  SELECT
    a.hour,
    v_dow,
    ROUND(a.avg_joins, 2),
    ROUND(a.avg_wait_minutes, 2),
    ROUND(a.no_show_rate, 3),
    a.sample_count,
    COALESCE(v_total, 0),
    COALESCE(v_days, 0),
    LEAST(1.0, (COALESCE(v_days, 0)::numeric / 6.0))::numeric AS confidence
  FROM agg a
  ORDER BY a.hour;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_queue_forecast(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_forecast(uuid, integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_pickup_order(p_order_id uuid)
RETURNS TABLE(id uuid, business_id uuid, token text, items jsonb, notes text, status text, eta_minutes integer, created_at timestamp with time zone, ready_at timestamp with time zone, picked_up_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT o.id, o.business_id, o.token, o.items, o.notes, o.status, o.eta_minutes, o.created_at, o.ready_at, o.picked_up_at
  FROM public.pickup_orders o
  JOIN public.businesses b ON b.id = o.business_id
  WHERE o.id = p_order_id
    AND (
      o.customer_user_id = (select auth.uid())
      OR b.owner_id = (select auth.uid())
      OR (select public.is_admin())
    )
$function$;

REVOKE ALL ON FUNCTION public.get_pickup_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pickup_order(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins manage all queue_sessions" ON public.queue_sessions;
DROP POLICY IF EXISTS "Owners can manage their queue_sessions" ON public.queue_sessions;
DROP POLICY IF EXISTS "Owners can view their queue_sessions" ON public.queue_sessions;
CREATE POLICY "Owners and admins can view queue_sessions"
  ON public.queue_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = queue_sessions.business_id
        AND b.owner_id = (select auth.uid())
    )
    OR (select public.is_admin())
  );
REVOKE ALL ON public.queue_sessions FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.queue_sessions FROM authenticated;
GRANT SELECT ON public.queue_sessions TO authenticated;
GRANT ALL ON public.queue_sessions TO service_role;

DROP POLICY IF EXISTS "Admins manage all health history" ON public.queue_health_daily;
DROP POLICY IF EXISTS "Owners manage their health history" ON public.queue_health_daily;
CREATE POLICY "Owners and admins can view health history"
  ON public.queue_health_daily FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = queue_health_daily.business_id
        AND b.owner_id = (select auth.uid())
    )
    OR (select public.is_admin())
  );
REVOKE ALL ON public.queue_health_daily FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.queue_health_daily FROM authenticated;
GRANT SELECT ON public.queue_health_daily TO authenticated;
GRANT ALL ON public.queue_health_daily TO service_role;

CREATE OR REPLACE FUNCTION public.mark_no_show(p_visitor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_queue uuid; v_owner uuid;
BEGIN
  SELECT qv.queue_id, b.owner_id INTO v_queue, v_owner
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE qv.id = p_visitor_id FOR UPDATE;
  IF v_queue IS NULL THEN RAISE EXCEPTION 'visitor not found'; END IF;
  IF v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.queue_visitors SET status = 'no_show' WHERE id = p_visitor_id;
  PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'no_show', 'business', '{}'::jsonb);
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_no_show(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_no_show(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.recall_visitor(p_visitor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_queue uuid; v_owner uuid; v_status text;
BEGIN
  SELECT qv.queue_id, b.owner_id, qv.status INTO v_queue, v_owner, v_status
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE qv.id = p_visitor_id FOR UPDATE;
  IF v_queue IS NULL THEN RAISE EXCEPTION 'visitor not found'; END IF;
  IF v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF v_status NOT IN ('skipped','no_show') THEN RAISE EXCEPTION 'visitor cannot be recalled'; END IF;
  UPDATE public.queue_visitors
    SET status = 'waiting', called_at = NULL, checked_in_at = NULL
    WHERE id = p_visitor_id;
  PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'recalled', 'business', '{}'::jsonb);
END;
$function$;

REVOKE ALL ON FUNCTION public.recall_visitor(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recall_visitor(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.run_queue_integrity_sweep(p_queue_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_owner uuid; v_arr int; v_exp int; v_count int := 0; r record;
BEGIN
  SELECT b.owner_id, q.arrival_window_minutes, q.auto_expire_minutes
    INTO v_owner, v_arr, v_exp
  FROM public.queues q JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id;
  IF v_owner IS NULL THEN RETURN 0; END IF;
  IF v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;

  IF COALESCE(v_arr, 0) > 0 THEN
    FOR r IN
      SELECT id FROM public.queue_visitors
      WHERE queue_id = p_queue_id
        AND status = 'called'
        AND checked_in_at IS NULL
        AND called_at IS NOT NULL
        AND called_at < now() - (v_arr || ' minutes')::interval
    LOOP
      UPDATE public.queue_visitors SET status = 'no_show' WHERE id = r.id;
      PERFORM public.log_queue_activity(p_queue_id, r.id, 'no_show', 'system',
        jsonb_build_object('reason','arrival_window_expired','window_minutes', v_arr));
      v_count := v_count + 1;
    END LOOP;
  END IF;

  IF COALESCE(v_exp, 0) > 0 THEN
    FOR r IN
      SELECT id FROM public.queue_visitors
      WHERE queue_id = p_queue_id
        AND status = 'waiting'
        AND joined_at < now() - (v_exp || ' minutes')::interval
    LOOP
      UPDATE public.queue_visitors SET status = 'removed' WHERE id = r.id;
      PERFORM public.log_queue_activity(p_queue_id, r.id, 'cancelled', 'system',
        jsonb_build_object('reason','auto_expired','expire_minutes', v_exp));
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.run_queue_integrity_sweep(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_queue_integrity_sweep(uuid) TO authenticated, service_role;