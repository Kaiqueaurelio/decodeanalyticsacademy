-- Prevent answer mutations after a weekly simulado is finalized.
CREATE OR REPLACE FUNCTION public.answer_simulado_question(_answer_id uuid, _selected_answer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.weekly_simulado_answers%ROWTYPE;
  v_status text;
  v_is_correct boolean;
  v_selected text := upper(trim(coalesce(_selected_answer, '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT a.*, s.status
    INTO v_row, v_status
  FROM public.weekly_simulado_answers a
  JOIN public.weekly_simulados s ON s.id = a.simulado_id
  WHERE a.id = _answer_id
    AND a.user_id = auth.uid();

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_status <> 'in_progress' THEN
    RAISE EXCEPTION 'Simulado finalizado';
  END IF;

  IF v_selected NOT IN ('A', 'B', 'C', 'D', 'E') THEN
    RAISE EXCEPTION 'Resposta inválida';
  END IF;

  IF v_row.selected_answer IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_correct', v_row.is_correct,
      'correct_answer', v_row.correct_answer,
      'explanation', v_row.explanation,
      'already_answered', true
    );
  END IF;

  v_is_correct := v_selected = upper(trim(v_row.correct_answer));

  UPDATE public.weekly_simulado_answers
  SET selected_answer = v_selected,
      is_correct = v_is_correct,
      answered_at = now()
  WHERE id = _answer_id
    AND user_id = auth.uid()
    AND selected_answer IS NULL;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_answer', v_row.correct_answer,
    'explanation', v_row.explanation,
    'already_answered', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.answer_simulado_question(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.answer_simulado_question(uuid, text) TO authenticated;
