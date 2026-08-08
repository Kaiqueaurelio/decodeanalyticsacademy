CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.login_attempts IS DISTINCT FROM OLD.login_attempts
     OR NEW.locked_at IS DISTINCT FROM OLD.locked_at
     OR NEW.content_scope IS DISTINCT FROM OLD.content_scope
     OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password
     OR NEW.account_type IS DISTINCT FROM OLD.account_type
     OR NEW.ra IS DISTINCT FROM OLD.ra
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar campos de segurança do perfil';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_security_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_security_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();

CREATE OR REPLACE FUNCTION public.complete_fifth_semester_apostilas(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.apostila_completions (user_id, apostila_id)
  SELECT _user_id, id
  FROM public.apostilas
  WHERE semester = 5 AND published = true
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ad_counters()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'ad_views') THEN
            UPDATE public.ads SET view_count = view_count + 1 WHERE id = NEW.ad_id;
        ELSIF (TG_TABLE_NAME = 'ad_clicks') THEN
            UPDATE public.ads SET click_count = click_count + 1 WHERE id = NEW.ad_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'ad_views') THEN
            UPDATE public.ads SET view_count = GREATEST(0, view_count - 1) WHERE id = OLD.ad_id;
        ELSIF (TG_TABLE_NAME = 'ad_clicks') THEN
            UPDATE public.ads SET click_count = GREATEST(0, click_count - 1) WHERE id = OLD.ad_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;