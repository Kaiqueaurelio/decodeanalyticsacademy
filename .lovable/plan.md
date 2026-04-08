## Plano de Implementação Completo

### Etapa 1 — Banco de Dados (Migration)
Criar tabelas para suportar todas as features:
- `study_streaks` — rastrear dias consecutivos de estudo
- `user_xp` — sistema de pontos e níveis
- `badges` — conquistas disponíveis
- `user_badges` — conquistas desbloqueadas por usuário
- `flashcards` — cartões de estudo criados por usuários
- `annotations` — anotações pessoais em apostilas
- `pomodoro_sessions` — sessões de estudo cronometradas

### Etapa 2 — Gamificação
- Sistema de XP: ganhar pontos ao completar exercícios, ler apostilas, manter streaks
- Streaks: contador de dias consecutivos de estudo
- Badges: conquistas como "Primeira Questão", "Streak de 7 dias", "100% numa apostila"
- Ranking: leaderboard dos alunos com mais XP

### Etapa 3 — Experiência de Estudo
- Timer Pomodoro integrado (25min estudo / 5min pausa)
- Flashcards: criar e revisar cartões de estudo
- Anotações pessoais dentro das apostilas
- Indicador de progresso de leitura

### Etapa 4 — Exercícios Inteligentes
- Gráficos de evolução (Recharts) no perfil
- Revisão inteligente: priorizar questões que o aluno errou
- Simulado cronometrado por semestre

### Etapa 5 — UX & Visual
- Onboarding guiado para novos usuários
- Busca global com filtros
- Indicadores "continuar de onde parou"
