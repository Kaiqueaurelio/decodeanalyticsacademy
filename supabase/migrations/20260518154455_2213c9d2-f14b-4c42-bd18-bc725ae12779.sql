
CREATE OR REPLACE FUNCTION public.get_student_rankings(_limit integer DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  ra text,
  avatar_url text,
  total integer,
  hits integer,
  errors integer,
  accuracy numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    p.ra,
    p.avatar_url,
    COUNT(a.id)::int AS total,
    COUNT(a.id) FILTER (WHERE a.is_correct)::int AS hits,
    COUNT(a.id) FILTER (WHERE NOT a.is_correct)::int AS errors,
    CASE WHEN COUNT(a.id) > 0
      THEN ROUND((COUNT(a.id) FILTER (WHERE a.is_correct)::numeric / COUNT(a.id)::numeric) * 100, 1)
      ELSE 0
    END AS accuracy
  FROM public.profiles p
  LEFT JOIN public.answers a ON a.user_id = p.user_id
  GROUP BY p.user_id, p.full_name, p.ra, p.avatar_url
  HAVING COUNT(a.id) > 0
  ORDER BY hits DESC, accuracy DESC
  LIMIT _limit;
END;
$$;
