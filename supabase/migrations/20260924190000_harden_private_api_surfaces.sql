-- Harden private/internal Data API surfaces and restore explicit forum ownership policies.

revoke all on table public.content_backups from anon, authenticated;
revoke all on table public.ella_action_confirmations from anon, authenticated;
revoke all on table public.security_alerts from anon, authenticated;
revoke all on table public.system_telemetry from anon, authenticated;
revoke all on table public.workbook_content_integrity from anon, authenticated;

-- Keep RLS explicit even for internal tables whose only intended callers are
-- service-role/SECURITY DEFINER code paths. Direct Data API access is denied.
drop policy if exists "No direct API access to content backups" on public.content_backups;
create policy "No direct API access to content backups" on public.content_backups for all to anon, authenticated using (false) with check (false);

drop policy if exists "No direct API access to Ella confirmations" on public.ella_action_confirmations;
create policy "No direct API access to Ella confirmations" on public.ella_action_confirmations for all to anon, authenticated using (false) with check (false);

drop policy if exists "No direct API access to security alerts" on public.security_alerts;
create policy "No direct API access to security alerts" on public.security_alerts for all to anon, authenticated using (false) with check (false);

drop policy if exists "No direct API access to system telemetry" on public.system_telemetry;
create policy "No direct API access to system telemetry" on public.system_telemetry for all to anon, authenticated using (false) with check (false);

drop policy if exists "No direct API access to workbook integrity" on public.workbook_content_integrity;
create policy "No direct API access to workbook integrity" on public.workbook_content_integrity for all to anon, authenticated using (false) with check (false);

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
