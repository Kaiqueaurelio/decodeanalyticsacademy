-- AI-generated covers for apostilas.
-- Keeps the feature additive: existing apostilas continue working without a cover.

ALTER TABLE public.apostilas
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('apostila-covers', 'apostila-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Apostila covers are publicly accessible'
  ) THEN
    CREATE POLICY "Apostila covers are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'apostila-covers');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload apostila covers'
  ) THEN
    CREATE POLICY "Admins can upload apostila covers"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'apostila-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update apostila covers'
  ) THEN
    CREATE POLICY "Admins can update apostila covers"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'apostila-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete apostila covers'
  ) THEN
    CREATE POLICY "Admins can delete apostila covers"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'apostila-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;
