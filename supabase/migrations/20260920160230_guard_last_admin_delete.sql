-- Prevent deleting the last administrator account.
CREATE OR REPLACE FUNCTION public.delete_user_completely(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Permission denied: only admins can delete users' USING ERRCODE = '42501';
  END IF;

  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'target user is required' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_admin_count
  FROM public.user_roles
  WHERE role = 'admin'::public.app_role;

  IF v_admin_count <= 1
     AND EXISTS (
       SELECT 1
       FROM public.user_roles
       WHERE user_id = _target_user_id
         AND role = 'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION 'cannot delete the last administrator' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.answers WHERE user_id = _target_user_id;
  DELETE FROM public.annotations WHERE user_id = _target_user_id;
  DELETE FROM public.flashcards WHERE user_id = _target_user_id;
  DELETE FROM public.pomodoro_sessions WHERE user_id = _target_user_id;
  DELETE FROM public.comments WHERE user_id = _target_user_id;
  DELETE FROM public.activity_logs WHERE user_id = _target_user_id;
  DELETE FROM public.downloads WHERE user_id = _target_user_id;
  DELETE FROM public.respostas_foto WHERE user_id = _target_user_id;
  DELETE FROM public.security_alerts WHERE user_id = _target_user_id;
  DELETE FROM public.study_streaks WHERE user_id = _target_user_id;
  DELETE FROM public.user_badges WHERE user_id = _target_user_id;
  DELETE FROM public.user_xp WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;

  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_user_completely(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(uuid) TO authenticated;
