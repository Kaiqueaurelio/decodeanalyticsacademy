-- Migration robusta para garantir que decoanalytics@outlook.com.br seja admin absoluto
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Encontra o ID do usuário pelo e-mail
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email ILIKE 'decoanalytics@outlook.com.br';

  IF target_user_id IS NOT NULL THEN
    -- 2. Garante o perfil como admin
    INSERT INTO public.profiles (user_id, email, full_name, account_type)
    VALUES (target_user_id, 'decoanalytics@outlook.com.br', 'Kaique Aurélio (Admin)', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET account_type = 'admin', email = 'decoanalytics@outlook.com.br';

    -- 3. Garante a role admin na tabela user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 4. Restaura todas as permissões de execução e leitura necessárias para o sistema de autenticação e papéis
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
