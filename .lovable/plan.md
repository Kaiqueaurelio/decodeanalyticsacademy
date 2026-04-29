
# Sugestões para ajudar mais os alunos

Olhei o que o app já tem (gamificação, pomodoro, flashcards SRS, simulado semanal, plano de estudos, calendário de provas, comunidade, biblioteca, livros, tira-dúvida com foto, leaderboard, heatmap, pré-prova) e abaixo estão ideias **novas**, ranqueadas por impacto x esforço. Não vou implementar nada agora — escolha quais quer que eu faça.

---

## Tier 1 — Alto impacto, esforço baixo/médio

### 1. Modo "Estudar agora" (1 clique) 🔥
Um botão grande no dashboard que monta uma sessão de 25 min automaticamente:
- Pega a matéria com prova mais próxima (já temos `useExamFocus`)
- Abre Pomodoro + 5 flashcards pendentes + 1 apostila sugerida lado a lado
- Termina a sessão com mini-quiz de 3 perguntas
**Por quê:** elimina a fricção do "não sei por onde começar".

### 2. Resumo inteligente da apostila em 60 segundos
Botão "TL;DR" em cada apostila que gera (via Lovable AI, já temos `apostila-summary`):
- 5 bullets-chave
- 3 conceitos que mais caem
- 1 analogia simples
Cacheado no banco para não regerar.
**Por quê:** revisão rápida antes da aula/prova.

### 3. Mapa mental automático da apostila
Aproveita o TOC hierárquico já existente + Mermaid (`MermaidDiagram` já está no projeto) pra gerar um mindmap visual da apostila com 1 clique.
**Por quê:** muitos alunos aprendem melhor visualmente; quase grátis de implementar.

### 4. Anotações com destaques coloridos + exportação
Já existe `AnnotationsPanel`. Faltam:
- Highlights coloridos (4 cores) sobre o texto da apostila
- Exportar todas as anotações de uma matéria em PDF/Markdown
- Filtrar "só minhas anotações" para revisão pré-prova

### 5. Cronômetro de foco com bloqueio de saída
Variante hardcore do Pomodoro: trava a aba (fullscreen + aviso ao tentar sair). Conta XP em dobro se concluir sem quebrar.
**Por quê:** combate procrastinação real.

---

## Tier 2 — Alto impacto, esforço médio

### 6. "Onde parei" global
Card no topo do dashboard mostrando os 3 últimos pontos onde o aluno parou (apostila + posição de scroll, vídeo + timestamp, livro + página). Já temos `reading_progress`; só falta agregar com apostilas/vídeos.

### 7. Simulado adaptativo por fraqueza
Hoje há `WeeklySimuladoCard`. Adicionar variante: gera 10 questões focadas só nas categorias onde o aluno tem <60% de acerto (já temos `CategoryStatsWidget`).

### 8. Modo revisão espaçada por matéria
Tela "Revisar [matéria]" que junta: flashcards SRS dessa matéria + 5 questões antigas erradas + bullets do TL;DR. Roda em 15 min.

### 9. Grupos de estudo na comunidade
Hoje a comunidade é um feed único. Criar sub-grupos por matéria/turma com:
- Mural fixo com dúvidas mais votadas
- "Tirar dúvida ao vivo" (canal de chat realtime — já temos Supabase Realtime configurado)

### 10. Notificações inteligentes (push já existe)
Regras automáticas:
- "Você tem 12 flashcards atrasados" (D+1)
- "Prova de X em 3 dias — quer revisar agora?"
- "Você não estuda há 2 dias, sua streak vai quebrar"

---

## Tier 3 — Diferenciais

### 11. Leitor de voz (TTS) das apostilas
Já existe `SpeakButton`. Expandir para:
- Tocar a apostila inteira em background como podcast
- Velocidade ajustável, marcador de progresso
- Funciona com tela bloqueada (Media Session API)
**Por quê:** estudar no ônibus / academia.

### 12. Transcrição + resumo de aula gravada
Aluno faz upload de áudio da aula, IA transcreve (Whisper via edge function) e devolve resumo + flashcards prontos. Salva como material da apostila.

### 13. Caderno de erros automático
Toda questão errada vai para um "caderno de erros" pessoal, agrupado por tópico, com explicação da IA do porquê errou. Revisar caderno = +XP.

### 14. Modo competição entre amigos
Convidar amigos por link, comparar XP/streak/acertos da semana num leaderboard privado. Versão social do já existente.

### 15. Wellness check-in
Antes de iniciar estudo: "Como você está? (😴 cansado / 🙂 ok / 🔥 focado)". Ajusta sugestão (cansado → flashcards leves; focado → simulado).

---

## Minha recomendação para começar

Se eu pudesse fazer só 3, faria nesta ordem:
1. **"Onde parei" global** — resolve dor universal, baixo esforço
2. **Modo "Estudar agora"** — diferencial claro e usa tudo que já existe
3. **Mapa mental + TL;DR da apostila** — par perfeito de revisão pré-prova

Me diga quais te interessam (pode escolher de tiers diferentes) que eu monto o plano técnico detalhado da implementação.
