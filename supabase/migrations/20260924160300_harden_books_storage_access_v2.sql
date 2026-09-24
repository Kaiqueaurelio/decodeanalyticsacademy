-- Security hardening: prevent legacy/public access from being reintroduced
-- for the Play Books files and table.

UPDATE storage.buckets
SET public = false
WHERE id = 'books';

DROP POLICY IF EXISTS "Books are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Books readable by authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Books readable when published" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view books" ON public.books;
DROP POLICY IF EXISTS "Authenticated can view published books" ON public.books;

CREATE POLICY "Authenticated can view published books"
ON public.books
FOR SELECT
TO authenticated
USING (
  published = true
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Books readable when published"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'books'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.published = true
        AND b.file_url LIKE '%/books/' || storage.objects.name
    )
  )
);

DROP POLICY IF EXISTS "Admins can upload books" ON storage.objects;
CREATE POLICY "Admins can upload books"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'books'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update books storage" ON storage.objects;
CREATE POLICY "Admins can update books storage"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'books'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'books'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can delete books storage" ON storage.objects;
CREATE POLICY "Admins can delete books storage"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'books'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
