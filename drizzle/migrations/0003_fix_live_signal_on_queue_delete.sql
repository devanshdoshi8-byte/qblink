CREATE OR REPLACE FUNCTION public.emit_queue_live_signal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_queue_id uuid;
  v_event text;
BEGIN
  IF TG_TABLE_NAME = 'queues' THEN
    v_queue_id := COALESCE(NEW.id, OLD.id);
    v_event := 'queue_' || lower(TG_OP);
  ELSE
    v_queue_id := COALESCE(NEW.queue_id, OLD.queue_id);
    v_event := 'visitor_' || lower(TG_OP);
  END IF;

  -- Skip the signal when the queue no longer exists (e.g. business/queue delete cascades),
  -- otherwise the insert violates queue_live_signals_queue_id_fkey and blocks the delete.
  IF v_queue_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.queues WHERE id = v_queue_id) THEN
    INSERT INTO public.queue_live_signals (queue_id, event_type)
    VALUES (v_queue_id, v_event);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;