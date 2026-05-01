## Diagnóstico

Mapeei os principais pontos que estão "comendo" performance hoje (sem mexer em features):

1. **Dashboard carrega tudo de uma vez**: `DashboardPage` importa ~40 widgets de forma estática e busca `apostilas`, `exercises` e a tabela inteira de `answers` (com joins) no primeiro render. Isso bloqueia a primeira tela e segura o JS thread.
2. **Selects amplos** (`select('*')`) em várias páginas (Admin, Community, Profile, Dashboard) puxam colunas pesadas (incluindo o novo `content_backup` em `apostilas`, que pode ter centenas de KB).
3. **Sem cache do React Query**: configuramos o `QueryClient`, mas quase ninguém usa `useQuery` — toda navegação refaz fetch direto via `supabase.from(...)`.
4. **Widgets globais sempre montados**: `DynamicWatermark` (12 tiles + timer + fetch IP), `ScreenshotGuard`, `CommandPalette`, `PullToRefresh`, `QuickActionsFab`, `ScrollToTopFab` ficam ativos em todas as rotas, mesmo em telas onde não fazem sentido (login, biblioteca, leitor de PDF).
5. **`PageStatePersistence` muito caro**: escuta `input`/`change` em `document` com `useCapture` e a cada evento varre todos os `input/textarea/select` da página. Em telas com formulários grandes (Admin, Editor) isso causa jank a cada tecla.
6. **`ScrollRestoration` salva no `localStorage` em todo evento de scroll** (passive, mas ainda assim grava JSON a cada frame de rolagem).
7. **Bundle inicial maior que o necessário**: `framer-motion` está no entry da Landing/Login, e ícones do `lucide-react` são importados em massa.
8. **`api.ipify.org`** é chamado por toda sessão autenticada — adiciona latência e pode falhar lentamente.

## O que vamos fazer

### 1. Dashboard mais leve
- Code-split dos widgets "abaixo da dobra" com `React.lazy` + `Suspense` (Leaderboard, EvolutionChart, StudyHeatmap, CategoryPerformanceChart, FlashcardSummaryWidget, MistakesNotebookCard, OverallProgressCard, etc.). O hero (saudação, streak, continuar de onde parou, CTA) renderiza imediatamente.
- Substituir `select('*')` em `apostilas` por colunas explícitas (sem `content` nem `content_backup`); o conteúdo só carrega na `ApostilaPage`.
- Trocar `select('*')` em `answers` por agregação no servidor (RPC `get_dashboard_stats(user_id)` que já retorna totais e por apostila). Cai de "linha por resposta" para uma chamada O(1) de tamanho.
- Migrar essas chamadas para `useQuery` com chaves estáveis para reaproveitar o cache de 5min já configurado.

### 2. Overlays globais sob demanda
- `WatermarkWrapper` só monta em rotas de conteúdo protegido (apostila, exercícios, materiais, vídeo, livros). Login, Landing, Offline e Biblioteca de PDF ficam sem watermark/screenshot guard rodando.
- `CommandPalette`, `ScrollToTopFab`, `PullToRefresh`, `QuickActionsFab` viram `lazy` e só montam após `requestIdleCallback` (não competem pelo first paint).
- Watermark: reduzir tiles de 12 → 6 e remover o timer de 60s (atualizar só ao trocar de rota). Manter o conteúdo visível.
- Remover a chamada a `api.ipify.org`; usar `"—"` como placeholder ou pegar o IP via uma única função edge cacheada na sessão.

### 3. Persistência de estado mais barata
- `PageStatePersistence`: trocar listener global por opt-in (`data-persist-key` obrigatório). Hoje qualquer input dispara varredura DOM completa — o opt-in mantém a feature, mas só roda nos campos marcados.
- Debounce de 400ms na coleta + `requestIdleCallback`.
- `ScrollRestoration`: já é passive, mas adicionar throttle (rAF) e gravar no `sessionStorage` apenas no `pagehide`/`visibilitychange`. Durante o scroll, mantemos só em memória.

### 4. Cache de dados (React Query)
- Criar hooks `useApostilas()`, `useApostilaById(id)`, `useExerciseCounts()`, `useDashboardStats()` em `src/hooks/queries/` usando `useQuery`. Páginas/widgets passam a consumir esses hooks → navegação volta instantânea com `staleTime` de 5min já configurado.
- Não removemos nenhum lugar que faz `supabase.from(...)`; só os trocamos por hooks que internamente continuam chamando o Supabase. Mesma feature, com cache.

### 5. Bundle e ícones
- Mover `framer-motion` para fora da Landing/Login (já são páginas críticas no entry). Trocar pelas animações CSS que já temos (`Reveal`, `animate-page-in`).
- Garantir que `recharts`, `pdfjs-dist`, `mermaid`, `mammoth`, `shiki` estão **só** nas rotas que usam (já há `manualChunks`, mas precisamos confirmar que não há import estático em algum widget do Dashboard).
- Adicionar `loading="lazy"` e `decoding="async"` em `<img>` espalhados pelo app (Reveal, MaterialWidget, AnnouncementsBoard).

### 6. Pequenas melhorias de UX que reduzem jank
- `useDebouncedValue` na busca global e nos filtros do Dashboard (categoria/grupo) para evitar re-render a cada tecla.
- `content-visibility: auto` em listas longas (apostilas no Dashboard, materiais, biblioteca) — o navegador pula renderização do que está fora da tela.
- `will-change` removido de elementos estáticos (hoje o `Reveal` deixa fixo, o que aumenta uso de memória).

## Métricas que vou checar depois

Rodo `browser--performance_profile` antes/depois e reporto:
- TTI no Dashboard (alvo: -40%)
- Tamanho do JS baixado no primeiro acesso (alvo: -25%)
- INP médio em digitação no Admin/Editor (alvo: <100ms)
- Long tasks > 200ms (alvo: zero no caminho crítico)

## Ordem de implementação

1. Hooks de query + RPC `get_dashboard_stats` (base para os ganhos maiores)
2. Code-split do Dashboard + `select` enxuto em `apostilas`
3. Overlays globais condicionais
4. PageStatePersistence opt-in + ScrollRestoration throttled
5. Limpeza de bundle (framer-motion fora do entry, lazy de FABs)
6. `content-visibility` + debounces + `loading="lazy"`
7. Medir com performance profile e ajustar

## Garantias

- **Nenhuma funcionalidade removida**: watermark, screenshot guard, command palette, persistência de scroll/forms, animações Reveal — tudo permanece. Só passa a custar menos.
- **Nada quebra para o admin**: `decoanalytics@outlook.com.br` mantém acesso total e os fluxos de Admin/Editor continuam idênticos.
- **Compatível com modo seguro**: as otimizações se somam ao `safeMode` existente.

Posso começar pela etapa 1 (RPC + hooks de query) que dá o maior ganho percebido. Aprovas o plano?
