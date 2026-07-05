# Melhorias sugeridas para o Decode Analytics Academy

Baseado na análise do app (dashboard, Ella, biblioteca, gamificação, admin), aqui está um roadmap priorizado. Cada item indica **impacto** (🔥 alto / ⚡ médio / ✨ polish) e **esforço** (S/M/L).

## 1. Performance & Estabilidade

- 🔥 **S — Lazy load de rotas pesadas**: `AdminApostilaWorkbench`, `EllaPage`, `BibliotecaPage`, `PlayBooksPage`, `SimuladoPage` via `React.lazy` + `Suspense`. Reduz o bundle inicial e acelera o TTI no mobile (viewport atual 414px).
- 🔥 **S — Prefetch de dados no hover** dos cards de apostila (usar `queryClient.prefetchQuery`), tornando a abertura quase instantânea.
- ⚡ **M — Virtualização** da grade "Minhas Disciplinas" e do `StudyFeedSection` quando houver >30 itens (`@tanstack/react-virtual`).
- ⚡ **S — Skeletons consistentes**: hoje há mistura de `animate-pulse` cru e `PageSkeleton`. Padronizar em todas as seções do dashboard.
- ✨ **S — Web Vitals no `DiagnosticsPanel`** (LCP, INP, CLS) para monitorar regressões.

## 2. Ella Copilot

- 🔥 **M — Streaming de resposta** (SSE) na edge `ella-chat` em vez de aguardar payload completo — reduz percepção de latência drasticamente.
- 🔥 **S — Indicador "Ella está pensando/consultando X"** durante tool calls, com o nome da ferramenta em execução.
- ⚡ **M — Memória de conversa curta** (últimas 5 threads) persistida em `ella_threads` para continuidade entre sessões.
- ⚡ **S — Sugestões contextuais** na tela (chips "resumir esta apostila", "gerar flashcards daqui") quando a Ella é aberta dentro de `/apostila/:id`.
- ✨ **S — Atalho global** `Ctrl/Cmd+K` já existe no `CommandPalette`; adicionar `Ctrl/Cmd+J` para abrir a Ella.

## 3. Dashboard & UX

- 🔥 **S — Consolidar seções redundantes**: `StudyFeedSection`, `DisciplineFlowSection`, `QuickPracticeSection` e `EndlessHintSection` repetem materiais/exercícios já mostrados acima. Recomendo colapsar em **uma** seção "Continuar estudando" (feed único) + "Revisão rápida". Reduz altura da página em ~40% e melhora foco.
- ⚡ **S — Card "Retomar de onde parou"** promovido para logo abaixo do `HeroGreetingCard` no mobile (hoje `ContinueWhereLeftCard` existe mas fica escondido).
- ⚡ **M — Filtros persistentes** (semestre, disciplina, status) na grade de disciplinas, salvos em `localStorage`.
- ✨ **S — Densidade do mobile**: no viewport 414px, `grid-cols-2` fica apertado; usar `grid-cols-1` até 380px e ajustar padding.

## 4. Estudo & Aprendizado

- 🔥 **M — Modo Foco**: fullscreen na apostila com Pomodoro embutido, oculta sidebar/ads, marca sessão de estudo automaticamente para gamificação.
- 🔥 **M — Revisão SRS unificada**: hoje flashcards e "Caderno de erros" (`MistakesNotebookCard`) são separados. Unir em uma fila diária "Revisar hoje" já existente (`ReviewTodayCard`) com contador no sidebar.
- ⚡ **M — Highlight + anotação inline** na apostila com salvamento automático (parcialmente em `AnnotationsPanel`, falta o gesto de selecionar texto).
- ⚡ **S — Progresso de leitura por scroll** já existe; expor barra fina no topo do `ApostilaPage` (estilo Medium).

## 5. Gamificação & Engajamento

- ⚡ **S — Streak em risco**: notificação/toast quando faltar <4h para perder o streak do dia.
- ⚡ **S — Badges visuais no perfil** com progresso ("faltam 3 apostilas para desbloquear Maratonista").
- ✨ **S — Comparativo semanal** no `WeeklyGoalWidget`: "você estudou +18% vs semana passada".

## 6. Admin

- ⚡ **M — Bulk actions** na lista de apostilas (publicar/arquivar/mover categoria em lote).
- ⚡ **S — Diff visual** ao reimportar apostila existente, para evitar sobrescrever manualmente.
- ✨ **S — Atalho de teclado** para salvar no `AdminApostilaWorkbench` (`Ctrl+S`).

## 7. Mobile / PWA

- 🔥 **S — Bottom nav com badge** de notificações e revisões pendentes (`MobileBottomNav` hoje sem badges).
- ⚡ **M — Offline real para apostilas favoritas**: service worker faz cache do HTML da apostila + imagens.
- ✨ **S — Haptics** nos gestos de swipe (`SwipeableRow`).

## 8. Acessibilidade & Polish

- ⚡ **S — `aria-label` faltantes** em botões-ícone (varredura no `src/components`).
- ⚡ **S — Foco visível** consistente em cards clicáveis do dashboard.
- ✨ **S — Modo alto contraste** como toggle no perfil.

---

## Como quer prosseguir?

Sugiro começar por **um bloco pequeno e de alto impacto**:

**Sprint 1 recomendado (rápido, alto impacto):**
1. Lazy load de rotas pesadas (1)
2. Streaming da Ella + indicador de tool call (2)
3. Consolidar seções redundantes do dashboard (3)
4. Bottom nav com badges (7)

Me diga qual bloco (ou combinação) você quer que eu implemente e eu volto com um plano detalhado com arquivos e mudanças específicas.
