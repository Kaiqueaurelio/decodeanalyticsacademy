-- Harden exercise answers: no anonymous execution, no direct answer columns,
-- and preserve the JSON contract consumed by ExercisesPage.

CREATE TABLE IF NOT EXISTS public.exercise_answers (
  exercise_id uuid PRIMARY KEY REFERENCES public.exercises(id) ON DELETE CASCADE,
  correct_answer text,
  explanation text,
  reference_answer text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.exercise_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to exercise answers" ON public.exercise_answers;
CREATE POLICY "No direct access to exercise answers"
  ON public.exercise_answers
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
REVOKE ALL ON public.exercise_answers FROM PUBLIC, anon, authenticated;

-- Move legacy answer columns when the previous migration has not run yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exercises' AND column_name = 'correct_answer'
  ) THEN
    EXECUTE $sql$
      INSERT INTO public.exercise_answers (exercise_id, correct_answer, explanation, reference_answer)
      SELECT id, correct_answer, explanation, reference_answer
      FROM public.exercises
      ON CONFLICT (exercise_id) DO UPDATE SET
        correct_answer = EXCLUDED.correct_answer,
        explanation = EXCLUDED.explanation,
        reference_answer = EXCLUDED.reference_answer
    $sql$;

    ALTER TABLE public.exercises DROP COLUMN IF EXISTS correct_answer;
    ALTER TABLE public.exercises DROP COLUMN IF EXISTS explanation;
    ALTER TABLE public.exercises DROP COLUMN IF EXISTS reference_answer;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.check_exercise_answer(uuid, text);

