-- Student response photos are private user data.
update storage.buckets
set public = false
where id = 'respostas-foto';

-- The public SELECT policy was removed previously; keep only the authenticated
-- per-user policy from the storage hardening migration.
drop policy if exists "Public read access for respostas-foto" on storage.objects;
