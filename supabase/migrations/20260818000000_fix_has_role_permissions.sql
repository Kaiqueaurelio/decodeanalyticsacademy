-- Corrige as permissões de execução da função has_role para permitir que usuários autenticados verifiquem papéis corretamente
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Garante que a tabela user_roles seja legível por usuários autenticados para verificações de perfil
GRANT SELECT ON public.user_roles TO authenticated;

-- Garante que a tabela profiles seja legível por usuários autenticados
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
