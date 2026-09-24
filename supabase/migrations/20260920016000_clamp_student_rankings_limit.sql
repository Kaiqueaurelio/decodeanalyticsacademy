create or replace function public.get_student_rankings(_limit integer default 20)
returns table(user_id uuid, full_name text, ra text, avatar_url text, total integer, hits integer, errors integer, accuracy numeric)
language plpgsql stable security definer
set search_path to 'public'
as $function$
declare
  v_limit integer := least(greatest(coalesce(_limit,20),1),100);
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Permission denied: admin only';
  end if;
  return query
  select p.user_id,p.full_name,p.ra,p.avatar_url,
    count(a.id)::int,
    count(a.id) filter (where a.is_correct)::int,
    count(a.id) filter (where not a.is_correct)::int,
    case when count(a.id)>0 then round((count(a.id) filter (where a.is_correct)::numeric/count(a.id)::numeric)*100,1) else 0 end
  from public.profiles p
  left join public.answers a on a.user_id=p.user_id
  group by p.user_id,p.full_name,p.ra,p.avatar_url
  having count(a.id)>0
  order by hits desc,accuracy desc
  limit v_limit;
end;
$function$;