CREATE TABLE public.ella_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id text NOT NULL,
  user_id uuid NOT NULL,
  user_role text NOT NULL,
  content_scope text NOT NULL DEFAULT 'full',
  tool_name text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed boolean NOT NULL,
  denial_reason text,
  outcome text NOT NULL DEFAULT 'unknown',
  result_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ella_audit_log TO authenticated;
GRANT ALL ON public.ella_audit_log TO service_role;

ALTER TABLE public.ella_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ella audit log"
ON public.ella_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ella_audit_log_created_at ON public.ella_audit_log (created_at DESC);
CREATE INDEX idx_ella_audit_log_user ON public.ella_audit_log (user_id, created_at DESC);