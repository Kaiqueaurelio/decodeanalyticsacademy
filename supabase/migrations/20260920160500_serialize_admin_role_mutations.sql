-- Serialize administrator role mutations so the last-admin guard
-- cannot be bypassed by concurrent requests.

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  _target_user_id uuid,
  _new_role public.app_role
)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('decode_admin_role_guard', 0));

  IF _new_role = 'admin'::public.app_role THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.profiles
    SET account_type = 'admin'
    WHERE user_id = _target_user_id;
  ELSE
    SELECT count(*) INTO current_admin_count
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role;

    IF current_admin_count <= 1
       AND EXISTS (
         SELECT 1
         FROM public.user_roles
         WHERE user_id = _target_user_id
           AND role = 'admin'::public.app_role
       ) THEN
      RAISE EXCEPTION 'cannot remove the last administrator' USING ERRCODE = 'P0001';
    END IF;

    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id;

    UPDATE public.profiles
    SET account_type = 'ra'
    WHERE user_id = _target_user_id
      AND account_type = 'admin';
  END IF;

  RETURN _new_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  _target_user_id uuid,
  _new_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin authorization required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('decode_admin_role_guard', 0));

  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'target user is required' USING ERRCODE = '22023';
  END IF;

  IF _new_role NOT IN ('admin'::public.app_role, 'user'::public.app_role) THEN
    RAISE EXCEPTION 'invalid role' USING ERRCODE = '22023';
  END IF;

  IF _new_role = 'user'::public.app_role THEN
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
      RAISE EXCEPTION 'cannot remove the last administrator' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _new_role);

  UPDATE public.profiles
  SET account_type = CASE
        WHEN _new_role = 'admin'::public.app_role THEN 'admin'
        ELSE 'ra'
      END,
      content_scope = CASE
        WHEN _new_role = 'admin'::public.app_role THEN 'full'
        ELSE content_scope
      END,
      updated_at = now()
  WHERE user_id = _target_user_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'update_role_' || _new_role::text,
    _target_user_id,
    jsonb_build_object('newRole', _new_role::text)
  );
END;
$function$;

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

  PERFORM pg_advisory_xact_lock(hashtextextended('decode_admin_role_guard', 0));

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

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_user_completely(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(uuid) TO authenticated;
