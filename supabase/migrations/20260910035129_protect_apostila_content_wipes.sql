begin;

create or replace function public.prevent_apostila_content_wipe()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if old.content is not null
     and btrim(old.content) <> ''
     and (new.content is null or btrim(new.content) = '')
     and coalesce(current_setting('app.allow_content_wipe', true), 'off') <> 'on' then
    raise exception using
      errcode = '40001',
      message = 'Content wipe blocked: an existing apostila cannot be replaced by empty content without an explicit persistence operation.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_apostila_content_wipe on public.apostilas;
create trigger trg_prevent_apostila_content_wipe
before update on public.apostilas
for each row execute function public.prevent_apostila_content_wipe();

drop trigger if exists trg_prevent_apostila_page_content_wipe on public.apostila_pages;
create trigger trg_prevent_apostila_page_content_wipe
before update on public.apostila_pages
for each row execute function public.prevent_apostila_content_wipe();

commit;
