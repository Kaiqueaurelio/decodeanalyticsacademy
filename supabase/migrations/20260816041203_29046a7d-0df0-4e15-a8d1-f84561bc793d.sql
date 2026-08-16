-- 1) apostilas: remove redundant unscoped SELECT policies
DROP POLICY IF EXISTS "Public can read published apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Authenticated users can read published apostilas" ON public.apostilas;

-- 2) quiz_questions: no direct student reads (answer keys live here)
DROP POLICY IF EXISTS "Strict visibility for quiz_questions" ON public.quiz_questions;
CREATE POLICY "Admins can read quiz_questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Safe reader: questions without answer keys until the user has submitted
CREATE OR REPLACE FUNCTION public.get_quiz_questions(_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _reveal boolean;
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  _reveal := public.has_role(_uid, 'admin') OR EXISTS (
    SELECT 1 FROM public.quiz_submissions s
    WHERE s.quiz_id = _quiz_id AND s.user_id = _uid
  );

  SELECT COALESCE(jsonb_agg(q ORDER BY q.position), '[]'::jsonb) INTO _result
  FROM (
    SELECT
      qq.id,
      qq.quiz_id,
      qq.type,
      qq.question,
      qq.description,
      qq.is_required,
      qq.points,
      qq.position,
      qq.image_url,
      qq.match_options,
      CASE WHEN _reveal THEN qq.correct_answer ELSE NULL END AS correct_answer,
      CASE WHEN _reveal THEN qq.explanation ELSE NULL END AS explanation,
      CASE
        WHEN _reveal THEN qq.options
        ELSE (
          SELECT COALESCE(jsonb_agg(o - 'correta' - 'ordem_correta' - 'match_id'), '[]'::jsonb)
          FROM jsonb_array_elements(COALESCE(qq.options, '[]'::jsonb)) AS o
        )
      END AS options
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = _quiz_id
  ) q;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_questions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;

-- 4) Server-side grading + submission
CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz_id uuid, _answers jsonb, _time_spent integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _q record;
  _ans jsonb;
  _pts integer := 0;
  _total integer := 0;
  _correct boolean;
  _min numeric;
  _percent numeric;
  _passed boolean;
  _idx integer;
  _opt jsonb;
  _sel jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT COALESCE(min_score_percent, 0) INTO _min FROM public.quizzes WHERE id = _quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Questionário não encontrado';
  END IF;

  FOR _q IN
    SELECT * FROM public.quiz_questions WHERE quiz_id = _quiz_id ORDER BY position
  LOOP
    _total := _total + COALESCE(_q.points, 0);
    _ans := _answers -> (_q.id)::text;
    _correct := false;

    IF _ans IS NOT NULL AND _ans <> 'null'::jsonb THEN
      IF _q.type IN ('multiple-choice', 'true-false') THEN
        _correct := (_ans = _q.correct_answer);

      ELSIF _q.type = 'open' THEN
        _correct := length(COALESCE(_ans #>> '{}', '')) > 5;

      ELSIF _q.type = 'multiple-select' THEN
        _correct := (
          SELECT COALESCE(
            (SELECT array_agg(o->>'id' ORDER BY o->>'id')
             FROM jsonb_array_elements(COALESCE(_q.options, '[]'::jsonb)) o
             WHERE (o->>'correta')::boolean IS TRUE), ARRAY[]::text[])
          =
          COALESCE(
            (SELECT array_agg(v #>> '{}' ORDER BY v #>> '{}')
             FROM jsonb_array_elements(_ans) v), ARRAY[]::text[])
        );

      ELSIF _q.type = 'ordering' THEN
        _correct := true;
        _idx := 0;
        FOR _sel IN SELECT * FROM jsonb_array_elements(_ans) LOOP
          _idx := _idx + 1;
          SELECT o INTO _opt
          FROM jsonb_array_elements(COALESCE(_q.options, '[]'::jsonb)) o
          WHERE o->>'id' = (_sel #>> '{}')
          LIMIT 1;
          IF _opt IS NULL OR COALESCE((_opt->>'ordem_correta')::int, -1) <> _idx THEN
            _correct := false;
            EXIT;
          END IF;
        END LOOP;
        IF _idx = 0 THEN
          _correct := false;
        END IF;

      ELSIF _q.type = 'matching' THEN
        _correct := NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(_q.options, '[]'::jsonb)) o
          WHERE COALESCE(_ans ->> (o->>'id'), '') IS DISTINCT FROM COALESCE(o->>'match_id', '')
        );
      END IF;
    END IF;

    IF _correct THEN
      _pts := _pts + COALESCE(_q.points, 0);
    END IF;
  END LOOP;

  _percent := CASE WHEN _total > 0 THEN (_pts::numeric / _total::numeric) * 100 ELSE 0 END;
  _passed := _percent >= _min;

  INSERT INTO public.quiz_submissions (user_id, quiz_id, score, total_points, answers, time_spent, passed)
  VALUES (_uid, _quiz_id, _pts, _total, _answers, GREATEST(COALESCE(_time_spent, 0), 0), _passed);

  RETURN jsonb_build_object(
    'user_id', _uid,
    'quiz_id', _quiz_id,
    'score', _pts,
    'total_points', _total,
    'answers', _answers,
    'time_spent', GREATEST(COALESCE(_time_spent, 0), 0),
    'passed', _passed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz(uuid, jsonb, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, integer) TO authenticated;