-- Migration to track user acceptance of Terms and Privacy Policy
CREATE TABLE IF NOT EXISTS public.compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    terms_version TEXT NOT NULL,
    privacy_version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grant access
GRANT SELECT, INSERT ON public.compliance_logs TO authenticated;
GRANT ALL ON public.compliance_logs TO service_role;

-- Enable RLS
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own compliance logs"
ON public.compliance_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own compliance logs"
ON public.compliance_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
