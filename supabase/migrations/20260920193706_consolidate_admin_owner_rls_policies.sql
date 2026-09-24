drop policy if exists "Admins can delete any comment" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
create policy "Admins or owners can delete comments"
on public.comments as permissive for delete to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id);

drop policy if exists "Admins can delete any reply" on public.community_replies;
drop policy if exists "Users can delete own replies" on public.community_replies;
create policy "Admins or owners can delete replies"
on public.community_replies as permissive for delete to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id);

drop policy if exists "Admins podem ver os bloqueios" on public.ella_user_blocks;
drop policy if exists "Usuário vê o próprio bloqueio" on public.ella_user_blocks;
create policy "Admins or owners can view Ella blocks"
on public.ella_user_blocks as permissive for select to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or user_id = auth.uid());

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Admins or owners can view profiles"
on public.profiles as permissive for select to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id);

drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Admins or owners can update profiles"
on public.profiles as permissive for update to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id)
with check (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id);

drop policy if exists "Admins can view all respostas_foto" on public.respostas_foto;
drop policy if exists "Users can view own respostas_foto" on public.respostas_foto;
create policy "Admins or owners can view respostas_foto"
on public.respostas_foto as permissive for select to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id);

drop policy if exists "Admins view all tira-duvidas" on public.tira_duvidas;
drop policy if exists "Users view own tira-duvidas" on public.tira_duvidas;
create policy "Admins or owners can view tira-duvidas"
on public.tira_duvidas as permissive for select to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or auth.uid() = user_id);