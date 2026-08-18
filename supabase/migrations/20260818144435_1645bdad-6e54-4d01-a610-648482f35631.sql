-- 1. exercises: remove redundant unscoped SELECT policy
DROP POLICY IF EXISTS "Authenticated can view exercises for published apostilas" ON public.exercises;

-- 2. exercises: column-level protection of answer keys
REVOKE SELECT ON public.exercises FROM authenticated;
REVOKE SELECT ON public.exercises FROM anon;
GRANT SELECT (id, apostila_id, question, options, created_at, type, min_chars, sort_order, question_type, allow_image_upload)
  ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;

-- Admin-only full read via security definer RPC
CREATE OR REPLACE FUNCTION public.admin_list_exercises()
RETURNS SETOF public.exercises
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.exercises;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_exercises() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_exercises() TO authenticated;

-- Reveal explanation / model answer only after the student answered (or for essays)
CREATE OR REPLACE FUNCTION public.get_exercise_reveal(_exercise_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ex public.exercises%ROWTYPE;
  _answered boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO _ex FROM public.exercises WHERE id = _exercise_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exercise not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.answers
    WHERE exercise_id = _exercise_id AND user_id = auth.uid()
  ) INTO _answered;

  IF public.has_role(auth.uid(), 'admin') OR _answered
     OR COALESCE(_ex.type, _ex.question_type) = 'essay' THEN
    RETURN jsonb_build_object(
      'explanation', _ex.explanation,
      'reference_answer', _ex.reference_answer
    );
  END IF;

  RETURN jsonb_build_object('explanation', NULL, 'reference_answer', NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.get_exercise_reveal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exercise_reveal(uuid) TO authenticated;

-- 3. weekly_simulados: drop redundant unscoped policy, keep a single owner/admin policy
DROP POLICY IF EXISTS "Users manage own simulados" ON public.weekly_simulados;
DROP POLICY IF EXISTS "Users manage own simulados (scoped)" ON public.weekly_simulados;
CREATE POLICY "Users manage own simulados"
ON public.weekly_simulados FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id)
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
REVOKE ALL ON public.weekly_simulados FROM anon;