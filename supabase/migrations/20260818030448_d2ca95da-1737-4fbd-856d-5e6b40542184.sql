DROP POLICY IF EXISTS "Chapters visible only for visible apostilas" ON public.apostila_chapters;

DROP POLICY IF EXISTS "Material files respect content scope" ON storage.objects;
CREATE POLICY "Material files respect content scope"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM materials m
      JOIN apostila_materials am ON am.material_id = m.id
      JOIN apostilas a ON a.id = am.apostila_id
      WHERE m.file_path = objects.name
        AND a.published = true
        AND (
          (get_content_scope(auth.uid()) = 'full' AND (a.category IS NULL OR a.category <> ALL (ARRAY['ENEM','Simulados ENEM'])))
          OR (get_content_scope(auth.uid()) = 'enem_only' AND a.category = ANY (ARRAY['ENEM','Simulados ENEM']))
        )
    )
  )
);