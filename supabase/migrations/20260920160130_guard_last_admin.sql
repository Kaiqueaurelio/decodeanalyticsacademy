-- Prevent the last administrator from being demoted.
-- Role management must never leave the application without an admin account.

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

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
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

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, public.app_role) TO authenticated;
