create or replace function public.trigger_apostila_chronology_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apostila_id uuid;
begin
  v_apostila_id := case
    when tg_table_name = 'apostilas' then (to_jsonb(new)->>'id')::uuid
    when tg_table_name = 'apostila_pages' then (to_jsonb(new)->>'apostila_id')::uuid
    else null
  end;

  if v_apostila_id is not null then
    perform public.run_apostila_chronology_validation_internal(v_apostila_id, 'db_trigger', null);
  end if;

  return new;
end;
$$;
