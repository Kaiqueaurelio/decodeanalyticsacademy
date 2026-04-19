CREATE OR REPLACE FUNCTION public.get_email_for_ra(_ra text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE upper(p.ra) = upper(_ra)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO anon, authenticated;