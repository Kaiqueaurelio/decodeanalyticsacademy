

## Objetivo
1. **Botão "Baixar PDF"** visível **só para Admin** na página da apostila — exporta toda a apostila (capa, sumário, seções com hierarquia, código, imagens, áudios listados como link).
2. **Reformatar a leitura** da apostila com tipografia editorial mais bonita e organizada, inspirada em boas práticas de formatação web (hierarquia clara, ritmo vertical, blocos destacados, leitura confortável).

## Parte 1 — Download PDF (Admin)

**Onde:** `src/pages/ApostilaPage.tsx`, na barra de ações superior (ao lado de "Modo foco"), só renderiza se `isAdmin`.

**Como (client-side, sem edge function):**
- Usar **`jspdf` + `html2canvas`** (libs leves, já comuns em projetos Vite). Gera PDF de alta qualidade direto no navegador.
- Estratégia: criar um container off-screen com layout otimizado pra impressão (A4, fonte serifada, sem sidebars/chat), renderizar todas as seções via `ApostilaContentRenderer` numa versão "print", capturar com `html2canvas` por bloco e paginar com `jspdf`.
- Capa com: título da apostila, disciplina, data de geração, "Decode Analytics Academy".
- Rodapé com: número da página + "Desenvolvido por: Kaique Aurelio & Decode Analytics".
- Imagens são embutidas (já são URLs públicas/assinadas). Áudios viram lista de links no fim (PDF não toca áudio).
- Blocos de código mantém fonte monoespaçada e fundo cinza claro.

**UX:** botão mostra spinner "Gerando PDF…", toast de sucesso/erro, salva como `{slug-do-titulo}.pdf`.

## Parte 2 — Reformatar leitura (mais bonito e organizado)

Foco em **tipografia editorial** + **hierarquia visual nítida** + **ritmo de leitura confortável**. Mudanças concentradas em `ApostilaPage.tsx` (cabeçalhos das seções) e `ApostilaContentRenderer.tsx` (parágrafos, blocos).

**Tipografia & ritmo:**
- Coluna de leitura limitada a `max-w-[68ch]` (ideal pra leitura — ~66 caracteres por linha).
- Parágrafos com `text-[16px] sm:text-[17px] leading-[1.75] tracking-[0.01em]` e cor `text-foreground/85` (mais contraste sem cansar).
- Primeiro parágrafo de cada seção com **letra capitular** (drop-cap) sutil opcional.
- Espaço entre parágrafos `mb-5` (mais respiração).

**Hierarquia de títulos refinada:**
- **H1 (seção principal):** font-display, número da seção em cinza pequeno acima do título (ex: `01 — INTRODUÇÃO` em mono-uppercase tracking-wider), título em 28-32px, separador fino abaixo.
- **H2:** 20-22px, sem barra lateral, com `border-b border-border/30 pb-2`.
- **H3:** 16px semibold, cor `text-primary/90`.

**Blocos especiais (no `ApostilaContentRenderer`):**
- **Citações (`> texto`)**: detectar e renderizar como `blockquote` com barra lateral colorida + itálico.
- **Listas**: bullets coloridos (●) em `text-primary`, espaçamento entre itens.
- **Destaques (`==texto==` ou `**Importante:**`)**: caixinha "callout" com ícone (Info/Lightbulb/AlertTriangle) e fundo `bg-primary/5 border-l-4 border-primary`.
- **Definições** (linhas tipo `Termo: definição`): renderizar como `<dl>` estilizado.
- **Código** e **imagens** já existem — refinar: imagens com legenda em itálico e sombra mais elegante; código com numeração de linhas opcional.
- **Tabelas markdown** (`| col | col |`): suportar e renderizar com `<table>` estilizado (zebra rows, bordas sutis).

**Microelementos:**
- Anchor link discreto (#) ao passar o mouse no título da seção (desktop).
- Indicador "tempo de leitura desta seção" abaixo do H1 (calculado por palavras / 200 wpm).
- Divisor decorativo `* * *` opcional entre subseções longas.

## Arquivos a modificar
- `src/pages/ApostilaPage.tsx` — botão PDF (admin only), refinar markup dos H1/H2/H3, ajustar `max-w` da coluna de conteúdo.
- `src/components/ApostilaContentRenderer.tsx` — adicionar parsers/blocos para blockquote, callout, tabela, lista estilizada; ajustar tipografia base.
- **Novo:** `src/lib/apostila-pdf.ts` — função `exportApostilaToPDF(apostila, sections)` usando jspdf + html2canvas.
- `package.json` — adicionar `jspdf` e `html2canvas`.

## Não muda
- Conteúdo salvo no banco (mesmo markdown).
- Proteção anti-cópia (`ScreenshotGuard`) — botão de PDF é ação intencional do admin.
- Layout 3 colunas em desktop / drawers em mobile.
- Funcionamento do chat, anotações, flashcards, exercícios.

## Resultado esperado
- Admin vê botão "Baixar PDF" → gera arquivo bonito com toda a apostila pronta pra impressão/arquivamento.
- Aluno e admin leem a apostila com **tipografia mais elegante**, hierarquia clara, blocos destacados (citação, callout, tabela) e ritmo de leitura confortável — mantendo todas as features atuais (código copiável, imagens inline, áudios inline).

