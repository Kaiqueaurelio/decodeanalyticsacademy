-- Restore full content visibility for administrative/RA accounts.
-- Student scopes remain unchanged.
CREATE OR REPLACE FUNCTION public.get_content_scope(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN account_type IN ('admin', 'ra') THEN 'full'
    ELSE COALESCE(content_scope, 'full')
  END
  FROM public.profiles
  WHERE user_id = _user_id
$$;

REVOKE ALL ON FUNCTION public.get_content_scope(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_content_scope(uuid) TO authenticated;
