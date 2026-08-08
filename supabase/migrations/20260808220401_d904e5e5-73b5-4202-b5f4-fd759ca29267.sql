-- 1. Books storage respects published flag
DROP POLICY IF EXISTS "Books readable by authenticated" ON storage.objects;
CREATE POLICY "Books readable when published"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'books'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.published = true
        AND b.file_url LIKE '%/books/' || storage.objects.name
    )
  )
);

-- 2. Materials storage mirrors content_scope of the linked apostila
DROP POLICY IF EXISTS "Authenticated can view material files" ON storage.objects;
CREATE POLICY "Material files respect content scope"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.materials m
      JOIN public.apostila_materials am ON am.material_id = m.id
      JOIN public.apostilas a ON a.id = am.apostila_id
      WHERE m.file_path = storage.objects.name
        AND a.published = true
        AND (
          (public.get_content_scope(auth.uid()) = 'full'
            AND (a.category IS NULL OR a.category <> ALL (ARRAY['ENEM','Simulados ENEM'])))
          OR (public.get_content_scope(auth.uid()) = 'enem_only'
            AND a.category = ANY (ARRAY['ENEM','Simulados ENEM']))
        )
    )
    -- materiais avulsos (sem vínculo com apostila) continuam acessíveis
    OR NOT EXISTS (
      SELECT 1 FROM public.materials m2
      JOIN public.apostila_materials am2 ON am2.material_id = m2.id
      WHERE m2.file_path = storage.objects.name
    )
  )
);

-- 3. Server-side grading for weekly simulado
CREATE OR REPLACE FUNCTION public.answer_simulado_question(_answer_id uuid, _selected_answer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row public.weekly_simulado_answers%ROWTYPE;
  _is_correct boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _row FROM public.weekly_simulado_answers WHERE id = _answer_id;
  IF _row.id IS NULL OR _row.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF _row.selected_answer IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_correct', _row.is_correct,
      'correct_answer', _row.correct_answer,
      'explanation', _row.explanation,
      'already_answered', true
    );
  END IF;

  _is_correct := (_selected_answer = _row.correct_answer);

  UPDATE public.weekly_simulado_answers
  SET selected_answer = _selected_answer,
      is_correct = _is_correct,
      answered_at = now()
  WHERE id = _answer_id;

  RETURN jsonb_build_object(
    'is_correct', _is_correct,
    'correct_answer', _row.correct_answer,
    'explanation', _row.explanation,
    'already_answered', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.answer_simulado_question(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.answer_simulado_question(uuid, text) TO authenticated;