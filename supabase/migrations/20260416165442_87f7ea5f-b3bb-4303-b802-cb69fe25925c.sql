
-- Create announcements storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Anyone can view announcement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

-- Admin upload
CREATE POLICY "Admins can upload announcement images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'));

-- Admin update
CREATE POLICY "Admins can update announcement images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'));

-- Admin delete
CREATE POLICY "Admins can delete announcement images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'));
