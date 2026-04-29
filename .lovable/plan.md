
# Plano: Editor de Apostilas estilo Word/Docs — versão Pro

Hoje o editor já é WYSIWYG (TipTap) mas a interface ficou "fulera" porque:
- A toolbar tem 30+ ícones em 2 linhas apertadas, sem agrupamento visual nem rótulos.
- A "folha" não parece página A4 (sem margem, régua, número de página, zoom).
- Não há sumário lateral, lista de imagens, atalhos de inserção rápida.
- Falta feedback de salvamento, status, contagem por seção.
- Imagens funcionam, mas sem menu de contexto (botão direito) nem texto-alternativo, legenda ou alinhamento "quebra de texto".
- Não há tema "claro" tipo papel branco — fica tudo cinza escuro, pesado de ler.

A proposta é reorganizar tudo em **5 zonas** como no Word/Docs e adicionar 6 recursos que faltam.

## 1. Nova arquitetura visual

```text
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR  Apostila X · Salvo agora · 1.245 palavras   [Zoom] │ ← metadados + status
├─────────────────────────────────────────────────────────────┤
│ RIBBON  [Início] [Inserir] [Layout] [Tabela] [Revisar] [IA]│ ← abas
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Estilo▾ │ B I U S │ Cor▾ Realce▾ │ ≡ ⇆ │ • 1. ☑ │ ... │ │ ← grupos com separadores
│ └─────────────────────────────────────────────────────────┘ │
├──────┬──────────────────────────────────────────────┬───────┤
│ TOC  │            ┌──────────────────┐              │ INSP. │
│ 1.   │            │                  │              │  Img  │
│ 1.1  │            │   PÁGINA A4      │              │  Alt  │
│ 1.2  │            │   (papel branco) │              │  Tam  │
│ 2.   │            │                  │              │  IA   │
│ ...  │            └──────────────────┘              │  ...  │
├──────┴──────────────────────────────────────────────┴───────┤
│ STATUS  Pág 3/8 · 1.245 palavras · 7 imagens · 2 erros  ⚙  │
└─────────────────────────────────────────────────────────────┘
```

Tudo fica num único componente `MarkdownEditor`, mas dividido em sub-componentes: `EditorTopbar`, `EditorRibbon`, `EditorTOC`, `EditorInspector`, `EditorStatusBar`, `EditorPage`.

## 2. Mudanças concretas

### A. Topbar (nova)
- Título da apostila editável inline.
- Indicador "Salvo · agora" / "Salvando…" / "Erro".
- Controle de zoom (75% / 100% / 125% / 150%) com slider.
- Botão "Modo foco" (esconde TOC e inspector).
- Botão "Imprimir/PDF" e "Visualizar como aluno".

### B. Ribbon com abas (em vez de 2 linhas planas)
- **Início**: estilo, fonte, B/I/U/S, cor, realce, alinhamento, listas.
- **Inserir**: imagem, tabela, link, código, citação, divisor, vídeo (YouTube), fórmula.
- **Layout**: alinhamento de página, espaçamento entre linhas, recuo, quebra de página.
- **Tabela** (só ativa dentro de tabela): adicionar/remover linha/coluna, mesclar, cabeçalho.
- **Revisar**: contar palavras, dicionário PT-BR, "Buscar e substituir".
- **IA**: "Reescrever", "Resumir", "Expandir", "Corrigir gramática", "Gerar exercícios" — usando Lovable AI (já temos `gemini-direct`).

Cada grupo dentro da aba é separado por `Separator` vertical com **rótulo pequeno embaixo** (ex: "Fonte", "Parágrafo") — igual Word.

### C. Página em formato A4 real
- Folha branca (`bg-white text-zinc-900`) mesmo no tema escuro — leitura tipo papel.
- Largura fixa 794px (A4 a 96dpi), margem interna 96px (1 polegada).
- Sombra suave, fundo cinza claro ao redor.
- Régua opcional no topo (toggle).
- Quebra de página visual a cada ~1100px (linha pontilhada com "— Página 2 —").
- Zoom aplicado via `transform: scale()`.

### D. TOC lateral esquerdo (colapsável)
- Lista hierárquica dos `H1/H2/H3` extraída do documento em tempo real.
- Clique = scroll suave até a seção.
- Numeração 1.1.1 automática (já é padrão do projeto).
- Drag para reordenar seções inteiras (move o bloco no documento).

