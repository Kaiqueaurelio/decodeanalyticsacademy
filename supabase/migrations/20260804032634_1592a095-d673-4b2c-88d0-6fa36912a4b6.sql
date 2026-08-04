CREATE OR REPLACE FUNCTION public.force_complete_semesters_upto_five(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Remove any existing progress or 'in_progress' status by ensuring they are all in the completions table
  -- First, we can optionally clear related tables if there's a specific 'progress' table, 
  -- but usually 'completions' is the source of truth for "concluído".
  
  INSERT INTO public.apostila_completions (user_id, apostila_id)
  SELECT _user_id, id
  FROM public.apostilas
  WHERE semester <= 5 AND published = true
  ON CONFLICT DO NOTHING;
  
  -- If there's a 'user_apostila_stats' or similar that tracks "status", we should update it to 'completed'
  -- checking table names from context (apostilas, apostila_completions were confirmed).
END;
$function$;

GRANT EXECUTE ON FUNCTION public.force_complete_semesters_upto_five(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.force_complete_semesters_upto_five(uuid) TO service_role;