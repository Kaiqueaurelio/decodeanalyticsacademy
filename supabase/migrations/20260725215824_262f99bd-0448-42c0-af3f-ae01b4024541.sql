-- Ocultar categorias ENEM/Simulados ENEM de usuarios comuns (escopo 'full').
-- Admin continua vendo tudo; usuario 'enem_only' continua vendo somente ENEM.
DROP POLICY IF EXISTS "Authenticated can view published apostilas (scoped)" ON public.apostilas;
CREATE POLICY "Authenticated can view published apostilas (scoped)"
ON public.apostilas FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    published = true AND (
      (
        public.get_content_scope(auth.uid()) = 'full'
        AND (category IS NULL OR category NOT IN ('ENEM','Simulados ENEM'))
      )
      OR (
        public.get_content_scope(auth.uid()) = 'enem_only'
        AND category IN ('ENEM','Simulados ENEM')
      )
    )
  )
);

-- Exercicios seguem a mesma logica via apostila_id
DROP POLICY IF EXISTS "Authenticated can view exercises of visible apostilas" ON public.exercises;
CREATE POLICY "Authenticated can view exercises of visible apostilas"
ON public.exercises FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.apostilas a
    WHERE a.id = exercises.apostila_id
      AND a.published = true
      AND (
        (
          public.get_content_scope(auth.uid()) = 'full'
          AND (a.category IS NULL OR a.category NOT IN ('ENEM','Simulados ENEM'))
        )
        OR (
          public.get_content_scope(auth.uid()) = 'enem_only'
          AND a.category IN ('ENEM','Simulados ENEM')
        )
      )
  )
);