-- Migration: 20261118120500_fix_queue_visitors_status_check.sql
-- Fix queue_visitors_status_check constraint to permit all operational statuses including 'no_show', 'checked_in', and 'cancelled'

ALTER TABLE public.queue_visitors
  DROP CONSTRAINT IF EXISTS queue_visitors_status_check;

ALTER TABLE public.queue_visitors
  ADD CONSTRAINT queue_visitors_status_check
  CHECK (status IN ('waiting', 'checked_in', 'called', 'serving', 'served', 'skipped', 'removed', 'no_show', 'cancelled'));
