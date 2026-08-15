
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obter o ID do usuário G802144
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'g802144@ra.unip.local';
    
    IF v_user_id IS NOT NULL THEN
        -- Garantir que ele esteja na user_roles como admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Garantir que o perfil dele esteja correto
        UPDATE public.profiles
        SET account_type = 'admin',
            ra = 'G802144'
        WHERE user_id = v_user_id;
    END IF;

    -- Garantir que o admin decoanalytics tenha privilégios na user_roles
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'decoanalytics@outlook.com.br';
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        UPDATE public.profiles
        SET account_type = 'admin'
        WHERE user_id = v_user_id;
    END IF;
    
    -- Tentar encontrar por RA caso o email não bata exatamente
    SELECT user_id INTO v_user_id FROM public.profiles WHERE ra = 'G802144' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        UPDATE public.profiles SET account_type = 'admin' WHERE user_id = v_user_id;
    END IF;
END $$;
