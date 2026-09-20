create schema if not exists extensions;
alter extension vector set schema extensions;

alter function public.match_apostila(extensions.vector) set search_path = public, extensions;
alter function public.match_semantic_content(extensions.vector, double precision, integer) set search_path = public, extensions;
