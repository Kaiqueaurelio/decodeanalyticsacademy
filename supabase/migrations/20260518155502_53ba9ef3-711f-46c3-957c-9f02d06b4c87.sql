
CREATE OR REPLACE FUNCTION public.get_student_detail(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin only';
  END IF;

  WITH agg AS (
    SELECT a.id, a.is_correct, a.created_at, a.selected_answer,
           e.question, e.apostila_id, ap.title AS apostila_title
    FROM public.answers a
    JOIN public.exercises e ON e.id = a.exercise_id
    LEFT JOIN public.apostilas ap ON ap.id = e.apostila_id
    WHERE a.user_id = _user_id
  ),
  totals AS (
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE is_correct)::int AS hits,
           COUNT(*) FILTER (WHERE NOT is_correct)::int AS errors
    FROM agg
  ),
  by_ap AS (
    SELECT apostila_id,
           MAX(apostila_title) AS title,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE is_correct)::int AS hits,
           COUNT(*) FILTER (WHERE NOT is_correct)::int AS errors,
           MAX(created_at) AS last_at
    FROM agg
    WHERE apostila_id IS NOT NULL
    GROUP BY apostila_id
    ORDER BY last_at DESC
  ),
  history AS (
    SELECT id, is_correct, created_at, apostila_title,
           LEFT(question, 140) AS question_snippet,
           selected_answer
    FROM agg
    ORDER BY created_at DESC
    LIMIT 50
  ),
  profile AS (
    SELECT p.full_name, p.ra, p.avatar_url, p.email, p.course, p.semester
    FROM public.profiles p
    WHERE p.user_id = _user_id
  )
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(profile) FROM profile),
    'total', (SELECT total FROM totals),
    'hits', (SELECT hits FROM totals),
    'errors', (SELECT errors FROM totals),
    'accuracy', CASE WHEN (SELECT total FROM totals) > 0
                     THEN ROUND(((SELECT hits FROM totals)::numeric / (SELECT total FROM totals)::numeric) * 100, 1)
                     ELSE 0 END,
    'by_apostila', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'apostila_id', apostila_id,
        'title', title,
        'total', total,
        'hits', hits,
        'errors', errors,
        'accuracy', CASE WHEN total > 0 THEN ROUND((hits::numeric / total::numeric) * 100, 1) ELSE 0 END,
        'last_at', last_at
      )) FROM by_ap
    ), '[]'::jsonb),
    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'is_correct', is_correct,
        'created_at', created_at,
        'apostila_title', apostila_title,
        'question', question_snippet,
        'selected_answer', selected_answer
      )) FROM history
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_student_detail(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_student_detail(uuid) TO authenticated;
