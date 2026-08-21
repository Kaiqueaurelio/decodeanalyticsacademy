# Validação de segurança administrativa e Dashboard — v6.9.0

## Escopo

Esta validação cobre a padronização dos textos de segurança, a proteção das rotas administrativas, o fluxo de verificação de papel e a sincronização de tipos do Dashboard. Nenhum dado do banco foi alterado durante a implementação.

## Alterações verificadas

A interface passou a usar `src/lib/security-copy.ts` como fonte única para as descrições de navegação, alertas de segurança, auditoria acadêmica e renovação de sessão. As mensagens antigas e inadequadas foram removidas de autenticação, redefinição de senha e sugestões do plano de estudos.

As rotas `/admin`, `/admin/apostilas/:id` e `/admin/biblioteca` permanecem protegidas por `ProtectedRoute` com `adminOnly`. O guardião aguarda `roleChecked`, bloqueia contas marcadas como bloqueadas e redireciona usuários não administradores para `/dashboard`.

O hook `useDashboardData` deixou de usar casts `as any` nos RPCs `get_exercise_counts` e `get_dashboard_stats`. As respostas `Json` agora são validadas por funções de normalização, com números finitos e fallback seguro. Os placeholders do Dashboard passaram a satisfazer diretamente `ApostilaSummary`, incluindo `saved_date: null`.

O changelog recebeu a entrada `6.9.0 — Segurança Administrativa & Dashboard Tipado` em `src/data/changelog.ts`.

## Evidências automatizadas

| Verificação | Resultado |
|---|---:|
| Testes direcionados de segurança e Dashboard | 2 arquivos, 21 testes aprovados |
| Suíte completa Vitest | 16 arquivos, 105 testes aprovados |
| TypeScript (`tsc --noEmit`) | Aprovado |
| Build Vite/PWA | Aprovado |
| `git diff --check` | Aprovado |
| Busca de textos antigos na aplicação | Nenhuma ocorrência em código de produção |
| Dados do banco | Não alterados |

A busca ainda encontra a frase antiga apenas dentro do próprio teste de regressão, onde ela é usada como literal de detecção negativa. Isso é intencional e não é texto exibido pela aplicação.

## Observação do build

O build continua emitindo avisos preexistentes sobre alguns chunks maiores que 500 kB. A compilação e a geração do service worker foram concluídas sem erro.
