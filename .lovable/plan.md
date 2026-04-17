
Olhando o que já existe (Dashboard rico, Pomodoro, Flashcards, Gamificação, Apostilas, Calendário de Provas, Favoritos, Heatmap, Leaderboard), o app já cobre muito bem consumo de conteúdo e produtividade básica. O que ainda falta para empurrar o aluno do "estudei" para o "aprendi de verdade e cheguei na prova preparado" são camadas de **planejamento**, **revisão inteligente** e **diagnóstico**.

Aqui vão as ideias com maior impacto, ordenadas por retorno x esforço:

## Top 5 sugestões para os alunos

### 1. Plano de Estudos Inteligente até a Prova
A partir das provas já cadastradas no Calendário, gerar automaticamente um cronograma diário sugerindo:
- Quais apostilas estudar a cada dia
- Quanto tempo dedicar (em blocos de Pomodoro)
- Revisões espaçadas dos tópicos já vistos

Widget no Dashboard: "Hoje você precisa estudar X, Y e Z (≈90 min)". Marca como concluído e recalcula.

### 2. Modo Revisão Espaçada (SRS) global
Hoje os flashcards já existem isoladamente. Evoluir para um sistema único estilo Anki:
- Toda apostila lida vira automaticamente um conjunto de flashcards (a IA já gera a partir do conteúdo)
- Algoritmo SM-2: cards aparecem no dia certo de revisar
- Card "Revisar hoje" no Dashboard com contador

### 3. Simulado Adaptativo + Diagnóstico de Fraquezas
- Botão "Simulado da Semana" que monta uma prova de 20 questões puxando dos exercícios de várias apostilas
- Ao final: gráfico mostrando "você acerta 90% em Redes mas só 40% em Banco de Dados"
- Sugestão automática: "Recomendo revisar a apostila X antes da prova de quinta"

### 4. Resumo em 1 Página + Mapa Mental
Para cada apostila, dois novos botões:
- **"Gerar Resumo Express"** → 1 página com bullets dos pontos-chave (cola na cola da prova)
- **"Mapa Mental"** → visualização em árvore dos conceitos (usando a IA + react-flow ou mermaid)

Útil para revisão rápida no dia da prova.

### 5. Grupos de Estudo + Dúvidas com IA da Disciplina
- Comunidade já existe — adicionar **canais por disciplina**
- Em cada apostila, botão "Tirar dúvida" que abre chat com IA já contextualizada naquele conteúdo (o ApostilaChat já tem essa base, só falta destacar e permitir salvar perguntas frequentes)
- Top 5 dúvidas mais feitas viram FAQ visível para todos

## Bônus rápidos (baixo esforço, alto carinho)

- **Modo Foco com bloqueio**: timer Pomodoro em tela cheia + esconde notificações do app
- **Streak de leitura**: além do streak diário, "leu 5 apostilas seguidas sem pular"
- **Exportar apostila em PDF** para estudar offline / imprimir
- **Voz/áudio**: botão "ouvir apostila" (TTS) para estudar no transporte
- **Resumo da semana por email**: "Você estudou 4h, completou 3 apostilas, próxima prova em 5 dias"

## Minha recomendação se for escolher UMA agora
**Plano de Estudos Inteligente até a Prova (#1)** — porque conecta calendário + apostilas + gamificação que já existem, e resolve a dor real do aluno: *"por onde eu começo hoje?"*. É o tipo de feature que faz o aluno abrir o app todo dia.

Me diz qual dessas (ou combinação) faz mais sentido pra você que eu detalho o plano técnico.