### E. Inspector lateral direito (contextual)
- Quando nada selecionado: estatísticas (palavras, leitura estimada, imagens, links, exercícios).
- Quando imagem selecionada: src, alt (com aviso se vazio), legenda, largura em %, alinhamento, "substituir".
- Quando tabela: linhas/colunas, estilo (zebrada, com bordas, sem bordas).
- Quando link: URL, "abrir em nova aba", remover.

### F. Imagens — melhorias
- Menu de contexto (botão direito): copiar URL, substituir, adicionar legenda, alt-text, remover.
- Legenda (`<figcaption>`) opcional embaixo, italica.
- Avisos de acessibilidade: borda amarela se `alt` vazio.
- Quebra de texto: "em linha", "esquerda" (texto envolve à direita), "direita", "centro".
- Snap em 25/33/50/66/75/100% durante o resize.

### G. Atalhos e usabilidade
- `Ctrl+S` salva (toast + indicador).
- `Ctrl+K` link, `Ctrl+Shift+K` busca, `Ctrl+/` paleta de comandos.
- `/` no início de linha → menu slash (igual Notion): "/imagem", "/tabela", "/título2", "/exercício".
- Auto-save a cada 3s de inatividade (já existe? confirmar e integrar com indicador).
- Persistir zoom e estado dos painéis no `localStorage`.

### H. Status bar (nova, embaixo)
- Página atual / total · palavras · caracteres · tempo de leitura.
- Aviso de duplicatas / links quebrados / imagens sem alt.
- Botão de ortografia.

## 3. Detalhes técnicos

- **Toolbar em abas**: Tabs do shadcn dentro do header do editor; cada aba renderiza um `<RibbonGroup label="Fonte">…</RibbonGroup>`.
- **TOC**: hook `useEditorOutline(editor)` que escuta `editor.on('update')`, percorre `editor.state.doc` e extrai headings com posição → `editor.commands.setTextSelection(pos)` + `scrollIntoView`.
- **Inspector**: hook `useEditorSelection(editor)` que devolve `{ type: 'image' | 'table' | 'link' | 'none', attrs }` baseado em `editor.state.selection`.
- **Página A4**: classe Tailwind custom `.editor-page { width: 794px; min-height: 1123px; padding: 96px; background: white; color: #111; box-shadow: 0 2px 16px rgba(0,0,0,.25); }` aplicada ao wrapper que envolve `<EditorContent />`.
- **Slash menu**: extensão TipTap `Suggestion` (mesmo plugin do `@mention`), lista filtrável.
- **Quebra de página**: pseudo-overlay com posicionamento absoluto baseado em `scrollHeight`.
- **IA**: chamadas para `supabase.functions.invoke('gemini-direct', { body: { task: 'rewrite' | 'summarize' | …, text } })`. Já existe a função; só adicionar handlers para esses tasks.
- **Slash + paleta**: lazy-load para não inflar bundle.
- **Persistência**: continua salvando Markdown (compatível com renderer do aluno e PDF). HTML rico só vive em memória.

## 4. Arquivos afetados

- `src/components/MarkdownEditor.tsx` — refatorar em torno de Topbar/Ribbon/Page/Status.
- Novos:
  - `src/components/editor/EditorRibbon.tsx`
  - `src/components/editor/EditorTopbar.tsx`
  - `src/components/editor/EditorTOC.tsx`
  - `src/components/editor/EditorInspector.tsx`
  - `src/components/editor/EditorStatusBar.tsx`
  - `src/components/editor/SlashMenu.tsx`
  - `src/components/editor/useEditorOutline.ts`
  - `src/components/editor/useEditorSelection.ts`
- `src/components/editor/ResizableImage.tsx` — adicionar legenda, alt warning, menu de contexto, quebra de texto.
- `src/index.css` — classe `.editor-page`, regras de impressão A4.
- `supabase/functions/gemini-direct/index.ts` — aceitar `task: 'rewrite' | 'summarize' | 'expand' | 'fix-grammar'`.

## 5. Entregas em ordem (incremental, sem quebrar nada)

1. **Visual base**: página A4 branca + topbar com status de salvamento + zoom. Já dá um salto enorme.
2. **Ribbon com abas** (Início / Inserir / Layout / Revisar) — agrupa o que já existe.
3. **TOC lateral** (esquerda, colapsável).
4. **Inspector lateral** (direita, contextual a imagem/tabela/link).
5. **Slash menu** "/" e paleta `Ctrl+/`.
6. **Aba IA** (reescrever/resumir/expandir/corrigir).
7. **Quebra de página visual** + impressão.

Posso entregar tudo de uma vez ou só os passos 1-3 primeiro (visual + organização) que já resolvem 80% da sensação de "bagunçado". Me diz qual prefere.
