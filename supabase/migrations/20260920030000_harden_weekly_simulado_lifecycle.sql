-- Harden weekly simulado lifecycle: generation/grading/finalization stay server-side.
ALTER TABLE public.weekly_simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_simulado_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own simulados" ON public.weekly_simulados;
DROP POLICY IF EXISTS "Users view own simulados" ON public.weekly_simulados;
CREATE POLICY "Users view own simulados"
ON public.weekly_simulados FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own simulado answers" ON public.weekly_simulado_answers;
DROP POLICY IF EXISTS "Users view own simulado answers" ON public.weekly_simulado_answers;
CREATE POLICY "Users view own simulado answers"
ON public.weekly_simulado_answers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.weekly_simulados FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.weekly_simulado_answers FROM authenticated;

CREATE OR REPLACE FUNCTION public.finish_weekly_simulado(_simulado_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_status text;
  v_total integer;
  v_answered integer;
  v_correct integer;
  v_score numeric;
  v_diagnosis jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status, total_questions
    INTO v_status, v_total
  FROM public.weekly_simulados
  WHERE id = _simulado_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_status = 'finished' THEN
    SELECT correct_count, score, diagnosis
      INTO v_correct, v_score, v_diagnosis
    FROM public.weekly_simulados
    WHERE id = _simulado_id;

    RETURN jsonb_build_object(
      'status', 'finished',
      'correct_count', coalesce(v_correct, 0),
      'score', coalesce(v_score, 0),
      'diagnosis', coalesce(v_diagnosis, '{}'::jsonb)
    );
  END IF;

  SELECT count(*), count(*) FILTER (WHERE is_correct IS NOT NULL), count(*) FILTER (WHERE is_correct = true)
    INTO v_total, v_answered, v_correct
  FROM public.weekly_simulado_answers
  WHERE simulado_id = _simulado_id
    AND user_id = v_user_id;

  IF v_total = 0 OR v_answered < v_total THEN
    RAISE EXCEPTION 'Simulado incompleto';
  END IF;

  v_score := round((v_correct::numeric / v_total::numeric) * 10000) / 100;

  SELECT coalesce(
    jsonb_object_agg(subject, stats),
    '{}'::jsonb
  )
  INTO v_diagnosis
  FROM (
    SELECT
      coalesce(subject, 'Geral') AS subject,
      jsonb_build_object(
        'total', count(*),
        'correct', count(*) FILTER (WHERE is_correct = true),
        'accuracy',
          round(
            (count(*) FILTER (WHERE is_correct = true)::numeric / count(*)::numeric) * 10000
          ) / 100
      ) AS stats
    FROM public.weekly_simulado_answers
    WHERE simulado_id = _simulado_id
      AND user_id = v_user_id
    GROUP BY coalesce(subject, 'Geral')
  ) grouped;

  UPDATE public.weekly_simulados
  SET status = 'finished',
      correct_count = v_correct,
      score = v_score,
      diagnosis = v_diagnosis,
      finished_at = now()
  WHERE id = _simulado_id
    AND user_id = v_user_id;

  RETURN jsonb_build_object(
    'status', 'finished',
    'correct_count', v_correct,
    'score', v_score,
    'diagnosis', v_diagnosis
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finish_weekly_simulado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_weekly_simulado(uuid) TO authenticated;
