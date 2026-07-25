DROP POLICY IF EXISTS "Authenticated can view published apostilas (scoped)" ON public.apostilas;
CREATE POLICY "Authenticated can view published apostilas (scoped)"
ON public.apostilas FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    published = true AND (
      public.get_content_scope(auth.uid()) = 'full'
      OR (
        public.get_content_scope(auth.uid()) = 'enem_only'
        AND (category = 'ENEM' OR category = 'Simulados ENEM')
      )
    )
  )
);