-- Consolidate apostila visibility into one authenticated SELECT policy.
-- Service-role callers must enforce the same rule in their tool handlers.

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'apostilas'
      AND (cmd = 'SELECT' OR cmd = 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.apostilas', policy_row.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "apostilas_select_published_scoped"
ON public.apostilas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    published = true
    AND (
      public.get_content_scope(auth.uid()) = 'full'
      OR (
        public.get_content_scope(auth.uid()) = 'enem_only'
        AND category IN ('ENEM', 'Simulados ENEM')
      )
    )
  )
);
