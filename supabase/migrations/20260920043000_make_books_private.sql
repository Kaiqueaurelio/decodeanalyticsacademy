-- Book files must follow the publication RLS policy. A public Storage bucket
-- would bypass the "published" check for direct object URLs.
update storage.buckets
set public = false
where id = 'books';

drop policy if exists "Books are publicly accessible" on storage.objects;
