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
  if auth.uid() is not null and auth.uid() <> _user_id
     and not exists (
       select 1 from public.user_roles
       where user_id = auth.uid() and role = 'admin'::public.app_role
     ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
end;
$$;

create or replace function public.get_content_scope(_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if _user_id is null then return null; end if;
  if auth.uid() is not null and auth.uid() <> _user_id
     and not exists (
       select 1 from public.user_roles
       where user_id = auth.uid() and role = 'admin'::public.app_role
     ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return (
    select case when account_type in ('admin','ra') then 'full'
                else coalesce(content_scope,'full') end
    from public.profiles where user_id = _user_id
  );
end;
$$;

create or replace function public.count_tira_duvidas_today(_user_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> _user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return (
    select count(*)::integer
    from public.tira_duvidas
    where user_id = _user_id
      and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
  );
end;
$$;
