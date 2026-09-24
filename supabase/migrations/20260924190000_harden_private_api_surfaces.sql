-- Harden private/internal Data API surfaces and restore explicit forum ownership policies.

revoke all on table public.content_backups from anon, authenticated;
revoke all on table public.ella_action_confirmations from anon, authenticated;
revoke all on table public.security_alerts from anon, authenticated;
revoke all on table public.system_telemetry from anon, authenticated;
revoke all on table public.workbook_content_integrity from anon, authenticated;

drop policy if exists "Forum posts are publicly readable when marked public" on public.forum_posts;
drop policy if exists "Users can create own forum posts" on public.forum_posts;
drop policy if exists "Users can update own forum posts" on public.forum_posts;
drop policy if exists "Users can delete own forum posts" on public.forum_posts;

create policy "Forum posts are publicly readable when marked public"
on public.forum_posts for select to authenticated
using (is_public = true or (select auth.uid()) = user_id);

create policy "Users can create own forum posts"
on public.forum_posts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own forum posts"
on public.forum_posts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own forum posts"
on public.forum_posts for delete to authenticated
using ((select auth.uid()) = user_id);
