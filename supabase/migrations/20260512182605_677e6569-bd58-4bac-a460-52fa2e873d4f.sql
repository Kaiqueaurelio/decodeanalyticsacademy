INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Ads images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

CREATE POLICY "Admins can upload ads images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ads images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ads images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));