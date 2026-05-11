## Visão Geral

Modernizar o Decode Analytics Academy em 5 frentes complementares, mantendo a estética High-Tech (Dark + Ciano + Roxo) e sem quebrar nada existente. Entregue em ondas para reduzir risco.

---

## Onda 1 — Calculadora de Aprovação UNIP (prioridade do usuário)

Módulo dedicado em `/calculadora` + widget no dashboard.

**Lógica UNIP:**
- Média Final = (NP1 + NP2) / 2 → precisa ser ≥ 7 para aprovação direta.
- Se < 7, vai para Exame: (NP1 + NP2 + Exame) / 2 ≥ 5 → calcular nota mínima no exame.
- Inputs: NP1 (já feita) → calcula "quanto preciso na NP2 para passar direto" e "quanto preciso na NP2 para pelo menos ir bem no exame".
- Se já tem NP1 e NP2 → mostra status (aprovado/exame/reprovado) e nota necessária no exame.
- Visual: cards com slider de simulação em tempo real, gráfico de cenários (otimista/realista/pessimista), badges coloridos (verde/amarelo/vermelho).
- Por disciplina: lista todas as 48 matérias salvas no perfil, aluno preenche notas e vê painel consolidado de risco do semestre.

---

## Onda 2 — Inteligência Preditiva sobre Desempenho

**Heatmap de Fraqueza** (`/insights`)
- Matriz disciplina × tópico colorida por taxa de erro nos exercícios já respondidos (`answers` + `exercises`).
- Click no quadrante → abre apostila relacionada + 5 questões focadas no tópico fraco.
- Algoritmo de Spaced Repetition (SM-2 simplificado): cards de revisão aparecem no dashboard nos intervalos ideais.

**Previsão de Nota na NP**
- Edge function `predict-grade` usa Lovable AI (gemini-3-flash) com features: % acerto histórico, horas de estudo (pomodoro_sessions), streak, dias até a prova.
- Output: nota estimada + intervalo de confiança + 3 ações sugeridas para subir.

**Insights Semanais**
- Cron toda segunda 7h gera relatório por aluno: horas estudadas, top 3 matérias, gargalos, meta da semana.
- Entregue via toast + página `/insights/semana` + push notification.

---

## Onda 3 — IA Proativa de Estudos

- **Tutor por Voz**: botão flutuante na leitura de apostila, abre conversa de voz (ElevenLabs TTS já configurado + STT do navegador) discutindo o conteúdo da página atual.
- **Resumo Automático** por apostila: botão "Resumir em 30s", "Resumir em 5 min", "Mapa Mental" (gera Mermaid renderizado).
- **Quiz Adaptativo**: gera 5 questões on-demand focadas nos tópicos onde o aluno errou mais.
- **Plano Semanal Personalizado**: IA monta cronograma com base em provas próximas + heatmap de fraqueza + horas disponíveis declaradas pelo aluno.

---

## Onda 4 — Conteúdo & Multimídia

- **Podcast da Apostila**: edge function `generate-podcast` usa ElevenLabs para gerar MP3 narrado (cache em storage `materials/podcasts/`). Player com 1x/1.5x/2x e marcação de progresso.
- **Glossário Inteligente**: tap/hover em termos técnicos abre popover com definição + exemplo + link para apostila relacionada (extração via IA na primeira renderização, cache em tabela `glossary_terms`).
- **Simulados Cronometrados**: modo prova real — timer regressivo, sem voltar questão, correção ao final, ranking opcional. Gera PDF do gabarito.
- **Vídeo-aulas Curtas (Reels)**: feed vertical scroll-snap com clipes de 60s explicando conceitos-chave. Admin faz upload via workbench, alunos curtem/salvam.

---

## Onda 5 — Mobile-First & Gestos

- Bottom sheets nativas (vaul) substituindo dialogs em mobile.
- Haptics (`navigator.vibrate`) em ações principais.
- Swipe horizontal entre apostilas da mesma matéria.
- Offline real: Service Worker + IndexedDB (Dexie) para apostilas marcadas como "Baixar".
- Atalhos: PWA shortcuts no manifest (Tira-dúvida, Pomodoro, Calculadora).
- Widget na home (Web App Widgets API onde suportado).

---

## Onda 6 — Personalização Visual

- **Temas alternativos**: OLED Puro (#000), Sakura (rosa pastel), Cyberpunk (amarelo/magenta) — todos via tokens HSL no `index.css`.
- **Avatar editável**: gerador 3D (DiceBear) ou upload + crop.
- **Cover art por IA**: cada apostila ganha capa única gerada via Nano Banana se não tiver imagem.
- **Dashboard remontável**: drag-and-drop dos widgets (react-grid-layout), salvo em `profiles.dashboard_layout` jsonb.

---

## Onda 7 — Engajamento

- **Missões Diárias**: 3 missões geradas todo dia (resolver X questões, ler 1 apostila, manter streak). Bônus de XP + Streak Shield (1 vida por semana).
- **Liga de Temporadas**: Bronze → Prata → Ouro → Diamante. Reset a cada 14 dias, top 30% sobe, bottom 20% desce. Tabela `seasons` + `season_rankings`.
- **Push Notifications Inteligentes**: VAPID já configurado. Triggers: prova em 3/2/1 dia, streak prestes a quebrar, missão diária liberada, novo conteúdo na disciplina.

---

## Detalhes Técnicos

**Novas tabelas:**
```text
calculator_grades(user_id, subject_id, np1, np2, exam, semester)
weak_topics(user_id, apostila_id, topic, error_rate, last_review)
spaced_reviews(user_id, exercise_id, ease, interval_days, next_review)
weekly_insights(user_id, week_start, payload jsonb)
glossary_terms(term, definition, example, related_apostila_id)
podcasts(apostila_id, audio_url, duration, voice_id)
short_videos(id, apostila_id, title, video_url, duration, likes)
daily_missions(user_id, date, missions jsonb, completed jsonb)
seasons(id, name, starts_at, ends_at)
season_rankings(season_id, user_id, xp, league, rank)
```

**Novas edge functions:** `predict-grade`, `weekly-insights-cron`, `generate-podcast`, `generate-glossary`, `voice-tutor`, `daily-missions-cron`, `season-rollover-cron`.

**Bibliotecas a adicionar:** `vaul` (bottom sheets), `dexie` (IndexedDB), `react-grid-layout` (dashboard), `mermaid` (mapas mentais), `@dicebear/core` (avatares).

---

## Sequência Sugerida de Entrega

1. **Sprint 1** — Calculadora UNIP (alta utilidade imediata, baixo risco).
2. **Sprint 2** — Heatmap + Previsão de Nota + Insights Semanais.
3. **Sprint 3** — Missões Diárias + Push Notifications + Liga.
4. **Sprint 4** — Tutor por Voz + Resumos + Quiz Adaptativo + Plano Semanal.
5. **Sprint 5** — Podcast + Glossário + Simulados + Reels.
6. **Sprint 6** — Mobile-first (bottom sheets, swipe, offline, haptics).
7. **Sprint 7** — Personalização visual (temas, avatar, dashboard remontável).

Cada sprint é independente e pode ir para produção sozinho.