

# Plano: Dashboard Mobile com Carrossel Horizontal

## Resumo

No mobile, os stats cards e os widgets da sidebar direita ficam empilhados verticalmente, ocupando muito espaço. A melhoria transforma essas seções em carrosséis horizontais deslizáveis (swipeable) no mobile, mantendo o layout grid no desktop.

## Mudanças

### 1. `src/pages/DashboardPage.tsx`

- **Stats Cards (linha 142)**: No mobile (`< sm`), renderizar os 4 cards dentro de um container com `overflow-x-auto` e `flex` horizontal com snap scrolling (`scroll-snap-type: x mandatory`), cada card com `min-w-[70vw]` e `scroll-snap-align: start`. No `sm+` manter o grid atual.

- **Sidebar Widgets (linha 282)**: No mobile, agrupar os widgets (WeeklyGoal, ExamCalendar, FlashcardSummary, ApostilaProgress, Heatmap, RecentActivity, Leaderboard) em um container horizontal scrollável com snap, cada widget com `min-w-[80vw]`. Adicionar indicadores de paginação (dots) abaixo. No `lg+` manter o layout sidebar vertical atual.

- **Gamification + Pomodoro row (linha 194)**: No mobile, também usar scroll horizontal para GamificationWidget e Pomodoro+Flashcards lado a lado como slides.

### 2. `src/index.css`

- Adicionar classes utilitárias para o carrossel: `scroll-snap-x`, `snap-start`, `scrollbar-hide` (esconder scrollbar nativo) e estilos para dots de paginação.

### 3. Novo componente `src/components/MobileCarousel.tsx`

Componente wrapper leve (sem dependência do embla-carousel) que:
- Usa CSS scroll-snap nativo para performance
- Aceita `children` e renderiza em container horizontal scrollável
- Mostra dots de paginação baseados no scroll position (via `IntersectionObserver` ou `scrollLeft`)
- No desktop (via `useIsMobile`) renderiza children normalmente em layout vertical/grid

## Detalhes Técnicos

- Sem bibliotecas extras — apenas CSS scroll-snap nativo
- `useIsMobile()` hook já existe no projeto
- Scrollbar escondido via `-webkit-scrollbar: none` + `scrollbar-width: none`
- Dots com cor `primary` para o ativo e `muted` para inativos

