-- Hardening: make administrative audit events server-authored.
-- The old INSERT policy let an authenticated admin forge admin_id/action/target_user_id.

DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_audit_logs;
REVOKE INSERT ON public.admin_audit_logs FROM authenticated;

CREATE OR REPLACE FUNCTION public.log_admin_audit(
  _action text,
  _target_user_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin authorization required';
  END IF;

  IF _action IS NULL OR length(btrim(_action)) = 0 OR length(_action) > 120 THEN
    RAISE EXCEPTION 'invalid audit action';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    btrim(_action),
    _target_user_id,
    CASE WHEN jsonb_typeof(_details) = 'object' THEN _details ELSE '{}'::jsonb END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_audit(text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_audit(text, uuid, jsonb) TO authenticated;
