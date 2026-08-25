# Auditoria completa do app — 25/08/2026

## Estado inicial da verificação

O branch `main` está no commit `d51cbc50` (`fix: corrigir renderizacao global das apostilas`) e o checkout local está limpo e sincronizado com `origin/main`.

## Resultados automatizados

O type-check do aplicativo passou. A suíte Vitest passou com **20 arquivos e 122 testes**. O build Vite passou. O lint global falha com **886 problemas** (812 erros e 74 warnings), principalmente `no-explicit-any` e problemas herdados em múltiplos arquivos; esse resultado é débito existente e não impediu o build.

## Deployment

O projeto Vercel `decodeanalyticsacademy` está vinculado ao repositório correto, mas o deployment de produção criado para o commit `d51cbc50` está em estado `BLOCKED`, com `live=false` e sem eventos de build. A proteção de senha, SSO e IP confiável está desabilitada; portanto, o bloqueio não é causado por essas proteções e aponta para a configuração/colaboração da conta Vercel.

O domínio público `https://decodeanalyticsacademy.vercel.app/` responde HTTP 200, porém o bundle lazy atualmente servido para `ApostilaContentRenderer` é diferente do build local corrigido: o chunk publicado não contém o literal `HTML_TABLE` usado pela correção, enquanto o build local contém. Isso indica que a correção das apostilas ainda **não está ativa no domínio público** porque o último deployment ficou bloqueado e o domínio continua apontando para uma versão anterior.

## Rotas públicas

A landing e a tela de login carregam. Rotas internas testadas sem sessão (`/calculadora` e `/comunidade`) redirecionam para `/login?next=...`, sem exposição de conteúdo privado. O fallback de SPA responde HTTP 200 para `/`, `/login`, `/dashboard`, `/apostilas` e `/admin`. Manifest, service worker, robots e sitemap respondem corretamente.

## Riscos e pontos a investigar

O lint direcionado encontrou warnings de dependências de hooks e diversos `any` no renderer, no leitor e em páginas internas. O `npm audit` encontrou 13 vulnerabilidades na árvore instalada: 4 moderadas e 9 altas, incluindo `epubjs`/`@xmldom/xmldom`, `pptxgenjs`/`image-size`, `vite` e dependências transientes. As correções sugeridas para `epubjs` e `pptxgenjs` são major upgrades e precisam de teste funcional antes de aplicação.

As migrações SQL recentes incluem políticas de RLS para o conteúdo publicado e escopos de usuário. A consulta anônima foi testada em tabelas sensíveis; `exercises`, `user_roles`, `app_settings` e `auth_attempts` retornaram `401 permission denied`, enquanto `apostilas`, `apostila_pages`, `profiles` e `security_audit_logs` retornaram listas vazias por política, sem dados expostos.

## Correções implementadas nesta auditoria

A correção do renderer foi reforçada para eliminar control characters usados como tokens de fórmula/tabela, removendo os erros de lint diretamente relacionados ao componente. O fluxo de autenticação passou a revalidar o papel quando a sessão muda e deixou de considerar `profiles.account_type` como autorização administrativa; somente `user_roles` pode conceder admin.

A Edge Function `semantic-search` deixou de consultar o banco com `service_role` em nome do usuário. Ela agora mantém o JWT do chamador ao invocar o RPC, valida consultas entre 2 e 1000 caracteres e retorna mensagens de erro genéricas. A migração `20260825043000_semantic_search_scope_hardening.sql` aplica publicação, categoria e escopo (`full`/`enem_only`) no resultado do banco, com limite máximo de 50 resultados.

A migração `20260825050000_profile_admin_fields_hardening.sql` adiciona uma trigger que impede alunos de alterar `account_type`, `content_scope`, bloqueio, tentativas de login, troca obrigatória de senha ou `user_id`. Operações de admin e `service_role` permanecem permitidas.

## Validação final após as correções

A suíte focada passou com **21 testes**, a suíte completa passou com **20 arquivos e 124 testes**, o type-check passou, o build de produção passou e `git diff --check` não encontrou problemas. O lint do renderer passou sem erros, restando apenas um warning de Fast Refresh por exportação de helper.

## Limitações da auditoria autenticada

O teste efetivo das telas de aluno e administrador não foi executado com uma senha recebida por mensagem. O acesso autenticado deve ser feito por login direto no navegador ou por uma conta temporária de teste. A análise estática cobriu os guards, as rotas, as queries e os pontos de autorização, e os endpoints públicos foram testados sem sessão.

## Publicação das correções

As alterações foram commitadas e enviadas ao `main` no commit `489b1fd0` (`security: harden app audit findings`). O novo deployment Vercel `dpl_8t74dHeK5tLk2GsHfSzRYa5FdNNL` ficou `READY` no alias `decodeanalyticsacademy-oqxa348t5-decode-analytics-s-projects.vercel.app`. A verificação do bundle confirmou `HTML_TABLE` e `dangerouslySetInnerHTML` no chunk publicado, compatíveis com o renderer corrigido.

O domínio principal `decodeanalyticsacademy.vercel.app` continua servindo o deployment antigo (`index-Dc2uOsr8.js`), enquanto o alias de branch aponta para o novo build (`index-msEr4oV3.js`). Portanto, a aplicação corrigida já está compilada e acessível no alias novo, mas o apontamento de produção/domínio principal ainda precisa ser atualizado no Vercel para que todos os alunos recebam a versão corrigida.

## Verificação visual do novo deployment

A landing do deployment `decodeanalyticsacademy-oqxa348t5-decode-analytics-s-projects.vercel.app` carregou após o splash inicial, apresentou navegação, hero, CTA e seções de recursos, e não exibiu tela branca. O console do navegador não registrou erros ou promessas não tratadas durante o carregamento observado.
