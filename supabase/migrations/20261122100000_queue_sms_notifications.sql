-- Migration: India SMS Notifications & Audit Logging
-- Adds sms_enabled and trigger preferences to businesses, creates sms_logs table with deduplication

-- 1. Ensure business settings columns exist
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS sms_trigger_on_join BOOLEAN DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS sms_trigger_near_turn BOOLEAN DEFAULT true;

-- 2. Create sms_logs table for audit trail, grant tracking, and send deduplication
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    token_id UUID REFERENCES public.queue_visitors(id) ON DELETE SET NULL,
    phone_masked TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'TOKEN_ISSUED', 'TURN_NEAR', 'NOW_SERVING', 'TEST'
    provider TEXT NOT NULL,   -- 'msg91', 'fast2sms', 'dry_run'
    status TEXT NOT NULL,     -- 'sent', 'simulated', 'failed', 'deduplicated', 'rate_limited'
    payload JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast deduplication lookup & daily rate limit calculation
CREATE INDEX IF NOT EXISTS idx_sms_logs_dedup ON public.sms_logs (token_id, event_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_business_created ON public.sms_logs (business_id, created_at);

-- 4. Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- 5. Business owners and admins can view SMS logs
CREATE POLICY "Business owners can view own sms logs" ON public.sms_logs
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Edge function / service role can insert & manage logs
CREATE POLICY "Service role can insert sms logs" ON public.sms_logs
    FOR INSERT
    WITH CHECK (true);
