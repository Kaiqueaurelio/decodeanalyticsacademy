DROP POLICY IF EXISTS "Authenticated can update summaries" ON public.apostila_summaries;

CREATE POLICY "Authenticated can update summaries"
ON public.apostila_summaries FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);