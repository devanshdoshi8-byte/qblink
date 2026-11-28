-- Owners cannot set promotion / moderation fields on their own businesses.
CREATE OR REPLACE FUNCTION public.protect_business_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_sponsored := false;
    NEW.is_featured := false;
    NEW.is_recommended := false;
    NEW.display_rank := 0;
  ELSE
    NEW.is_sponsored := OLD.is_sponsored;
    NEW.is_featured := OLD.is_featured;
    NEW.is_recommended := OLD.is_recommended;
    NEW.display_rank := OLD.display_rank;
    NEW.approval_status := OLD.approval_status;
    NEW.verification_status := OLD.verification_status;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_protect_business_admin_fields ON public.businesses;
CREATE TRIGGER tg_protect_business_admin_fields
BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.protect_business_admin_fields();

-- System settings are admin-only (admin policy already covers reads).
DROP POLICY IF EXISTS "system_settings public read" ON public.system_settings;

-- Pickup orders: guests may order, but cannot attach another user's id.
DROP POLICY IF EXISTS "Anyone can create pickup orders" ON public.pickup_orders;
CREATE POLICY "Anyone can create pickup orders" ON public.pickup_orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  (customer_user_id IS NULL OR customer_user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id)
);