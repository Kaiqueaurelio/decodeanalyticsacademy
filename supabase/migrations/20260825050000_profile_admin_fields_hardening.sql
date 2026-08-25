-- Impede elevação de privilégio por UPDATE direto no próprio perfil.
-- O app permite que usuários autenticados atualizem profiles; sem esta trava,
-- account_type/content_scope/is_blocked poderiam ser forjados pelo cliente.

CREATE OR REPLACE FUNCTION public.prevent_profile_admin_field_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
    AND NOT public.has_role(auth.uid(), 'admin'::app_role)
  THEN
    IF NEW.account_type IS DISTINCT FROM OLD.account_type
      OR NEW.content_scope IS DISTINCT FROM OLD.content_scope
      OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
      OR NEW.locked_at IS DISTINCT FROM OLD.locked_at
      OR NEW.login_attempts IS DISTINCT FROM OLD.login_attempts
      OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
    THEN
      RAISE EXCEPTION 'Administrative profile fields can only be changed by an admin';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_admin_field_escalation();

REVOKE ALL ON FUNCTION public.prevent_profile_admin_field_escalation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prevent_profile_admin_field_escalation() TO authenticated;
