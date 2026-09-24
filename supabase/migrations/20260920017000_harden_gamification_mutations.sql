-- Harden gamification mutations: XP, badges and study streaks must be server-controlled.

revoke insert, update, delete on table public.user_xp from authenticated;
revoke insert, update, delete on table public.user_badges from authenticated;
revoke insert, update, delete on table public.study_streaks from authenticated;
revoke insert, update, delete on table public.user_streaks from authenticated;

create or replace function public.record_study_streak(_user_id uuid)
returns public.study_streaks
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_yesterday date := v_today - 1;
  v_current integer := 1;
  v_longest integer := 1;
  v_last date;
  v_row public.study_streaks;
begin
  if auth.uid() is null or _user_id is null or _user_id <> auth.uid() then
    raise exception 'Cannot modify another user streak' using errcode='42501';
  end if;
  select last_study_date,current_streak,longest_streak into v_last,v_current,v_longest
    from public.study_streaks where user_id=_user_id for update;
  if v_last = v_today then
    return (select s from public.study_streaks s where s.user_id=_user_id);
  end if;
  if v_last = v_yesterday then
    v_current := greatest(coalesce(v_current,0)+1,1);
  else
    v_current := 1;
  end if;
  v_longest := greatest(coalesce(v_longest,0),v_current);
  insert into public.study_streaks(user_id,current_streak,longest_streak,last_study_date)
  values(_user_id,v_current,v_longest,v_today)
  on conflict(user_id) do update
    set current_streak=excluded.current_streak,
        longest_streak=excluded.longest_streak,
        last_study_date=excluded.last_study_date,
        updated_at=now()
  returning * into v_row;
  return v_row;
end;
$function$;

revoke all on function public.record_study_streak(uuid) from public, anon;
grant execute on function public.record_study_streak(uuid) to authenticated;

create or replace function public.award_badge(_criteria text)
returns jsonb language plpgsql security definer set search_path to 'public','pg_catalog'
as $function$
declare
  v_user uuid := auth.uid();
  v_badge public.badges%rowtype;
  v_count bigint := 0;
  v_total bigint := 0;
  v_qualified boolean := false;
  v_streak integer := 0;
  v_remaining integer := 0;
  v_chunk integer := 0;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if _criteria is null or length(_criteria) > 100 then raise exception 'Invalid badge criteria' using errcode='22023'; end if;
  select * into v_badge from public.badges where criteria=_criteria limit 1;
  if not found then return jsonb_build_object('ok',false,'awarded',false,'reason','badge_not_found'); end if;
  if exists(select 1 from public.user_badges where user_id=v_user and badge_id=v_badge.id) then
    return jsonb_build_object('ok',true,'awarded',false,'reason','already_awarded','badge_id',v_badge.id);
  end if;
  case _criteria
    when 'first_login' then v_qualified := exists(select 1 from public.profiles where user_id=v_user);
    when 'first_answer' then select count(*) into v_count from public.answers where user_id=v_user; v_qualified := v_count >= 1;
    when 'answers_100' then select count(*) into v_count from public.answers where user_id=v_user; v_qualified := v_count >= 100;
    when 'annotations_20' then select count(*) into v_count from public.annotations where user_id=v_user; v_qualified := v_count >= 20;
    when 'flashcards_50' then select count(*) into v_count from public.flashcards where user_id=v_user; v_qualified := v_count >= 50;
    when 'streak_7' then select greatest(coalesce(current_streak,0),coalesce(longest_streak,0)) into v_streak from public.study_streaks where user_id=v_user; v_qualified := coalesce(v_streak,0) >= 7;
    when 'streak_30' then select greatest(coalesce(current_streak,0),coalesce(longest_streak,0)) into v_streak from public.study_streaks where user_id=v_user; v_qualified := coalesce(v_streak,0) >= 30;
    when 'pomodoro_10' then select count(*) into v_count from public.pomodoro_sessions where user_id=v_user; v_qualified := v_count >= 10;
    when 'all_apostilas' then
      select count(*) into v_total from public.apostilas where published=true;
      select count(distinct ac.apostila_id) into v_count from public.apostila_completions ac join public.apostilas a on a.id=ac.apostila_id and a.published=true where ac.user_id=v_user;
      v_qualified := v_total > 0 and v_count >= v_total;
    when 'perfect_apostila' then
      v_qualified := exists(select 1 from public.answers ans join public.exercises ex on ex.id=ans.exercise_id where ans.user_id=v_user group by ex.apostila_id having count(*) > 0 and count(*) = count(*) filter (where ans.is_correct));
    else v_qualified := false;
  end case;
  if not v_qualified then return jsonb_build_object('ok',true,'awarded',false,'reason','criteria_not_met','badge_id',v_badge.id); end if;
  insert into public.user_badges(user_id,badge_id) values(v_user,v_badge.id);
  v_remaining := greatest(coalesce(v_badge.xp_reward,0),0);
  while v_remaining > 0 loop
    v_chunk := least(v_remaining,100);
    perform public.increment_xp(v_user,v_chunk);
    v_remaining := v_remaining-v_chunk;
  end loop;
  return jsonb_build_object('ok',true,'awarded',true,'badge_id',v_badge.id,'xp_reward',coalesce(v_badge.xp_reward,0));
end;
$function$;

revoke all on function public.award_badge(text) from public, anon;
grant execute on function public.award_badge(text) to authenticated;
