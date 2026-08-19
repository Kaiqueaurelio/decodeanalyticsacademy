-- Public job discovery without exposing application links before authentication.
-- The public RPC deliberately omits application_link and created_by.

CREATE OR REPLACE FUNCTION public.get_public_jobs()
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT,
  type public.job_type,
  salary_range TEXT,
  is_active BOOLEAN,
  published_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id,
    j.title,
    j.company_name,
    j.company_logo_url,
    j.description,
    j.requirements,
    j.location,
    j.type,
    j.salary_range,
    j.is_active,
    j.published_at
  FROM public.jobs AS j
  WHERE j.is_active = true
  ORDER BY j.published_at DESC NULLS LAST, j.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_public_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_jobs() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_jobs() IS
  'Returns active job listings for public discovery without exposing application links before authentication.';
