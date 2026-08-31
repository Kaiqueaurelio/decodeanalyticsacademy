-- Align the live schema with the generated client types and fix ownership of
-- records restored from the legacy project.

alter table public.ads
  add column if not exists target_pages text[] not null default array['all']::text[];

update public.ads
set target_pages = array[coalesce(nullif(target_audience, ''), 'all')]
where target_pages is null or cardinality(target_pages) = 0;

-- flashcards has no updated_at column, so the generic timestamp trigger made
-- every edit fail at runtime.
drop trigger if exists update_flashcards_updated_at on public.flashcards;

with admin_profile as (
  select user_id from public.profiles where upper(ra) = 'G802144' limit 1
)
update public.flashcards f
set user_id = p.user_id
from admin_profile p
where f.id in (
  '90efd476-85b3-4af6-9312-ba76a8246570',
  'e99cbd49-bbd7-4636-8164-4df805f090de',
  '2dc398bc-fbc7-4141-940b-b0b34938a169'
);

with admin_profile as (
  select user_id from public.profiles where upper(ra) = 'G802144' limit 1
)
update public.books b
set created_by = p.user_id
from admin_profile p;
