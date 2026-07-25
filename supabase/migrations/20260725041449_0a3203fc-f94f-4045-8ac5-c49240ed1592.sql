
-- 1) Add scope + must_change_password fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS content_scope text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_content_scope_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_content_scope_check
      CHECK (content_scope IN ('full','enem_only'));
  END IF;
END $$;

-- 2) Extend security-fields trigger to also protect content_scope (only admin/service can change)
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Service role / migrations (no JWT) and admins can change anything
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.login_attempts IS DISTINCT FROM OLD.login_attempts
     OR NEW.locked_at IS DISTINCT FROM OLD.locked_at
     OR NEW.content_scope IS DISTINCT FROM OLD.content_scope THEN
    RAISE EXCEPTION 'Não é permitido alterar campos de segurança do perfil';
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Bootstrap the restricted student user (G350776 / Vivi@2026)
DO $$
DECLARE
  new_id uuid := gen_random_uuid();
  existing_id uuid;
BEGIN
  SELECT user_id INTO existing_id FROM public.profiles WHERE upper(ra) = 'G350776' LIMIT 1;
  IF existing_id IS NOT NULL THEN
    UPDATE public.profiles
       SET content_scope = 'enem_only',
           must_change_password = true
     WHERE user_id = existing_id;
    RETURN;
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    'g350776@ra.unip.local', crypt('Vivi@2026', gen_salt('bf')), now(),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"ra":"G350776","account_type":"ra","full_name":"Aluno G350776"}'::jsonb,
    '', '', '', ''
  );

  -- Ensure profile exists (handle_new_user trigger may or may not fire in migration context)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = new_id) THEN
    INSERT INTO public.profiles (user_id, full_name, email, ra, account_type)
    VALUES (new_id, 'Aluno G350776', 'g350776@ra.unip.local', 'G350776', 'ra');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = new_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new_id, 'user');
  END IF;

  UPDATE public.profiles
     SET content_scope = 'enem_only',
         must_change_password = true
   WHERE user_id = new_id;
END $$;
