# Correção do login bloqueado ("Failed to fetch")

## O que está acontecendo

O erro exibido na tela ("RA/e-mail ou senha incorretos") é enganoso: a senha nunca chega a ser verificada. A requisição de login é recusada pelo navegador **antes** de chegar ao serviço de autenticação.

Diagnóstico confirmado nesta sessão:

- O painel de rede mostra `POST .../functions/v1/ra-auth` terminando em `Failed to fetch`, sem status HTTP.
- Testei o serviço diretamente: ele responde, mas **não devolve a autorização de origem** para o endereço atual do preview (`...lovableproject.com`).
- A lista de endereços autorizados no código (`supabase/functions/_shared/cors.ts`) contém apenas `lovable.app`, `vercel.app` e `localhost`. O domínio de preview atual e o domínio próprio `decodeanalyticsacademy.com.br` ficaram de fora.

Ou seja: o navegador bloqueia a chamada por falta de permissão de origem, e a tela interpreta a falha como credencial inválida. Isso afeta o login por e-mail e por RA da mesma forma.

## O que será feito

1. **Liberar as origens legítimas** na configuração central de origens usada pelos serviços:
   - domínios de preview do editor (`*.lovableproject.com` e variantes de preview);
   - o domínio publicado e o domínio próprio da academia (`decodeanalyticsacademy.com.br`, com e sem `www`);
   - manter os endereços já autorizados hoje (publicado, Vercel e ambiente local).
   Origens fora dessa lista continuam sem permissão — a proteção permanece.

2. **Republicar os serviços afetados**, começando por `ra-auth` (login), para que a nova regra passe a valer imediatamente.

3. **Corrigir a mensagem de erro do login** para separar dois casos distintos:
   - falha de comunicação com o servidor → mensagem de indisponibilidade, sem contar tentativa nem sugerir senha errada;
   - credencial realmente recusada pelo servidor → mensagem atual de tentativa.
   Hoje uma falha de rede consome tentativas do contador, o que pode levar o aluno a um bloqueio temporário sem ter errado a senha.

4. **Validar o login de ponta a ponta** com a conta administrativa e com um acesso por RA, confirmando entrada no painel.

## Detalhes técnicos

- `supabase/functions/_shared/cors.ts`: ampliar `ALLOWED_ORIGINS` e a verificação por sufixo para incluir `.lovableproject.com`, `.lovableproject-dev.com` e o domínio próprio; manter a ausência de `Access-Control-Allow-Origin` para origens não reconhecidas.
- Redeploy das funções que importam `getCorsHeaders` (31 arquivos compartilham a mesma regra), com prioridade para `ra-auth`.
- `src/pages/LoginPage.tsx`: no bloco `callRaAuth`, distinguir `FunctionsFetchError`/`TypeError: Failed to fetch` de resposta de credencial inválida, e não incrementar o contador de tentativas em falha de transporte.
- Escopo restrito ao fluxo de autenticação e à configuração de origens; nenhuma alteração de layout, conteúdo ou regras de acesso.
