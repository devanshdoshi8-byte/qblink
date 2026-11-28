-- Migration: 20261118120000_automated_daily_queue_reset.sql
-- Automated midnight / daily queue reset with business timezone support

-- 1. Ensure queue_visitors allows all operational statuses (fixes queue_visitors_status_check error)
ALTER TABLE public.queue_visitors
  DROP CONSTRAINT IF EXISTS queue_visitors_status_check;

ALTER TABLE public.queue_visitors
  ADD CONSTRAINT queue_visitors_status_check
  CHECK (status IN ('waiting', 'checked_in', 'called', 'serving', 'served', 'skipped', 'removed', 'no_show', 'cancelled'));

-- 2. Add last_reset_at to queues table if not already present
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS last_reset_at timestamptz NOT NULL DEFAULT now();

-- 2. Core internal reset procedure (callable by system or authenticated owners)
CREATE OR REPLACE FUNCTION public.perform_queue_reset_internal(p_queue_id uuid)
RETURNS public.queue_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_started_at timestamptz;
  v_session public.queue_sessions;
  v_total_joined int := 0;
  v_total_served int := 0;
  v_total_skipped int := 0;
  v_total_removed int := 0;
  v_total_no_show int := 0;
  v_avg_wait numeric := 0;
  v_peak_hour int;
  v_cur_token int := 0;
BEGIN
  -- Lock the queue row
  SELECT q.business_id, COALESCE(q.current_token, 0)
    INTO v_business_id, v_cur_token
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'queue not found';
  END IF;

  -- Mark still-active visitors (waiting, called) as no-show
  UPDATE public.queue_visitors
    SET status = 'no_show'
    WHERE queue_id = p_queue_id
      AND session_id IS NULL
      AND status IN ('waiting', 'called');

  -- Aggregate this session's unarchived visitors
  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'served'),
    count(*) FILTER (WHERE status = 'skipped'),
    count(*) FILTER (WHERE status = 'removed'),
    count(*) FILTER (WHERE status = 'no_show'),
    COALESCE(AVG(EXTRACT(EPOCH FROM (served_at - joined_at)) / 60.0)
             FILTER (WHERE status = 'served' AND served_at IS NOT NULL), 0),
    MIN(joined_at)
  INTO v_total_joined, v_total_served, v_total_skipped, v_total_removed, v_total_no_show, v_avg_wait, v_started_at
  FROM public.queue_visitors
  WHERE queue_id = p_queue_id AND session_id IS NULL;

  -- If there were visitors, or if tokens were issued, create an archive session
  IF v_total_joined > 0 OR v_cur_token > 0 THEN
    SELECT EXTRACT(HOUR FROM joined_at)::int
      INTO v_peak_hour
    FROM public.queue_visitors
    WHERE queue_id = p_queue_id AND session_id IS NULL
    GROUP BY EXTRACT(HOUR FROM joined_at)
    ORDER BY count(*) DESC
    LIMIT 1;

    INSERT INTO public.queue_sessions (
      queue_id, business_id, started_at, ended_at,
      total_joined, total_served, total_skipped, total_removed, total_no_show,
      avg_wait_minutes, peak_hour
    ) VALUES (
      p_queue_id, v_business_id, COALESCE(v_started_at, now()), now(),
      v_total_joined, v_total_served, v_total_skipped, v_total_removed, v_total_no_show,
      ROUND(v_avg_wait, 2), v_peak_hour
    ) RETURNING * INTO v_session;

    -- Tag visitors with this session
    UPDATE public.queue_visitors
      SET session_id = v_session.id
      WHERE queue_id = p_queue_id AND session_id IS NULL;
  END IF;

  -- Reset live queue state for the new day
  UPDATE public.queues
    SET current_token = 0,
        next_token = 1,
        status = 'active',
        last_reset_at = now(),
        updated_at = now()
    WHERE id = p_queue_id;

  -- Log the reset event
  PERFORM public.log_queue_activity(
    p_queue_id,
    NULL,
    'reset_new_day',
    'system',
    jsonb_build_object('total_archived', v_total_joined, 'session_id', v_session.id)
  );

  -- Broadcast real-time signal so connected dashboards and client tickets refresh
  BEGIN
    INSERT INTO public.queue_live_signals (queue_id, event_type)
    VALUES (p_queue_id, 'reset_new_day');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if signal table is busy or constrained
    NULL;
  END;

  RETURN v_session;
END;
$$;

