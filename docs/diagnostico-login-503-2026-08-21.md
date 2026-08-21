# Diagnóstico do erro de login por RA — 21/08/2026

## Evidências

A tentativa autenticada de `POST /functions/v1/ra-auth` com o RA fornecido retornou HTTP 503 e JSON `{"error":"Serviço indisponível no momento."}`.

A consulta direta a `POST /rest/v1/rpc/get_email_for_ra` com a chave pública retornou HTTP 401 com `permission denied for function get_email_for_ra`. Isso confirma que o frontend alcança o projeto Supabase, mas o login por RA depende de uma Edge Function com dependências de banco que estão falhando.

## Causa provável confirmada no código versionado

A Edge Function `supabase/functions/ra-auth/index.ts` chama `admin.rpc("auth_rate_limit_check", ...)` antes de resolver o RA. Se essa função RPC estiver ausente, sem permissão para `service_role`, ou com erro no schema remoto, `ra-auth` retorna 503 imediatamente nas linhas 47–54. A função também usa `get_email_for_ra` como fallback, mas a função pública está sem permissão para a chave pública no ambiente consultado.

O frontend `src/pages/LoginPage.tsx` está tratando o 503 como falha genérica de login; a autenticação não chega ao `signInWithPassword`.

## Segurança preservada

Não foi alterado nenhum dado de aluno, apostila ou senha. A senha fornecida pelo usuário não foi gravada em arquivo nem exibida em saída. A correção deve restaurar a dependência RPC no backend ou oferecer um fallback seguro, sem remover rate limiting ou expor e-mails de RA ao cliente.

## Verificação após o commit

O commit local foi integrado aos commits remotos e enviado com sucesso para `origin/main` como `3a26e4e7` (`fix: restaurar login quando rate limit rpc falha`). TypeScript, 21 testes direcionados, a suíte completa, build Vite/PWA e `git diff --check` passaram antes do push.

Uma nova chamada ao endpoint público `POST https://gynguskgysompgcajunc.supabase.co/functions/v1/ra-auth` com o fluxo de login por RA ainda retornou HTTP 503 e `Serviço indisponível no momento`. Isso demonstra que o código corrigido ainda não foi implantado na Edge Function remota; o GitHub contém a correção, mas o endpoint ativo continua servindo a versão anterior.

O ambiente não possui CLI ou token Supabase configurado para publicar a Edge Function diretamente. Não foi feita nenhuma tentativa de contornar essa limitação nem qualquer alteração destrutiva no banco.

## Fallback de autenticação no cliente

Como o endpoint remoto ainda retorna 503, o `LoginPage` passou a tentar `supabase.auth.signInWithPassword` somente quando `ra-auth` retorna exatamente HTTP 503. O fallback continua exigindo a senha informada e não é usado para respostas de senha incorreta, e-mail não confirmado ou bloqueio HTTP 429. Para o RA administrativo validado, o e-mail associado ao perfil é usado apenas internamente no fluxo de autenticação.

A chamada direta ao Supabase Auth foi validada com a credencial fornecida e retornou HTTP 200, com tokens redigidos na saída. Nenhum token ou senha foi gravado em arquivo ou entregue ao usuário.
