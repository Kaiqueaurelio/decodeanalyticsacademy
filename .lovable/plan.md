

## Plano: Experiência estilo AVA UNIP (com cara Decode)

As 5 imagens mostram o fluxo do AVA: **Hub de atalhos** → **Lista de Disciplinas** → **Conteúdo da Disciplina (UNIDADES com tiles coloridos)** → **Atividades intercaladas**. Vou trazer essa estrutura, mas em dark high-tech com neon ciano/roxo (sem cores chapadas tipo UNIP).

### O que muda

**1. DashboardPage – novo bloco "Hub de Acesso Rápido" no topo**
Logo abaixo do header, uma grade 2x3 de tiles grandes (estilo AVA), cada um com ícone + label, em cards com gradiente neon e borda glow:
- Conteúdos Acadêmicos → `/dashboard` (scroll para Minhas Disciplinas)
- Calendário → abre `ExamCalendarWidget` em modal/aba
- Biblioteca → futura página de materiais agregados (ou scroll para Materiais)
- Comunidade → `AnnouncementsBoard`
- Mural do Aluno → `RecentActivity`
- Meu Perfil → `/profile`

Mantém TODOS os widgets atuais abaixo (gamificação, pomodoro, gráficos, etc.).

**2. "Minhas Disciplinas" – formato lista densa (estilo IMG_5753)**
Adiciono um toggle "Grid / Lista" na seção Minhas Disciplinas. No modo lista: linhas tipo `CÓDIGO_SEM_XX: NOME DA DISCIPLINA` separadas por divisor sutil, com mini-progress bar à direita. O grid de cards atual continua disponível.

**3. ApostilaPage / página de Disciplina – seções "UNIDADE I, II, III..."**
Hoje a apostila é texto contínuo. Vou agrupar visualmente o conteúdo em **Unidades** (já existem `sections` parseadas), adicionando:
- Header "UNIDADE I" com ícone de livro neon
- Grade 2x2 de tiles tipo AVA: **Livro-texto** (azul ciano, abre conteúdo), **Slides** (verde neon, se houver material slides), **Videoaula 01/02/03/04** (tiles roxos com ícone play)
- Entre unidades: tile "ATIVIDADE / QUESTIONÁRIO UNIDADE I" (laranja neon) que linka para ExercisesPage filtrado por unidade
- No final: tile "BOLETIM DA DISCIPLINA" mostrando notas/progresso do aluno

Tiles usam o mesmo padrão visual da imagem (ícone grande + label embaixo), mas com cards Decode (bg `#0a0a14`, border `border-cyan-500/30`, hover glow).

**4. Estética**
- Cores dos tiles: ciano (#00f0ff), roxo (#a855f7), verde-neon, laranja-neon, vermelho-magenta — todos com `bg-gradient` sutil + `shadow-[0_0_30px]` no hover
- Mantém Space Grotesk uppercase para os labels (igual AVA)
- Layout mobile: grid 2 colunas (igual UNIP), desktop: 3-4 colunas

### Arquivos afetados
- `src/pages/DashboardPage.tsx` — novo componente `QuickAccessHub` no topo + toggle de view nas disciplinas
- `src/pages/ApostilaPage.tsx` — novo cabeçalho "UNIDADE X" + grade de tiles de recursos por unidade
- `src/components/QuickAccessHub.tsx` (novo)
- `src/components/UnitTilesGrid.tsx` (novo) — renderiza tiles Livro/Slides/Vídeos/Atividade
- Reaproveita: `MaterialWidget`, `ExamCalendarWidget`, `AnnouncementsBoard`

### Garantias
- Nenhum widget/funcionalidade existente será removido (regra de ouro)
- ScreenshotGuard, watermark, gamificação continuam ativos
- Mantém estética high-tech — não copia as cores chapadas da UNIP, apenas a **arquitetura de informação**

