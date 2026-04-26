ALTER TABLE public.books ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Authenticated can view books" ON public.books;

CREATE POLICY "Authenticated can view published books"
ON public.books
FOR SELECT
TO authenticated
USING (published = true OR has_role(auth.uid(), 'admin'::app_role));