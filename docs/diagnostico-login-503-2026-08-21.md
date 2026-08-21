# Diagnóstico do erro de login por RA — 21/08/2026

## Evidências

A tentativa autenticada de `POST /functions/v1/ra-auth` com o RA fornecido retornou HTTP 503 e JSON `{"error":"Serviço indisponível no momento."}`.

A consulta direta a `POST /rest/v1/rpc/get_email_for_ra` com a chave pública retornou HTTP 401 com `permission denied for function get_email_for_ra`. Isso confirma que o frontend alcança o projeto Supabase, mas o login por RA depende de uma Edge Function com dependências de banco que estão falhando.

## Causa provável confirmada no código versionado

A Edge Function `supabase/functions/ra-auth/index.ts` chama `admin.rpc("auth_rate_limit_check", ...)` antes de resolver o RA. Se essa função RPC estiver ausente, sem permissão para `service_role`, ou com erro no schema remoto, `ra-auth` retorna 503 imediatamente nas linhas 47–54. A função também usa `get_email_for_ra` como fallback, mas a função pública está sem permissão para a chave pública no ambiente consultado.

O frontend `src/pages/LoginPage.tsx` está tratando o 503 como falha genérica de login; a autenticação não chega ao `signInWithPassword`.

## Segurança preservada

Não foi alterado nenhum dado de aluno, apostila ou senha. A senha fornecida pelo usuário não foi gravada em arquivo nem exibida em saída. A correção deve restaurar a dependência RPC no backend ou oferecer um fallback seguro, sem remover rate limiting ou expor e-mails de RA ao cliente.
