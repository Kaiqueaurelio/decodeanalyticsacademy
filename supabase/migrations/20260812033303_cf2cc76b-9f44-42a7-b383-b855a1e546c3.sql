
DO $$
DECLARE
    v_user1_id UUID;
    v_user2_id UUID;
BEGIN
    -- 1. Garantir permissões para decodeanalytics@outlook.com.br
    SELECT id INTO v_user1_id FROM auth.users WHERE email = 'decodeanalytics@outlook.com.br';
    
    IF v_user1_id IS NOT NULL THEN
        -- Garantir Profile
        INSERT INTO public.profiles (user_id, email, full_name, account_type, content_scope)
        VALUES (v_user1_id, 'decodeanalytics@outlook.com.br', 'Admin Principal', 'admin', 'full')
        ON CONFLICT (user_id) DO UPDATE SET account_type = 'admin', content_scope = 'full';

        -- Garantir Role na user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user1_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    -- 2. Garantir permissões para o RA G802144
    -- O RA pode estar vinculado ao email real ou ao email interno padrão do sistema (.unip.local)
    SELECT id INTO v_user2_id FROM auth.users 
    WHERE email ILIKE 'g802144@ra.unip.local' 
       OR email ILIKE 'G802144@ra.unip.local'
       OR id IN (SELECT user_id FROM public.profiles WHERE ra = 'G802144');
    
    IF v_user2_id IS NOT NULL THEN
        -- Garantir Profile
        INSERT INTO public.profiles (user_id, ra, full_name, account_type, content_scope)
        VALUES (v_user2_id, 'G802144', 'Admin RA', 'admin', 'full')
        ON CONFLICT (user_id) DO UPDATE SET ra = 'G802144', account_type = 'admin', content_scope = 'full';

        -- Garantir Role na user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user2_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
