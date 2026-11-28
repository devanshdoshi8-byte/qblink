CREATE OR REPLACE FUNCTION public.join_customer_queue(p_queue_id uuid, p_visitor_name text DEFAULT NULL, p_phone text DEFAULT NULL, p_party_size integer DEFAULT NULL)
RETURNS TABLE(id uuid, token_number integer, child_queue_id uuid, table_size integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_queue public.queues;
  v_visit uuid;
  v_token integer;
  v_child uuid;
  v_size integer;
  v_phone_norm text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Please sign in to join with your account.'; END IF;
  SELECT * INTO v_queue FROM public.queues q WHERE q.id = p_queue_id FOR UPDATE;
  IF v_queue.id IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_queue.status <> 'active' THEN RAISE EXCEPTION 'queue not active'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.queue_visitors v JOIN public.queues q ON q.id = v.queue_id
    WHERE v.customer_user_id = v_user AND (q.id = p_queue_id OR q.parent_queue_id = p_queue_id)
      AND v.status IN ('waiting','checked_in','called','serving')
  ) THEN RAISE EXCEPTION 'You are already in this queue.'; END IF;
  IF COALESCE(v_queue.join_cooldown_minutes, 0) > 0 AND EXISTS (
    SELECT 1 FROM public.queue_visitors v JOIN public.queues q ON q.id = v.queue_id
    WHERE v.customer_user_id = v_user AND (q.id = p_queue_id OR q.parent_queue_id = p_queue_id)
      AND v.joined_at > now() - make_interval(mins => v_queue.join_cooldown_minutes)
  ) THEN RAISE EXCEPTION 'Please wait before rejoining this queue.'; END IF;

  -- Adopt an existing active guest visit with the same phone number instead of
  -- failing on the phone-based duplicate check inside join_queue. This covers
  -- the guest -> signed-in transition: the customer keeps their token and the
  -- visit becomes visible in their profile.
  v_phone_norm := ltrim(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '0');
  IF v_phone_norm <> '' THEN
    SELECT v.id, v.token_number, v.queue_id, q.table_size
      INTO v_visit, v_token, v_child, v_size
    FROM public.queue_visitors v
    JOIN public.queues q ON q.id = v.queue_id
    WHERE v.customer_user_id IS NULL
      AND (q.id = p_queue_id OR q.parent_queue_id = p_queue_id)
      AND v.status IN ('waiting','checked_in','called','serving')
      AND ltrim(regexp_replace(coalesce(v.phone, ''), '\D', '', 'g'), '0') = v_phone_norm
    ORDER BY v.joined_at DESC
    LIMIT 1;
    IF v_visit IS NOT NULL THEN
      UPDATE public.queue_visitors v SET customer_user_id = v_user WHERE v.id = v_visit;
      RETURN QUERY SELECT v_visit, v_token, v_child, v_size;
      RETURN;
    END IF;
  END IF;

  IF v_queue.queue_type = 'restaurant' AND v_queue.parent_queue_id IS NULL THEN
    SELECT r.id, r.token_number, r.child_queue_id, r.table_size INTO v_visit, v_token, v_child, v_size
    FROM public.join_restaurant_queue(p_queue_id, p_party_size, p_visitor_name, p_phone) r;
  ELSE
    SELECT r.id, r.token_number, r.assigned_table_size INTO v_visit, v_token, v_size
    FROM public.join_queue(p_queue_id, p_visitor_name, p_phone, p_party_size) r;
    v_child := p_queue_id;
  END IF;
  UPDATE public.queue_visitors v SET customer_user_id = v_user WHERE v.id = v_visit;
  RETURN QUERY SELECT v_visit, v_token, v_child, v_size;
END;
$$;
REVOKE ALL ON FUNCTION public.join_customer_queue(uuid,text,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_customer_queue(uuid,text,text,integer) TO authenticated, service_role;

-- One-time repair: link Devansh's existing active guest visit (token 49) to his account.
UPDATE public.queue_visitors
SET customer_user_id = '9887b61c-f87f-4693-8db9-427e3fbf5735'
WHERE id = '6ee46d63-2608-4d0e-b49e-bfdeae5309bc' AND customer_user_id IS NULL;