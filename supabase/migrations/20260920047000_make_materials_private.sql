-- Course material files must honor the authenticated RLS policy that
-- checks publication and content scope. A public bucket bypasses that policy.
UPDATE storage.buckets
SET public = false
WHERE id = 'materials';

DROP POLICY IF EXISTS "Public read access for materials" ON storage.objects;
