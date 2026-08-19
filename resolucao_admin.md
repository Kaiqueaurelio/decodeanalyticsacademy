# Status da Resolução Autônoma do Painel Administrativo

Para que o sistema reconheça o seu usuário (`decoanalytics@outlook.com.br`) como **Administrador absoluto**, a tabela de controle de papéis (`user_roles`) no Supabase precisa receber a associação da role `admin`. 

Como a chave secreta de serviço (`service_role_key`) é restrita por segurança e não fica exposta em ambientes de cliente (frontend/sandbox público), a forma 100% autônoma e definitiva para aplicar essa regra diretamente no banco de dados do Supabase é executar o comando SQL abaixo (o que leva exatamente 10 segundos).

---

### Comando SQL Único (Execute no Supabase SQL Editor)

Acesse o painel do Supabase em [supabase.com/dashboard/project/gynguskgysompgcajunc/sql/new](https://supabase.com/dashboard/project/gynguskgysompgcajunc/sql/new), cole o código abaixo e clique em **Run**:

```sql
-- 1. Promove o usuário decoanalytics@outlook.com.br a admin na tabela user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email ILIKE 'decoanalytics@outlook.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Atualiza o tipo de conta no perfil
UPDATE public.profiles 
SET account_type = 'admin' 
WHERE email ILIKE 'decoanalytics@outlook.com.br';

-- 3. Concede permissão de execução na função has_role para evitar erros de permissão
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- 4. Assegura permissão de leitura nas tabelas de perfil e papéis
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
```

---

### O que acontece após a execução?
1. O banco de dados registra instantaneamente que o seu e-mail possui privilégios de Administrador (`Terminal Root`).
2. Ao acessar [decodeanalyticsacademy.vercel.app](https://decodeanalyticsacademy.vercel.app) e fazer login, o sistema validará o seu papel através da função `has_role` recém-liberada.
3. O botão e o acesso ao painel **Admin** estarão visíveis e operacionais.
