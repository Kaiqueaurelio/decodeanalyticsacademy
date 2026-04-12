

# Redesign Completo — Decode Analytics Academy

## Resumo

Redesign visual completo do app adotando estética "Editorial Técnico-Premium" (inspirado em Linear/Vercel), com nova paleta escura (`#0A0A0B` base, `#E8FF47` acento), novas fontes (Instrument Serif + DM Mono + Plus Jakarta Sans), e textura grain no background. **Todas as funcionalidades existentes serão preservadas** (gamificação, pomodoro, flashcards, heatmap, leaderboard, admin com import/batch/materiais, watermark, etc).

---

## Escopo das Mudanças

### Fase 1 — Fundação Visual (CSS + Config)

1. **`src/index.css`**: Substituir toda a paleta CSS variables por nova paleta escura. Adicionar SVG grain filter inline e classes utilitárias para o novo design (bordas finas `rgba(255,255,255,0.08)`, cards sem sombra). Importar Instrument Serif e DM Mono do Google Fonts.

2. **`tailwind.config.ts`**: Adicionar as novas fontes (`font-display`, `font-mono-label`), cores de acento (`lime: #E8FF47`, `mint: #6EE7B7`), e cores por matéria. Remover animações não usadas; manter as necessárias (fade-in, accordion, etc).

3. **Componentes UI base** (`button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `progress.tsx`): Ajustar estilos para seguir a nova estética — bordas finas, sem sombras genéricas, border-radius menor (`4px-8px`), botão primário com fundo `#E8FF47` e texto preto em mono uppercase.

### Fase 2 — Páginas Principais

4. **`LandingPage.tsx`**: Redesenhar hero com headline "Sua apostila. Organizada. Automaticamente.", tipografia Instrument Serif, CTAs duplos (Entrar como Estudante / Acessar como Admin), animação fadeUp escalonada, textura grain, rodapé com créditos. Remover FloatingParticles, substituir por visual clean editorial.

5. **`LoginPage.tsx`**: Layout duas colunas — esquerda com branding/visual editorial, direita com form minimalista. Sem card centralizado com sombra. Manter toda a lógica de auth (signIn, signUp, reset password).

6. **`DashboardPage.tsx`**: Restyling dos cards de stats, widgets e lista de apostilas com a nova paleta. Manter todos os widgets existentes (Gamification, Pomodoro, Flashcards, Heatmap, Leaderboard, WeeklyGoal, ExamCalendar, FlashcardSummary, ApostilaProgress, RecentActivity). Aplicar visual editorial nos cards de apostila por categoria.

7. **`ApostilaPage.tsx`**: Transformar na tela principal editorial. Layout 3 colunas em desktop (sidebar índice 20% + conteúdo 60% + anotações 20%). Adicionar sidebar de índice com âncoras, progresso de leitura, modo foco. Estilizar conteúdo com separadores tipográficos, blocos de destaque com borda colorida por matéria, numeração mono nas seções.

8. **`AdminPage.tsx`**: Restyling da sidebar (fundo escuro), cards e formulários. Adicionar modo "Por Texto" no formulário de criação de apostila — um textarea grande onde o admin cola texto bruto, com toggle estilizado (pill switcher) para alternar entre Link e Texto. Manter toda a lógica existente de import, batch, exercícios, materiais e usuários.

9. **`ProfilePage.tsx`, `ExercisesPage.tsx`, `MaterialsPage.tsx`**: Aplicar nova paleta e tipografia. Preservar toda a funcionalidade.

### Fase 3 — Componentes Compartilhados

10. **`AppHeader.tsx`**: Restyling com fundo escuro, bordas finas, logo e nav minimalista.

11. **Sistema de cores por matéria**: Adicionar mapeamento de cores no código (constante ou via campo `color` na tabela `categories`) para colorir badges, bordas de destaque e progress bars por disciplina.

### Fase 4 — DB (se necessário)

12. **Verificação de schema**: A tabela `apostilas` já tem `source_type` e `content`. O campo `source_type` aceita valores como `'manual'`, `'link'`, `'notion'`. Precisamos garantir que `'text'` seja aceito como valor para o novo modo "Por Texto". Como o campo é `text` sem CHECK constraint, já funciona — **nenhuma migração necessária**.

---

## O que NÃO muda

- Toda lógica de auth, RLS, roles, gamificação, XP, streaks, badges
- Edge function `extract-content`
- Widgets: Pomodoro, Flashcards, Heatmap, Leaderboard, WeeklyGoal, ExamCalendar, etc.
- Funcionalidades admin: import URL, batch import, gerenciamento de materiais/usuários
- Anotações, watermark, proteção de conteúdo
- Tema dark/light toggle (adaptado para nova paleta)

---

## Detalhes Técnicos

- **Fontes**: Google Fonts import no `index.css` — `Instrument Serif` (display), `DM Mono` (labels/código), `Plus Jakarta Sans` (corpo, já existente)
- **Grain texture**: SVG filter inline no `index.css` aplicado via pseudo-elemento `::after` no body
- **Cores por matéria**: Constante TypeScript com mapeamento `categoria → cor hex`, usada em badges e bordas
- **Toggle Link/Texto no Admin**: Componente pill switcher inline no form de criação, controlando qual campo aparece (URL input vs textarea grande)
- **Apostila editorial**: Parsing do campo `content` para detectar seções numeradas e renderizar com tipografia hierárquica

---

## Estimativa

~15 arquivos modificados, ~3 novos componentes auxiliares. Implementação em múltiplos passos sequenciais.

