-- Harden broad RLS rules, admin role mutations, sponsor submissions and private book storage.

drop policy if exists "Authenticated users can view comments" on public.apostila_comments;
create policy "Authenticated users can view scoped apostila comments"
on public.apostila_comments for select to authenticated
using (
  (select has_role((select auth.uid()), 'admin'::public.app_role))
  or (select public.can_view_apostila(apostila_id))
);

drop policy if exists "Users can view likes" on public.apostila_likes;
create policy "Authenticated users can view scoped apostila likes"
on public.apostila_likes for select to authenticated
using (
  (select has_role((select auth.uid()), 'admin'::public.app_role))
  or (select public.can_view_apostila(apostila_id))
);

drop policy if exists "Anyone authenticated can view badges" on public.badges;
create policy "Authenticated users can view badges"
on public.badges for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated can view events" on public.calendar_events;
create policy "Authenticated users can view calendar events"
on public.calendar_events for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users read categories" on public.categories;
create policy "Authenticated users read categories"
on public.categories for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated can view all comments" on public.comments;
create policy "Authenticated users can view comments"
on public.comments for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated can view channels" on public.community_channels;
create policy "Authenticated users can view community channels"
on public.community_channels for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated can view likes" on public.community_post_likes;
create policy "Authenticated users can view community post likes"
on public.community_post_likes for select to authenticated
using (
  (select has_role((select auth.uid()), 'admin'::public.app_role))
  or (select auth.uid()) = user_id
  or exists (
    select 1 from public.community_posts p
    where p.id = community_post_likes.post_id
  )
);

drop policy if exists "Authenticated can view posts" on public.community_posts;
create policy "Authenticated users can view community posts"
on public.community_posts for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated can view replies" on public.community_replies;
create policy "Authenticated users can view community replies"
on public.community_replies for select to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.community_posts p
    where p.id = community_replies.post_id
  )
);

drop policy if exists "Fixed apostilas are readable by everyone" on public.fixed_apostilas;
create policy "Fixed apostilas are readable only for visible content"
on public.fixed_apostilas for select to authenticated
using (
  (select has_role((select auth.uid()), 'admin'::public.app_role))
  or exists (
    select 1 from public.apostilas a
    where a.id = fixed_apostilas.apostila_id
      and a.published = true
      and (
        (select public.get_content_scope((select auth.uid()))) = 'full'
        or (
          (select public.get_content_scope((select auth.uid()))) = 'enem_only'
          and a.category = any (array['ENEM','Simulados ENEM'])
        )
      )
  )
);

drop policy if exists "Authenticated can read feeds" on public.rss_feeds;
create policy "Authenticated users can read enabled feeds"
on public.rss_feeds for select to authenticated
using (enabled = true);

drop policy if exists "Anyone can submit a sponsor lead" on public.sponsor_leads;
drop policy if exists "Authenticated users can submit sponsor leads" on public.sponsor_leads;
create policy "Public sponsor lead submissions are validated"
on public.sponsor_leads for insert
to anon, authenticated
with check (
  length(trim(company)) between 1 and 120
  and length(trim(contact_name)) between 1 and 120
  and length(trim(email)) between 3 and 254
  and channel in ('whatsapp','email','copia','clique')
  and status = 'novo'
  and length(trim(coalesce(source,''))) between 1 and 120
  and coalesce(length(phone),0) <= 40
  and coalesce(length(site),0) <= 500
  and coalesce(length(goal),0) <= 120
  and coalesce(length(period),0) <= 120
  and coalesce(length(budget),0) <= 120
  and coalesce(length(notes),0) <= 2000
);

create or replace function public.admin_update_user_role(_target_user_id uuid, _new_role public.app_role)
returns void language plpgsql security definer
set search_path = public
set row_security = off
as $function$
declare v_admin_count integer;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;
  if _target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;
  if _new_role not in ('admin'::public.app_role, 'user'::public.app_role) then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('decode_admin_role_guard', 0));
  if _new_role = 'user'::public.app_role then
    select count(*) into v_admin_count from public.user_roles where role = 'admin'::public.app_role;
    if v_admin_count <= 1 and exists (
      select 1 from public.user_roles where user_id = _target_user_id and role = 'admin'::public.app_role
    ) then
      raise exception 'cannot remove the last administrator' using errcode = 'P0001';
    end if;
  end if;
  delete from public.user_roles where user_id = _target_user_id;
  insert into public.user_roles (user_id, role) values (_target_user_id, _new_role);
  update public.profiles
  set account_type = case when _new_role = 'admin'::public.app_role then 'admin' else 'ra' end,
      content_scope = case when _new_role = 'admin'::public.app_role then 'full' else content_scope end,
      updated_at = now()
  where user_id = _target_user_id;
  insert into public.admin_audit_logs (admin_id, action, target_user_id, details)
  values (auth.uid(), 'update_role_' || _new_role::text, _target_user_id, jsonb_build_object('newRole', _new_role::text));
end;
$function$;

revoke all on function public.admin_update_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.admin_update_user_role(uuid, public.app_role) to authenticated;

create or replace function public.admin_set_user_role(_target_user_id uuid, _new_role public.app_role)
returns public.app_role language plpgsql security definer
set search_path = public
set row_security = off
as $function$
begin
  perform public.admin_update_user_role(_target_user_id, _new_role);
  return _new_role;
end;
$function$;

revoke all on function public.admin_set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;

-- The books bucket is private; the existing authenticated SELECT policy is the gate
-- for published books and administrators.
update storage.buckets set public = false where id = 'books';
drop policy if exists "Books are publicly accessible" on storage.objects;
