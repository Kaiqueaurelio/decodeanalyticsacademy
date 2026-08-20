-- Hardening final do fluxo de quizzes.
-- Alunos recebem somente metadados de perguntas por RPC; gabaritos e explicações
-- permanecem no banco e devem ser usados apenas pelo processamento server-side.

REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.get_quiz_questions(uuid);

CREATE FUNCTION public.get_quiz_questions(_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  type text,
  question text,
  description text,
  is_required boolean,
  points integer,
  options jsonb,
  match_options jsonb,
  image_url text,
  position integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qq.id,
    qq.type,
    qq.question,
    qq.description,
    qq.is_required,
    qq.points,
    qq.options,
    qq.match_options,
    qq.image_url,
    qq.position
  FROM public.quiz_questions AS qq
  INNER JOIN public.quizzes AS q ON q.id = qq.quiz_id
  WHERE qq.quiz_id = _quiz_id
    AND auth.uid() IS NOT NULL
  ORDER BY qq.position ASC, qq.created_at ASC, qq.id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_quiz_questions(uuid) IS
  'Retorna somente campos seguros de perguntas; correct_answer e explanation nunca fazem parte do retorno.';
