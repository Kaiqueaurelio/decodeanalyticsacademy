DROP POLICY IF EXISTS "Authenticated can view active ads" ON public.ads;
CREATE POLICY "Authenticated can view active ads"
ON public.ads FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR (is_active = true AND public.get_content_scope(auth.uid()) = 'full')
);