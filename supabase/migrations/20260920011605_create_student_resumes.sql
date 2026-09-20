-- Currículos pertencem exclusivamente ao aluno que os criou. Esta tabela é
-- independente de profiles e do conteúdo acadêmico já existente.
create table if not exists public.student_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Meu currículo',
  target_role text,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_resumes_user_updated_idx
  on public.student_resumes (user_id, updated_at desc);

alter table public.student_resumes enable row level security;

grant select, insert, update, delete on public.student_resumes to authenticated;

drop policy if exists "Students manage own resumes" on public.student_resumes;
create policy "Students manage own resumes"
  on public.student_resumes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists set_student_resumes_updated_at on public.student_resumes;
create trigger set_student_resumes_updated_at
  before update on public.student_resumes
  for each row execute function public.update_updated_at_column();
