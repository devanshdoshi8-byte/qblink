-- Migration: Remove demo data while strictly preserving all admin IDs, roles and real records

-- 1. Remove mock/demo businesses (cascades to their queues and demo sessions)
DELETE FROM public.businesses 
WHERE name ILIKE '%demo%' 
   OR name ILIKE 'Aroma Caf%' 
   OR name ILIKE 'Spice Garden%'
   OR name ILIKE 'Tandoor House%'
   OR name ILIKE 'Burger Republic%';

-- 2. Clean up any demo queue visitors or test visitor entries
DELETE FROM public.queue_visitors 
WHERE visitor_name ILIKE '%demo%'
   OR phone ILIKE '%demo%';

-- 3. Explicitly preserve administrator allowlist and user roles
COMMENT ON TABLE public.admin_emails IS 'Preserved administrator accounts allowlist (devanshdoshi8@gmail.com, etc.)';
