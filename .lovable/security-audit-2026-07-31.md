# Relatório de Auditoria de Segurança — Decode Analytics Academy
Data: 2026-07-31 · Escopo: banco, autenticação, edge functions, assistente Ella, frontend.

## Resumo executivo
9 achados. 2 críticos e 2 altos foram corrigidos e reverificados nesta rodada; os
demais são riscos aceitos documentados ou melhorias sem impacto direto.

| # | Achado | Sev. | Estado |
|---|--------|------|--------|
| 1 | `get_email_for_ra` executável por visitantes → enumeração de RA + vazamento de e-mail | Crítico | Corrigido |
| 2 | Links markdown das apostilas sem validação de esquema (`javascript:`) → XSS | Alto | Corrigido |
| 3 | `get_public_leaderboard` expunha nomes de alunos a anônimos | Alto | Corrigido |
| 4 | Filtro anti-SSRF aceitava IPs internos ofuscados (decimal/octal/hex/IPv6/CGNAT) | Médio | Corrigido |
| 5 | `rss_feeds` legível sem login | Médio | Corrigido |
| 6 | `get_apostila_reader_tree` / `count_open_security_notifications` com grant a anon | Baixo | Corrigido |
| 7 | Mensagens de login distinguiam "RA inexistente" de "senha errada" | Baixo | Corrigido |
| 8 | Funções `SECURITY DEFINER` chamáveis por autenticados | Info | Risco aceito |
| 9 | `pgvector` instalado no schema `public` | Info | Risco aceito |

## Correções aplicadas

### 1. Enumeração de RA (crítico)
Antes: `POST /rest/v1/rpc/get_email_for_ra` com a chave pública devolvia o e-mail
real de qualquer aluno a partir do RA — sem login.
Agora: `EXECUTE` revogado de `anon`/`authenticated`; o RA é resolvido apenas dentro
da edge function `ra-auth`, que faz o sign-in no servidor e devolve somente os
tokens de sessão. O e-mail não trafega para o cliente em nenhum momento.
Recuperação de senha por RA usa a mesma função e responde sempre de forma genérica.

### 2. XSS no conteúdo das apostilas (alto)
`renderInline` montava `<a href="$2">` direto do markdown. Adicionado `safeUrl()`
(bloqueia `javascript:`, `data:`, `vbscript:`, `file:`, entidades numéricas e
caracteres de controle) e o sanitizador inline passou a remover handlers `on*`
sem aspas, `href`/`src`/`formaction` em tags inline e `expression()`/`url()` no style.

### 3/5/6. Superfície pública do banco
Revogados os grants para `anon` em `get_public_leaderboard`,
`get_apostila_reader_tree`, `count_open_security_notifications` e
`protect_security_notification_fields`. A política de leitura de `rss_feeds`
passou a exigir `authenticated`.

### 4. SSRF em `news-reader` / `validate-rss`
Ambas já exigiam JWT. O filtro de host foi reforçado: bloqueio de IPv6, hosts
puramente numéricos (`http://2130706433`), octais (`0177.0.0.1`), hexadecimais,
`100.64/10` (CGNAT), `198.18/15`, `192.0.0/24`, `.local`, `.home.arpa` e
`metadata.google.internal`.

## Verificação pós-correção (executada contra a API pública)
- `get_email_for_ra` (anon) → `42501 permission denied` ✅
- `get_public_leaderboard` (anon) → `42501 permission denied` ✅
- `rss_feeds` (anon) → `42501 permission denied` ✅
- `ra-auth` com senha errada → `401 {"error":"RA ou senha incorretos."}` ✅
- `ra-auth` com RA válido → resolve o cadastro e retorna sessão / `email_not_confirmed` ✅
- `ra-auth` com RA inexistente (reset) → `{"ok":true}` genérico, sem oráculo ✅
- `ra-auth` com RA malformado → `400` com mensagem de validação ✅
- Suíte da Ella (`security_test.ts`, 20 cenários de injeção/jailbreak/RBAC) → todos passam ✅
- Edge functions sensíveis (`ella-chat`, `admin-set-password`, `send-push`) sem token → `401` ✅

## Riscos aceitos (não são falhas)
- `SECURITY DEFINER` chamáveis por autenticados (`increment_xp`, `award_badge`,
  `check_exercise_answer`, `get_dashboard_stats`…): todas validam `auth.uid()` e
  limites internamente — é o mecanismo que impede escrita direta nas tabelas.
- `pgvector` em `public`: limitação da plataforma, sem impacto de autorização.
- Chave publicável do backend no frontend: comportamento esperado; o acesso real
  é decidido por RLS.

## Recomendações futuras
1. Ativar verificação de senhas vazadas (HIBP) no provedor de e-mail.
2. Rever periodicamente as políticas `USING (true)` de escrita sinalizadas pelo linter.
3. Migrar contas antigas por RA para e-mail real, permitindo recuperação de senha efetiva.
