-- Make materials bucket public
UPDATE storage.buckets SET public = true WHERE id = 'materials';

-- Allow public read access
CREATE POLICY "Public read access for materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');
