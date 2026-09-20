grant execute on function public.increment_xp(uuid, integer) to authenticated;
revoke execute on function public.increment_xp(uuid, integer) from anon;