CREATE OR REPLACE FUNCTION public.check_exercise_answer(
  _exercise_id uuid,
  _selected_answer text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer text;
  v_explanation text;
  v_apostila_id uuid;
  v_published boolean;
  v_category text;
  v_scope text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT e.apostila_id, a.published, a.category
  INTO v_apostila_id, v_published, v_category
  FROM public.exercises e
  JOIN public.apostilas a ON a.id = e.apostila_id
  WHERE e.id = _exercise_id;

  IF v_apostila_id IS NULL THEN
    RAISE EXCEPTION 'Exercise not found';
  END IF;

  v_scope := public.get_content_scope(auth.uid());

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF NOT v_published THEN
      RAISE EXCEPTION 'Apostila not published';
    END IF;

    IF v_scope = 'enem_only' AND (v_category IS NULL OR v_category NOT IN ('ENEM', 'Simulados ENEM')) THEN
      RAISE EXCEPTION 'Access denied: ENEM only scope';
    ELSIF v_scope = 'full' AND v_category IN ('ENEM', 'Simulados ENEM') THEN
      RAISE EXCEPTION 'Access denied: University scope';
    END IF;
  END IF;

  SELECT ea.correct_answer, ea.explanation
  INTO v_correct_answer, v_explanation
  FROM public.exercise_answers ea
  WHERE ea.exercise_id = _exercise_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exercise answer not found';
  END IF;

  RETURN json_build_object(
    'is_correct', lower(trim(COALESCE(_selected_answer, ''))) = lower(trim(COALESCE(v_correct_answer, ''))),
    'correct_answer', v_correct_answer,
    'explanation', v_explanation
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_exercise_answer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_exercise_answer(uuid, text) TO authenticated;

-- Keep essay/model-answer reveal compatible with the separated answer table.
DROP FUNCTION IF EXISTS public.get_exercise_reveal(uuid);

CREATE OR REPLACE FUNCTION public.get_exercise_reveal(_exercise_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answered boolean;
  v_is_admin boolean;
  v_published boolean;
  v_category text;
  v_type text;
  v_question_type text;
  v_scope text;
  v_explanation text;
  v_reference_answer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_is_admin := public.has_role(auth.uid(), 'admin');

  SELECT a.published, a.category, COALESCE(e.type, ''), COALESCE(e.question_type, '')
  INTO v_published, v_category, v_type, v_question_type
  FROM public.exercises e
  JOIN public.apostilas a ON a.id = e.apostila_id
  WHERE e.id = _exercise_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'exercise not found';
  END IF;

  IF NOT v_is_admin THEN
    IF NOT v_published THEN
      RAISE EXCEPTION 'Apostila not published';
    END IF;

    v_scope := public.get_content_scope(auth.uid());
    IF v_scope = 'enem_only' AND (v_category IS NULL OR v_category NOT IN ('ENEM', 'Simulados ENEM')) THEN
      RAISE EXCEPTION 'Access denied: ENEM only scope';
    ELSIF v_scope = 'full' AND v_category IN ('ENEM', 'Simulados ENEM') THEN
      RAISE EXCEPTION 'Access denied: University scope';
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.answers
    WHERE exercise_id = _exercise_id AND user_id = auth.uid()
  ) INTO v_answered;

  IF v_is_admin OR v_answered OR v_type = 'essay' OR v_question_type = 'essay' THEN
    SELECT ea.explanation, ea.reference_answer
    INTO v_explanation, v_reference_answer
    FROM public.exercise_answers ea
    WHERE ea.exercise_id = _exercise_id;

    RETURN jsonb_build_object(
      'explanation', v_explanation,
      'reference_answer', v_reference_answer
    );
  END IF;

  RETURN jsonb_build_object('explanation', NULL, 'reference_answer', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.get_exercise_reveal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exercise_reveal(uuid) TO authenticated;

-- Admin UI access: answers are available only through narrowly scoped admin RPCs.
DROP FUNCTION IF EXISTS public.admin_list_exercises();

CREATE OR REPLACE FUNCTION public.admin_list_exercises()
RETURNS TABLE (
  id uuid,
  apostila_id uuid,
  question text,
  options jsonb,
  created_at timestamptz,
  type text,
  min_chars integer,
  sort_order integer,
  question_type text,
  allow_image_upload boolean,
  correct_answer text,
  explanation text,
  reference_answer text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT e.id, e.apostila_id, e.question, e.options, e.created_at,
         e.type, e.min_chars, e.sort_order, e.question_type, e.allow_image_upload,
         ea.correct_answer, ea.explanation, ea.reference_answer
  FROM public.exercises e
  LEFT JOIN public.exercise_answers ea ON ea.exercise_id = e.id
  ORDER BY e.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_exercise(_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_apostila_id uuid := NULLIF(_payload->>'apostila_id', '')::uuid;
  v_question text := NULLIF(trim(_payload->>'question'), '');
  v_options jsonb := CASE WHEN jsonb_typeof(_payload->'options') = 'array' THEN _payload->'options' ELSE '[]'::jsonb END;
  v_correct_answer text := NULLIF(trim(COALESCE(_payload->>'correct_answer', '')), '');
  v_explanation text := NULLIF(trim(COALESCE(_payload->>'explanation', '')), '');
  v_reference_answer text := NULLIF(trim(COALESCE(_payload->>'reference_answer', '')), '');
  v_type text := COALESCE(NULLIF(_payload->>'type', ''), 'multiple_choice');
  v_question_type text := COALESCE(NULLIF(_payload->>'question_type', ''), v_type);
  v_min_chars integer := COALESCE(NULLIF(_payload->>'min_chars', '')::integer, 0);
  v_sort_order integer := COALESCE(NULLIF(_payload->>'sort_order', '')::integer, 0);
  v_allow_image_upload boolean := COALESCE(NULLIF(_payload->>'allow_image_upload', '')::boolean, false);
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF v_apostila_id IS NULL OR v_question IS NULL THEN
    RAISE EXCEPTION 'apostila_id e question são obrigatórios';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.apostilas WHERE id = v_apostila_id) THEN
    RAISE EXCEPTION 'apostila não encontrada';
  END IF;

  INSERT INTO public.exercises (
    apostila_id, question, options, type, min_chars, sort_order, question_type, allow_image_upload
  ) VALUES (
    v_apostila_id, v_question, v_options, v_type, v_min_chars, v_sort_order, v_question_type, v_allow_image_upload
  )
  RETURNING public.exercises.id INTO v_id;

  INSERT INTO public.exercise_answers (exercise_id, correct_answer, explanation, reference_answer)
  VALUES (v_id, v_correct_answer, v_explanation, v_reference_answer);

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_exercise(_exercise_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.exercises WHERE id = _exercise_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_exercises_for_apostila(_apostila_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.exercises WHERE apostila_id = _apostila_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_exercises() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_create_exercise(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_exercise(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_exercises_for_apostila(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_exercises() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_exercise(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_exercise(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_exercises_for_apostila(uuid) TO authenticated;
