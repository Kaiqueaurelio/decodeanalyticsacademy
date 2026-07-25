
CREATE OR REPLACE FUNCTION public.get_content_scope(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(content_scope, 'full') FROM public.profiles WHERE user_id = _user_id
$$;
REVOKE ALL ON FUNCTION public.get_content_scope(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_content_scope(uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone authenticated can view published apostilas" ON public.apostilas;
CREATE POLICY "Authenticated can view published apostilas (scoped)"
ON public.apostilas FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    published = true
    AND (
      public.get_content_scope(auth.uid()) = 'full'
      OR (public.get_content_scope(auth.uid()) = 'enem_only' AND category = 'ENEM')
    )
  )
);
