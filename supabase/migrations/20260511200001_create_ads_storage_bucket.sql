-- Create ads storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access to ads bucket
CREATE POLICY "Public read access for ads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ads');

-- Create policy for authenticated users to upload to ads bucket
CREATE POLICY "Authenticated users can upload to ads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ads');

-- Create policy for authenticated users to update their own files in ads bucket
CREATE POLICY "Authenticated users can update their own ads files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ads')
WITH CHECK (bucket_id = 'ads');

-- Create policy for authenticated users to delete their own files in ads bucket
CREATE POLICY "Authenticated users can delete their own ads files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ads');