-- 3. Owner-callable wrapper with strict authorization check
CREATE OR REPLACE FUNCTION public.reset_queue_for_new_day(p_queue_id uuid)
RETURNS public.queue_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT b.owner_id INTO v_owner
  FROM public.queues q
  JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'queue not found';
  END IF;

  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN public.perform_queue_reset_internal(p_queue_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.perform_queue_reset_internal(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_queue_for_new_day(uuid) TO authenticated;

-- 4. Check and auto-reset a single queue (useful on client load or background sweep)
CREATE OR REPLACE FUNCTION public.check_and_auto_reset_queue(p_queue_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue record;
  v_biz record;
  v_tz text := 'Asia/Kolkata';
  v_reset_time text := '00:00';
  v_enabled boolean := true;
  v_reset_hour int := 0;
  v_reset_minute int := 0;
  v_local_now timestamp;
  v_local_last_reset timestamp;
  v_cutoff_today timestamp;
  v_due boolean := false;
  v_session public.queue_sessions;
BEGIN
  SELECT q.id, q.business_id, q.last_reset_at, q.current_token, q.status
    INTO v_queue
  FROM public.queues q
  WHERE q.id = p_queue_id;

  IF v_queue.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'queue_not_found');
  END IF;

  SELECT b.id, b.settings, b.owner_id
    INTO v_biz
  FROM public.businesses b
  WHERE b.id = v_queue.business_id;

  -- Extract daily_reset configuration with safe defaults
  IF v_biz.settings ? 'daily_reset' THEN
    v_enabled := COALESCE((v_biz.settings->'daily_reset'->>'enabled')::boolean, true);
    v_tz := COALESCE(NULLIF(v_biz.settings->'daily_reset'->>'timezone', ''), 'Asia/Kolkata');
    v_reset_time := COALESCE(NULLIF(v_biz.settings->'daily_reset'->>'time', ''), '00:00');
  END IF;

  IF NOT v_enabled THEN
    RETURN jsonb_build_object('ok', true, 'reset', false, 'reason', 'disabled');
  END IF;

  -- Parse reset hour/minute (default 00:00)
  BEGIN
    v_reset_hour := split_part(v_reset_time, ':', 1)::int;
    v_reset_minute := split_part(v_reset_time, ':', 2)::int;
  EXCEPTION WHEN OTHERS THEN
    v_reset_hour := 0;
    v_reset_minute := 0;
  END;

  -- Calculate local timestamps in business timezone
  BEGIN
    v_local_now := (now() AT TIME ZONE v_tz);
    v_local_last_reset := (COALESCE(v_queue.last_reset_at, now() - interval '1 day') AT TIME ZONE v_tz);
  EXCEPTION WHEN OTHERS THEN
    -- If timezone string was invalid, fallback to UTC
    v_tz := 'UTC';
    v_local_now := (now() AT TIME ZONE 'UTC');
    v_local_last_reset := (COALESCE(v_queue.last_reset_at, now() - interval '1 day') AT TIME ZONE 'UTC');
  END;

  -- Today's reset cutoff time
  v_cutoff_today := date_trunc('day', v_local_now) + (v_reset_hour || ' hours')::interval + (v_reset_minute || ' minutes')::interval;

  -- Queue is due if:
  -- 1) Local time has crossed today's cutoff, AND
  -- 2) The last reset happened before today's cutoff
  IF v_local_now >= v_cutoff_today AND v_local_last_reset < v_cutoff_today THEN
    v_due := true;
  -- Or if last reset is more than 24 hours in the past
  ELSIF v_local_now - v_local_last_reset >= interval '24 hours' THEN
    v_due := true;
  END IF;

  IF v_due THEN
    v_session := public.perform_queue_reset_internal(p_queue_id);
    RETURN jsonb_build_object(
      'ok', true,
      'reset', true,
      'timezone', v_tz,
      'reset_at', now(),
      'session_id', v_session.id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'reset', false,
    'reason', 'not_due',
    'timezone', v_tz,
    'next_cutoff', v_cutoff_today
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_auto_reset_queue(uuid) TO anon, authenticated, service_role;

-- 5. Global sweep function that checks all active queues
CREATE OR REPLACE FUNCTION public.auto_reset_stale_queues()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count int := 0;
  v_result jsonb;
BEGIN
  FOR r IN
    SELECT q.id
    FROM public.queues q
    JOIN public.businesses b ON b.id = q.business_id
    WHERE q.status = 'active'
  LOOP
    BEGIN
      v_result := public.check_and_auto_reset_queue(r.id);
      IF (v_result->>'reset')::boolean = true THEN
        v_count := v_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Continue processing other queues if one has an issue
      NULL;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_reset_stale_queues() TO authenticated, service_role;

-- 6. Schedule with pg_cron if available (runs every 15 minutes to catch local midnight across all timezones)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      -- Unschedule prior job if existing to avoid duplicates
      PERFORM cron.unschedule('qblink-nightly-queue-reset');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    BEGIN
      PERFORM cron.schedule(
        'qblink-nightly-queue-reset',
        '*/15 * * * *',
        $$SELECT public.auto_reset_stale_queues();$$
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;
