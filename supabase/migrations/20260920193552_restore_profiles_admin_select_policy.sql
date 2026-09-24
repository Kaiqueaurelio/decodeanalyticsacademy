-- Restore the dedicated admin SELECT policy for profiles.
-- This policy is intentionally distinct from the own-profile policy.
create policy "Admins can view all profiles"
on public.profiles
as permissive
for select
to authenticated
using (has_role(auth.uid(), 'admin'::app_role));
