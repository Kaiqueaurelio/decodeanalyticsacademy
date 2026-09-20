-- Safe server-side reveal for already answered weekly simulado questions.
CREATE OR REPLACE FUNCTION public.get_simulado_answer_reveals(_simulado_id uuid)
RETURNS TABLE (
  id uuid,
  correct_answer text,
  explanation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT a.id, a.correct_answer, a.explanation
  FROM public.weekly_simulado_answers a
  JOIN public.weekly_simulados s ON s.id = a.simulado_id
  WHERE a.simulado_id = _simulado_id
    AND a.user_id = auth.uid()
    AND s.user_id = auth.uid()
    AND a.selected_answer IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_simulado_answer_reveals(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_simulado_answer_reveals(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.check_simulado_answer(uuid, uuid, text);
