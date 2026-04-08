
UPDATE storage.buckets SET public = true WHERE id = 'materials';

-- Allow public read access to all files in materials bucket
CREATE POLICY "Public read access for materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'materials');
