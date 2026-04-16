create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings readable by all"
  on public.app_settings for select
  using (true);

create policy "app_settings admin insert"
  on public.app_settings for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "app_settings admin update"
  on public.app_settings for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "app_settings admin delete"
  on public.app_settings for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.update_updated_at_column();