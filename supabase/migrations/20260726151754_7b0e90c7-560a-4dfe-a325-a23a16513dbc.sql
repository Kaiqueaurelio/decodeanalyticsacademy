DROP POLICY IF EXISTS "Authenticated can view active ads" ON public.ads;
CREATE POLICY "Anyone can view active ads"
ON public.ads FOR SELECT
TO anon, authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;