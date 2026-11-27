-- Auto-reactivate paused queues when a customer scans a QR code and joins,
-- while still blocking closed queues.

CREATE OR REPLACE FUNCTION public.join_queue(
  p_queue_id uuid,
  p_visitor_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_party_size integer DEFAULT NULL
)
RETURNS TABLE(id uuid, token_number integer, assigned_table_size integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status text; v_type text; v_table_config jsonb;
  v_token int; v_id uuid; v_name text; v_phone text; v_assigned int;
  v_dup_protect boolean; v_cooldown int; v_hit boolean;
BEGIN
  v_name := NULLIF(btrim(coalesce(p_visitor_name, '')), '');
  v_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_name IS NOT NULL AND length(v_name) > 100 THEN RAISE EXCEPTION 'name too long'; END IF;
  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN RAISE EXCEPTION 'phone too long'; END IF;

  SELECT q.status, q.next_token, q.queue_type, q.table_config,
         q.duplicate_protection, q.join_cooldown_minutes
    INTO v_status, v_token, v_type, v_table_config, v_dup_protect, v_cooldown
  FROM public.queues q WHERE q.id = p_queue_id FOR UPDATE;

  IF v_status IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_status = 'closed' THEN RAISE EXCEPTION 'queue is closed'; END IF;

  IF v_status = 'paused' THEN
    UPDATE public.queues SET status = 'active', updated_at = now() WHERE id = p_queue_id;
    v_status := 'active';
  END IF;

  IF v_status <> 'active' THEN RAISE EXCEPTION 'queue not active'; END IF;
  IF v_token IS NULL THEN v_token := 1; END IF;

  IF COALESCE(v_dup_protect, true) AND v_phone IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = p_queue_id AND phone = v_phone
        AND status IN ('waiting','checked_in','called','serving')
    ) INTO v_hit;
    IF v_hit THEN RAISE EXCEPTION 'You are already in this queue.'; END IF;
  END IF;

  IF COALESCE(v_cooldown, 0) > 0 AND v_phone IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = p_queue_id AND phone = v_phone
        AND joined_at > now() - (v_cooldown || ' minutes')::interval
    ) INTO v_hit;
    IF v_hit THEN RAISE EXCEPTION 'Please wait before rejoining this queue.'; END IF;
  END IF;

  IF v_type = 'restaurant' THEN
    IF p_party_size IS NULL OR p_party_size < 1 THEN RAISE EXCEPTION 'party size required'; END IF;
    SELECT (elem->>'seats')::int INTO v_assigned
    FROM jsonb_array_elements(COALESCE(v_table_config, '[]'::jsonb)) elem
    WHERE (elem->>'seats')::int >= p_party_size
      AND COALESCE((elem->>'count')::int, 0) > 0
    ORDER BY (elem->>'seats')::int ASC LIMIT 1;
    IF v_assigned IS NULL THEN RAISE EXCEPTION 'no suitable table for party size %', p_party_size; END IF;
  END IF;

  UPDATE public.queues q SET next_token = v_token + 1, updated_at = now() WHERE q.id = p_queue_id;

  INSERT INTO public.queue_visitors (queue_id, token_number, visitor_name, phone, party_size, assigned_table_size)
  VALUES (p_queue_id, v_token, v_name, v_phone, p_party_size, v_assigned)
  RETURNING queue_visitors.id INTO v_id;

  PERFORM public.log_queue_activity(p_queue_id, v_id, 'joined', 'customer', '{}'::jsonb);

  id := v_id; token_number := v_token; assigned_table_size := v_assigned;
  RETURN NEXT;
END;
$$;
