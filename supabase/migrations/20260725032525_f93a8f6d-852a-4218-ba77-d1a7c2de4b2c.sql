
-- 1) apostila_shares: restringir SELECT ao dono ou admin
DROP POLICY IF EXISTS "Authenticated users can view shares" ON public.apostila_shares;
CREATE POLICY "Owners or admins can view shares"
  ON public.apostila_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- 2) profiles: bloquear alteração de campos de segurança por usuários comuns
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.login_attempts IS DISTINCT FROM OLD.login_attempts
     OR NEW.locked_at IS DISTINCT FROM OLD.locked_at THEN
    RAISE EXCEPTION 'Não é permitido alterar campos de segurança do perfil';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_security_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_security_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();
