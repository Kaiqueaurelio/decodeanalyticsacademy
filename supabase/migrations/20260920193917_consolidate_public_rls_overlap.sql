drop policy if exists "Authenticated users can view likes" on public.apostila_likes;
drop policy if exists "Authenticated can read fixed apostilas" on public.fixed_apostilas;
drop policy if exists "System can insert badges" on public.user_badges;

drop policy if exists "Anyone can view approved testimonials" on public.testimonials;
drop policy if exists "Users can view own testimonials" on public.testimonials;
create policy "Anyone can view approved or own testimonials"
on public.testimonials as permissive
for select
to anon, authenticated
using (approved = true or auth.uid() = user_id);