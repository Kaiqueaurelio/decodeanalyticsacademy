begin;

-- Conteúdo salvo torna o estado editorial consistente para o leitor.
-- Não publica apostilas vazias; apenas normaliza o status quando há conteúdo.
create or replace function public.save_apostila(
  _apostila_id uuid,
  _expected_revision bigint,
  _title text,
  _category text,
  _content text,
  _published boolean,
  _semester integer,
  _course text[],
  _saved_date date
)
returns public.apostilas
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  saved public.apostilas;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='Authentication required';
  end if;
  if not public.has_role((select auth.uid()), 'admin') then
    raise exception using errcode='42501', message='Admin role required';
  end if;
  perform set_config('app.allow_content_wipe','on',true);

  update public.apostilas
  set title=coalesce(_title,title),
      category=coalesce(_category,category),
      content=coalesce(_content,content),
      published=coalesce(_published,published),
      status=case when length(trim(coalesce(_content,'')))>0 then 'liberada' else status end,
      semester=_semester,
      course=_course,
      saved_date=coalesce(_saved_date,saved_date),
      updated_at=now(),
      content_revision=content_revision+1
  where id=_apostila_id and content_revision=_expected_revision
  returning * into saved;

  if not found then
    raise exception using errcode='40001', message='Apostila was modified by another save. Reload before saving again.';
  end if;
  return saved;
end;
$$;

create or replace function public.save_apostila_page(
  _page_id uuid,
  _apostila_id uuid,
  _expected_revision bigint,
  _title text,
  _content text,
  _saved_date date
)
returns public.apostila_pages
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare saved public.apostila_pages;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if not public.has_role((select auth.uid()), 'admin') then raise exception using errcode='42501', message='Admin role required'; end if;
  perform set_config('app.allow_content_wipe','on',true);

  update public.apostila_pages
  set title=coalesce(_title,title),
      content=coalesce(_content,content),
      saved_date=coalesce(_saved_date,saved_date),
      updated_at=now(),
      content_revision=content_revision+1
  where id=_page_id and apostila_id=_apostila_id and content_revision=_expected_revision
  returning * into saved;

  if not found then raise exception using errcode='40001', message='Apostila page was modified by another save. Reload before saving again.'; end if;

  if length(trim(coalesce(_content,'')))>0 then
    update public.apostilas
    set published=true, status='liberada', updated_at=now()
    where id=_apostila_id;
  end if;

  return saved;
end;
$$;

revoke execute on function public.save_apostila(uuid,bigint,text,text,text,boolean,integer,text[],date) from public, anon;
revoke execute on function public.save_apostila_page(uuid,uuid,bigint,text,text,date) from public, anon;
grant execute on function public.save_apostila(uuid,bigint,text,text,text,boolean,integer,text[],date) to authenticated;
grant execute on function public.save_apostila_page(uuid,uuid,bigint,text,text,date) to authenticated;

commit;
