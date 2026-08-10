CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    ip_address text NOT NULL,
    attempts integer DEFAULT 0,
    last_attempt timestamp with time zone DEFAULT now(),
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_attempts TO service_role;
GRANT SELECT ON public.auth_attempts TO authenticated;

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.auth_attempts;
CREATE POLICY "Service role full access" ON public.auth_attempts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS auth_attempts_identifier_idx ON public.auth_attempts (identifier);
CREATE UNIQUE INDEX IF NOT EXISTS auth_attempts_ip_idx ON public.auth_attempts (ip_address);

CREATE OR REPLACE FUNCTION public.get_email_for_ra(_ra text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _email text;
BEGIN
    SELECT email INTO _email FROM public.profiles WHERE ra = _ra LIMIT 1;
    RETURN _email;
END;
$$;