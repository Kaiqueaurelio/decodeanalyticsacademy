# Plano: Gamificação & Analytics 360º - Decode Analytics Academy

Implementação de um ecossistema completo de gamificação e análise de desempenho acadêmico com estética **Tech/Industrial Cyberpunk**, focada em volume (exercícios/capítulos) e frequência (consistência).

## Ações Práticas

### 1. Persistência de Dados (Banco de Dados)
- Utilizar tabelas existentes `study_goals`, `study_milestones`, `user_xp`, `study_streaks`, `badges` e `user_badges`.
- Garantir que todas as ações (leitura de capítulos, resolução de exercícios, login diário) reflitam em atualizações síncronas nestas tabelas via RPCs e triggers para integridade de dados.

### 2. Configuração de Metas Dinâmicas
- Expandir o `StudyGoalsConfig.tsx` para permitir que o usuário defina:
    - **Objetivo**: Capítulos, Exercícios ou Horas.
    - **Escopo**: Geral ou por Disciplina (ENEM vs Faculdade).
    - **Frequência**: Diária ou Semanal.
- Implementar a lógica de "Salvamento Real" que persiste essas metas na tabela `study_goals`.

### 3. Conquistas e Badges Automáticos
- Refatorar o `useGamification.tsx` para incluir um motor de regras que verifica periodicamente (ou após eventos):
    - **Evolução por Capítulos**: Badges de "Explorador" (5 capítulos), "Erudito" (20 capítulos).
    - **Desempenho em Exercícios**: "Snipers" (80% de precisão), "Maratonista" (100+ exercícios).
    - **Consistência**: Streaks de 7, 30 e 100 dias.
- Notificações visuais (toasts) customizadas com som de sistema futurista ao desbloquear recompensas.

### 4. Histórico e Gráficos de Evolução
- Integrar `ProgressCharts.tsx` com dados reais da tabela de histórico (a ser populada via triggers de progresso).
- Gráfico de **Radar**: Competências por área (TI, Gestão, Dados, etc.).
- Gráfico de **Área**: Evolução temporal de XP e aproveitamento.
- Visualização de "Milestones" alcançados em uma linha do tempo.

### 5. UI/UX Cyberpunk Pro
- Utilizar `cyber-grid`, tipografia `DM Mono`, bordas neon e animações `framer-motion` em todos os widgets de gamificação.
- Garantir responsividade total (Mobile-First) com gestos de deslize para ver metas.

## Detalhes Técnicos
- **Frontend**: React 18, Framer Motion para transições de status de metas, Recharts para visualização de dados.
- **Backend**: Supabase (PostgreSQL) com RLS habilitado para todas as tabelas de gamificação.
- **Lógica**: Centralizada no hook `useGamification` para evitar redundância e facilitar a manutenção.
