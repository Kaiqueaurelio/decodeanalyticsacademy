drop policy if exists "Anyone authenticated can view active jobs" on public.jobs;
create policy "Anyone can view active jobs" on public.jobs for select to anon, authenticated using ((is_active = true) or public.has_role(auth.uid(), 'admin'::public.app_role));

create or replace function public.get_public_jobs()
returns table(
  id uuid, title text, company_name text, company_logo_url text, description text,
  requirements text, location text, type public.job_type, salary_range text,
  is_active boolean, published_at timestamptz, application_email text,
  application_method text, application_instructions text, openings_count integer,
  candidates_count integer
)
language sql stable security invoker set search_path = public
as $$
  select j.id, j.title, j.company_name, j.company_logo_url, j.description,
    j.requirements, j.location, j.type, j.salary_range, j.salary_range, j.is_active, j.published_at,
    j.application_email, j.application_method, j.application_instructions,
    j.openings_count, j.candidates_count
  from public.jobs j
  where j.is_active = true
  order by j.published_at desc nulls last, j.created_at desc;
$$;
