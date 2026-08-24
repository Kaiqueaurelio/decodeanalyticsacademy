DROP POLICY IF EXISTS "Authenticated can read chapters" ON public.apostila_chapters;
DROP POLICY IF EXISTS "Strict visibility for apostila_chapters" ON public.apostila_chapters;

CREATE POLICY "Scoped visibility for apostila_chapters"
ON public.apostila_chapters
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.apostila_modules m
    JOIN public.apostilas a ON a.id = m.apostila_id
    WHERE m.id = apostila_chapters.module_id
      AND a.published = true
      AND (
        (get_content_scope(auth.uid()) = 'full' AND (a.category IS NULL OR a.category <> ALL (ARRAY['ENEM'::text, 'Simulados ENEM'::text])))
        OR (get_content_scope(auth.uid()) = 'enem_only' AND a.category = ANY (ARRAY['ENEM'::text, 'Simulados ENEM'::text]))
      )
  )
);