-- Safe, PII-free platform-wide aggregate counters for the public homepage showcase.
-- Returns ONLY platform-wide totals (no business IDs, queue IDs, names, or visitor rows),
-- excluding demo/test businesses from public counters.

CREATE OR REPLACE FUNCTION public.get_public_platform_metrics()
RETURNS TABLE (
  total_tokens bigint,
  served_tokens bigint,
  live_businesses bigint,
  completion_rate integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint := 0;
  v_served bigint := 0;
  v_dropped bigint := 0;
  v_businesses bigint := 0;
  v_finished bigint := 0;
  v_rate integer := 88;
BEGIN
  SELECT COUNT(*)
  INTO v_businesses
  FROM public.businesses b
  WHERE COALESCE(btrim(b.name), '') <> ''
    AND lower(b.name) !~ '\mdemo\M';

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE qv.status = 'served'),
    COUNT(*) FILTER (WHERE qv.status IN ('skipped', 'removed', 'no_show'))
  INTO v_total, v_served, v_dropped
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE lower(b.name) !~ '\mdemo\M'
    AND lower(q.name) !~ '\mdemo\M';

  v_finished := v_served + v_dropped;
  IF v_finished > 0 THEN
    v_rate := GREATEST(0, LEAST(100, ROUND((v_served::numeric / v_finished::numeric) * 100)::integer));
  END IF;

  RETURN QUERY SELECT v_total, v_served, v_businesses, v_rate;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_metrics() TO anon, authenticated, service_role;
