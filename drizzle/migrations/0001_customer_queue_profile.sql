ALTER TABLE public.queue_visitors ADD COLUMN customer_user_id uuid;
COMMENT ON COLUMN public.queue_visitors.customer_user_id IS 'Authenticated customer identity captured atomically by join_customer_queue. Legacy and guest visits remain unlinked; never infer identity from phone.';
CREATE INDEX queue_visitors_customer_history_idx ON public.queue_visitors (customer_user_id, joined_at DESC) WHERE customer_user_id IS NOT NULL;

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

CREATE OR REPLACE FUNCTION public.get_my_queue_visits(p_history boolean DEFAULT false, p_offset integer DEFAULT 0)
RETURNS TABLE(visitor_id uuid, queue_id uuid, join_queue_id uuid, business_name text, counter_name text, token_number integer, status text, joined_at timestamptz, served_at timestamptz, party_size integer, table_size integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in to view your queues.'; END IF;
  RETURN QUERY
    SELECT v.id, q.id, COALESCE(q.parent_queue_id, q.id), b.name, COALESCE(parent.name, q.name), v.token_number, v.status, v.joined_at, v.served_at, v.party_size, q.table_size
    FROM public.queue_visitors v
    JOIN public.queues q ON q.id = v.queue_id
    JOIN public.businesses b ON b.id = q.business_id
    LEFT JOIN public.queues parent ON parent.id = q.parent_queue_id
    WHERE v.customer_user_id = auth.uid()
      AND ((NOT p_history AND v.status IN ('waiting','checked_in','called','serving'))
        OR (p_history AND v.status NOT IN ('waiting','checked_in','called','serving')))
    ORDER BY v.joined_at DESC, v.id
    LIMIT CASE WHEN p_history THEN 25 ELSE NULL END
    OFFSET CASE WHEN p_history THEN greatest(0, p_offset) ELSE 0 END;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_queue_visits(boolean,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_queue_visits(boolean,integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.leave_my_queue(p_visitor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_visit public.queue_visitors;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in to leave your queue.'; END IF;
  SELECT * INTO v_visit FROM public.queue_visitors v
    WHERE v.id = p_visitor_id AND v.customer_user_id = auth.uid() FOR UPDATE;
  IF v_visit.id IS NULL THEN RAISE EXCEPTION 'This visit is not available for your account.'; END IF;
  IF v_visit.status = 'removed' THEN RETURN; END IF;
  IF v_visit.status NOT IN ('waiting','checked_in','called','serving') THEN
    RAISE EXCEPTION 'This visit has already ended.';
  END IF;
  UPDATE public.queue_visitors SET status = 'removed' WHERE queue_visitors.id = p_visitor_id;
  PERFORM public.log_queue_activity(v_visit.queue_id, v_visit.id, 'cancelled', 'customer', jsonb_build_object('source','customer_profile'));
END;
$$;
REVOKE ALL ON FUNCTION public.leave_my_queue(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_my_queue(uuid) TO authenticated, service_role;