CREATE OR REPLACE FUNCTION public.get_public_leaderboard(_limit integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  xp_points integer,
  level integer,
  full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ux.user_id,
    ux.xp_points,
    ux.level,
    COALESCE(NULLIF(p.full_name, ''), 'Aluno') AS full_name
  FROM public.user_xp ux
  LEFT JOIN public.profiles p ON p.user_id = ux.user_id
  ORDER BY ux.xp_points DESC, ux.updated_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 10), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.get_public_leaderboard(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard(integer) TO authenticated;