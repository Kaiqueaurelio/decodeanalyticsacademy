

## Plan: Reorganizar Dashboard do Aluno — Estilo AVA Moderno

### Problema Identificado
O dashboard atual está visualmente denso e confuso para o aluno. Muitos widgets competem por atenção (heatmap, leaderboard, pomodoro, flashcards, gráficos) sem hierarquia clara. A referência que você enviou mostra um estilo AVA limpo e organizado — cards de disciplinas com conteúdo agrupado por unidades.

### Proposta: Dashboard "Minhas Disciplinas" Inspirado no AVA

Manter todas as funcionalidades existentes, mas reorganizar a hierarquia visual para que o aluno encontre rapidamente o que precisa.

#### Mudanças no Dashboard (`DashboardPage.tsx`)

1. **Seção principal "Minhas Disciplinas"** — Apostilas agrupadas por categoria em cards grandes e limpos, com cabeçalho colorido (usando as cores por matéria já existentes em `subject-colors.ts`). Cada card mostra:
   - Título da disciplina/apostila
   - Contagem de exercícios e progresso (% acerto)
   - Botões "Ler Apostila" e "Exercícios" sempre visíveis (sem precisar expandir)
   - Ícone de status (completo/em progresso)

2. **Barra de estatísticas compacta no topo** — Manter os 4 stat cards mas torná-los mais sutis e integrados.

3. **Sidebar reorganizada por prioridade**:
   - Meta Semanal (topo)
   - Calendário de Provas
   - Gamificação (XP/Level/Streak)
   - Pomodoro
   - Os demais widgets (heatmap, leaderboard, activity) ficam em seção colapsável "Ver mais"

4. **Mobile: Layout vertical limpo** — Cards de disciplina em lista vertical sem carrossel, com acesso direto.

#### Melhorias Visuais Globais

5. **Cards de disciplina com estilo AVA** — Cabeçalho colorido por categoria, cantos arredondados (12px), sombra suave, hover com elevação.

6. **Melhor contraste no modo escuro** — O `--card` está muito escuro (`240 5% 7%`), será ajustado para `240 5% 10%` para melhor legibilidade.

7. **Tipografia mais legível** — Títulos de seção maiores (16px→18px), texto de corpo com line-height 1.6.

#### Apostila Page Polish

8. **Consistência com Dashboard** — Mesmo sistema de cards, cores e animações. Melhorar visibilidade do texto no modo escuro.

### Arquivos a Modificar
- `src/pages/DashboardPage.tsx` — Reorganizar layout e hierarquia
- `src/index.css` — Ajustar variáveis de cor dark mode e adicionar `.discipline-card`
- `src/components/AppHeader.tsx` — Nenhuma mudança necessária (já está ok)
- `src/pages/ApostilaPage.tsx` — Polish de contraste e consistência

### Resultado Esperado
Dashboard limpo estilo plataforma educacional, onde o aluno vê "Minhas Disciplinas" organizadas por matéria com acesso direto ao conteúdo — sem ruído visual. Widgets de gamificação e ferramentas ficam na sidebar sem competir com o conteúdo principal.

