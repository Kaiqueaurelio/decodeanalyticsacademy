create or replace function public.log_study_activity(_user_id uuid, _xp integer default 0, _chapters integer default 0, _exercises integer default 0, _minutes integer default 0)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or auth.uid() <> _user_id then raise exception 'not authorized'; end if;
  if coalesce(_xp,0) > 500 or coalesce(_chapters,0) > 50 or coalesce(_exercises,0) > 100 or coalesce(_minutes,0) > 720 then
    raise exception 'study activity values exceed per-call limits' using errcode='22023';
  end if;
  insert into public.study_history(user_id,date,xp_gained,chapters_completed,exercises_completed,time_spent_minutes)
  values(_user_id,current_date,greatest(coalesce(_xp,0),0),greatest(coalesce(_chapters,0),0),greatest(coalesce(_exercises,0),0),greatest(coalesce(_minutes,0),0));
end; $$;
