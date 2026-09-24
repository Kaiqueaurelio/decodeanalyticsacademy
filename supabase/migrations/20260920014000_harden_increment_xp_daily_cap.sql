create table if not exists public.xp_award_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  awarded_on date not null default current_date,
  amount integer not null check (amount > 0 and amount <= 100),
  created_at timestamptz not null default now()
);
create index if not exists idx_xp_award_events_user_date on public.xp_award_events(user_id, awarded_on);
alter table public.xp_award_events enable row level security;
revoke all on table public.xp_award_events from anon;
revoke all on table public.xp_award_events from authenticated;
drop policy if exists "Users can view own XP award events" on public.xp_award_events;
create policy "Users can view own XP award events"
on public.xp_award_events for select to authenticated
using (auth.uid() = user_id);

create or replace function public.increment_xp(_user_id uuid, _amount integer)
returns void language plpgsql security definer
set search_path to 'public'
as $function$
declare
  new_points integer;
  daily_total integer;
  daily_cap constant integer := 1000;
begin
  if auth.uid() is null or _user_id is null or _user_id <> auth.uid() then
    raise exception 'Cannot modify other users XP' using errcode='42501';
  end if;
  if _amount is null or _amount <= 0 or _amount > 100 then
    raise exception 'Invalid XP amount: must be between 1 and 100' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(_user_id::text || ':xp:' || current_date::text, 0));
  select coalesce(sum(amount),0)::int into daily_total
  from public.xp_award_events
  where user_id = _user_id and awarded_on = current_date;
  if daily_total + _amount > daily_cap then
    raise exception 'Daily XP award limit reached' using errcode='22023';
  end if;
  insert into public.xp_award_events(user_id, awarded_on, amount)
  values (_user_id, current_date, _amount);
  insert into public.user_xp (user_id, xp_points, level)
  values (_user_id, _amount, greatest(1, floor(_amount / 100)::integer + 1))
  on conflict (user_id) do update
  set xp_points = user_xp.xp_points + _amount,
      level = greatest(1, floor((user_xp.xp_points + _amount) / 100)::integer + 1),
      updated_at = now();
end;
$function$;