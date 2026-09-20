-- Prevent anonymous role introspection and fail closed when no user is authenticated.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if _user_id is null or _role is null then
    return false;
  end if;

  if auth.role() <> 'service_role'::text and auth.uid() is null then
    return false;
  end if;

  if auth.uid() is not null and auth.uid() <> _user_id
     and not exists (
       select 1
       from public.user_roles
       where user_id = auth.uid()
         and role = 'admin'::public.app_role
     ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
end;
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
