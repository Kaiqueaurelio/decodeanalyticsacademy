REVOKE ALL ON FUNCTION public.get_email_for_ra(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_email_for_ra(text) TO postgres;