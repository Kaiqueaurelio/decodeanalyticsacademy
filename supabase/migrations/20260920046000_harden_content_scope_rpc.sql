-- Content scope is user authorization state. Do not expose it to anonymous
-- callers or allow signed-in users to inspect another account's scope.
CREATE OR REPLACE FUNCTION public.get_content_scope(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  IF _user_id <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT CASE
      WHEN account_type IN ('admin', 'ra') THEN 'full'
      ELSE COALESCE(content_scope, 'full')
    END
    FROM public.profiles
    WHERE user_id = _user_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_content_scope(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_content_scope(uuid) TO authenticated, service_role;
