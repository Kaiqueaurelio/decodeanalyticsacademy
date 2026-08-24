-- Helper: scoped visibility of an apostila for the current user
CREATE OR REPLACE FUNCTION public.can_view_apostila(_apostila_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.apostilas a
    WHERE a.id = _apostila_id
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR (
          a.published = true
          AND (
            (public.get_content_scope(auth.uid()) = 'full'
              AND (a.category IS NULL OR a.category <> ALL (ARRAY['ENEM','Simulados ENEM'])))
            OR (public.get_content_scope(auth.uid()) = 'enem_only'
              AND a.category = ANY (ARRAY['ENEM','Simulados ENEM']))
          )
        )
      )
  )
$$;

DROP POLICY IF EXISTS "Authenticated can view apostila_materials for published apostil" ON public.apostila_materials;
CREATE POLICY "Scoped read of apostila_materials"
ON public.apostila_materials FOR SELECT TO authenticated
USING (public.can_view_apostila(apostila_id));

DROP POLICY IF EXISTS "Authenticated can read modules of published apostilas" ON public.apostila_modules;
CREATE POLICY "Scoped read of apostila_modules"
ON public.apostila_modules FOR SELECT TO authenticated
USING (public.can_view_apostila(apostila_id));

DROP POLICY IF EXISTS "Authenticated can view summaries for published apostilas" ON public.apostila_summaries;
CREATE POLICY "Scoped read of apostila_summaries"
ON public.apostila_summaries FOR SELECT TO authenticated
USING (public.can_view_apostila(apostila_id));

DROP POLICY IF EXISTS "Users can view versions of accessible apostilas" ON public.apostila_versions;
CREATE POLICY "Scoped read of apostila_versions"
ON public.apostila_versions FOR SELECT TO authenticated
USING (public.can_view_apostila(apostila_id));

DROP POLICY IF EXISTS "Strict visibility for quizzes" ON public.quizzes;
CREATE POLICY "Authenticated users can read quizzes"
ON public.quizzes FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);