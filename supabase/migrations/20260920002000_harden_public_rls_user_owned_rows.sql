drop policy if exists "Users can add own apostila favorites" on public.apostila_favorites;
create policy "Users can add own apostila favorites" on public.apostila_favorites for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users manage own push subs - insert" on public.push_subscriptions;
create policy "users manage own push subs - insert" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users manage own study plans" on public.study_plans;
create policy "Users manage own study plans" on public.study_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can insert own ad clicks" on public.ad_clicks;
create policy "Users can insert own ad clicks" on public.ad_clicks for insert to anon, authenticated with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Users can insert own ad views" on public.ad_views;
create policy "Users can insert own ad views" on public.ad_views for insert to anon, authenticated with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Admins can manage ads" on public.ads;
create policy "Admins can manage ads" on public.ads for all to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
