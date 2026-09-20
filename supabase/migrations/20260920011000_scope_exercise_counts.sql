create or replace function public.get_exercise_counts()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    jsonb_object_agg(t.apostila_id::text, t.cnt),
    '{}'::jsonb
  )
  from (
    select e.apostila_id, count(*)::int as cnt
    from public.exercises e
    join public.apostilas a on a.id = e.apostila_id
    where e.apostila_id is not null
      and (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        or (
          a.published = true
          and (
            public.get_content_scope(auth.uid()) = 'full'
            or (
              public.get_content_scope(auth.uid()) = 'enem_only'
              and a.category in ('ENEM','Simulados ENEM')
            )
          )
        )
      )
    group by e.apostila_id
  ) t;
$$;
