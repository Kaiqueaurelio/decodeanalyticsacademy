-- RPC para estatísticas agregadas do dashboard (evita baixar todas as respostas)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  WITH agg AS (
    SELECT
      a.is_correct,
      e.apostila_id,
      ap.title AS apostila_title
    FROM public.answers a
    JOIN public.exercises e ON e.id = a.exercise_id
    LEFT JOIN public.apostilas ap ON ap.id = e.apostila_id
    WHERE a.user_id = _user_id
  ),
  totals AS (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_correct)::int AS hits,
      COUNT(*) FILTER (WHERE NOT is_correct)::int AS errors
    FROM agg
  ),
  by_ap AS (
    SELECT
      apostila_id,
      MAX(apostila_title) AS title,
      COUNT(*) FILTER (WHERE is_correct)::int AS hits,
      COUNT(*) FILTER (WHERE NOT is_correct)::int AS errors
    FROM agg
    WHERE apostila_id IS NOT NULL
    GROUP BY apostila_id
  )
  SELECT jsonb_build_object(
    'total', (SELECT total FROM totals),
    'hits', (SELECT hits FROM totals),
    'errors', (SELECT errors FROM totals),
    'byApostila', COALESCE((
      SELECT jsonb_object_agg(
        apostila_id::text,
        jsonb_build_object('title', title, 'hits', hits, 'errors', errors)
      ) FROM by_ap
    ), '{}'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC para contagens de exercícios por apostila (evita listar a tabela inteira)
CREATE OR REPLACE FUNCTION public.get_exercise_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_object_agg(apostila_id::text, cnt),
    '{}'::jsonb
  )
  FROM (
    SELECT apostila_id, COUNT(*)::int AS cnt
    FROM public.exercises
    WHERE apostila_id IS NOT NULL
    GROUP BY apostila_id
  ) t;
$$;