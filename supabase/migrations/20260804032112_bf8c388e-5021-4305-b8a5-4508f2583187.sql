CREATE OR REPLACE FUNCTION public.complete_semesters_upto_five(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.apostila_completions (user_id, apostila_id)
  SELECT _user_id, id
  FROM public.apostilas
  WHERE semester <= 5 AND published = true
  ON CONFLICT DO NOTHING;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.complete_semesters_upto_five(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.complete_semesters_upto_five(uuid) TO service_role;