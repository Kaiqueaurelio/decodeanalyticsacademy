DROP POLICY IF EXISTS "Users can view maintenance logs" ON public.maintenance_logs;

DROP POLICY IF EXISTS "Anyone authenticated can view materials" ON public.materials;

CREATE POLICY "Authenticated can view scoped materials"
ON public.materials
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.apostila_materials am
    JOIN public.apostilas a ON a.id = am.apostila_id
    WHERE am.material_id = materials.id
      AND a.published = true
      AND (
        (public.get_content_scope(auth.uid()) = 'full'
          AND (a.category IS NULL OR a.category <> ALL (ARRAY['ENEM'::text, 'Simulados ENEM'::text])))
        OR
        (public.get_content_scope(auth.uid()) = 'enem_only'
          AND a.category = ANY (ARRAY['ENEM'::text, 'Simulados ENEM'::text]))
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.categories c
    WHERE c.id = materials.category_id
      AND (
        (public.get_content_scope(auth.uid()) = 'enem_only' AND c.slug LIKE 'enem-%')
        OR
        (public.get_content_scope(auth.uid()) = 'full' AND c.slug NOT LIKE 'enem-%')
      )
  )
);