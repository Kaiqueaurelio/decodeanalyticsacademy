alter policy "Anyone can view approved or own testimonials"
on public.testimonials
using (approved = true or (select auth.uid()) = user_id);