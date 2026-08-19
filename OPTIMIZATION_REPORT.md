# Relatório de otimização — Decode Analytics Academy

## Alterações implementadas

- O chat completo da Ella passou a ser carregado somente quando o aluno abre a janela da assistente. O botão flutuante continua disponível no shell autenticado.
- Os exportadores de PDF e DOCX da página de apostila passaram a ser carregados sob demanda quando o aluno solicita a exportação.
- O parser e o exportador de PDF do painel administrativo passaram a ser carregados somente na ação de exportação.
- O botão pesado de criação de páginas foi separado por carregamento sob demanda no painel administrativo.
- O precache do PWA deixou de baixar todos os chunks JavaScript e imagens de todas as rotas durante a primeira visita. Os recursos são obtidos via cache de runtime conforme o usuário navega.
- O widget de gamificação recebeu estado de carregamento, barra de XP calculada pelo intervalo real do nível atual, texto acessível e uma apresentação mais estável para redes lentas.

## Evidências

| Área | Evidência | Status | Ação restante |
| --- | --- | --- | --- |
| Build | `npm run build` concluído; build em aproximadamente 35 s | Concluído | Nenhuma para esta alteração |
| PWA | Precache reduzido de aproximadamente 24,7 MiB para 562,57 KiB | Concluído | Validar em produção após novo deployment |
| Rotas públicas | Preview local respondeu HTTP 200 em `/`, `/login` e `/vagas` | Concluído | Smoke test autenticado em produção após publicação |
| Code splitting | Ella e exportadores agora usam importação sob demanda | Concluído | Monitorar cache hit e erro de chunk |
| Lint | O repositório possui 797 problemas preexistentes, principalmente `no-explicit-any` em código amplo, Edge Functions e configurações | Pendente | Tratar em uma rodada separada, por domínio |
| Produção | A Vercel pode manter deployments protegidos por SSO | Pendente | Confirmar o deployment e o domínio de produção no painel Vercel |

## Arquivos alterados

- `src/components/ella/EllaSidebar.tsx`
- `src/components/gamification/GamificationWidget.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/ApostilaPage.tsx`
- `vite.config.ts`

A redução do precache é intencional: o app continua com cache em runtime para scripts, estilos e imagens, mas evita baixar rotas administrativas, leitores e linguagens de programação que o visitante ainda não acessou.

## Limitação conhecida

O build ainda emite avisos de chunks individuais acima de 500 kB em módulos de conteúdo/editor e na rota administrativa. Eles não são baixados no shell inicial após o code splitting, mas podem ser alvo de uma segunda etapa específica por funcionalidade.

Data: 19 de agosto de 2026
