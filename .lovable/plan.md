

## Objetivo
Corrigir a responsividade global do app — hoje, em telas pequenas (≤414px) o conteúdo precisa ser redimensionado manualmente para ser lido. O alvo é eliminar overflow horizontal, ajustar paddings/tipografia em mobile e garantir que widgets, tabs, tabelas e código se adaptem ao viewport sem zoom.

## Diagnóstico (o que está errado hoje)

Verificando os principais arquivos do app, identifiquei estes problemas recorrentes que forçam o redimensionamento:

1. **Viewport / overflow horizontal**
   - Containers com `min-w-[80vw]` (MobileCarousel), grids com colunas fixas e tabelas sem wrapper estouram a largura em 360–414px.
   - `App.css` antigo limita `#root` a `max-width: 1280px` + `padding: 2rem` + `text-align: center` — herança Vite que conflita com layout mobile.

2. **Tipografia não fluida**
   - Headings de páginas usam tamanhos fixos (`text-3xl`/`text-4xl`) sem fallback mobile, quebrando linhas e empurrando o layout.
   - Apostila usa `max-width: 70ch` ok, mas paddings laterais somam mais que o viewport em mobile.

3. **GliderTabs / Tabs**
   - Não rolam horizontalmente quando há muitas abas — comprimem o texto e o glider calcula offset errado.

4. **Blocos de código (Shiki)**
   - Já têm `overflow-x: auto`, mas o container pai não tem `min-width: 0`, então o flex/grid expande e empurra a página inteira.

5. **Imagens da apostila**
   - `<img>` sem `max-width: 100%` explícito em alguns renderers — em mobile vazam.

6. **Header e FABs**
   - AppHeader e QuickActionsFab sobrepõem conteúdo em telas curtas (≤640px de altura). Faltam `safe-area-inset` para PWA.

7. **Diálogos / Sheets**
   - Alguns `Dialog` usam largura fixa (`max-w-2xl`) sem `w-[calc(100%-2rem)]`, cortando botões à direita em 360px.

8. **Tabelas (Admin)**
   - Tabelas do AdminPage não têm wrapper `overflow-x-auto`, forçando scroll da página inteira.

## Escopo da correção (global, não por tela)

### A. Reset global de layout
**Arquivos:** `src/App.css`, `src/index.css`

- Remover regras herdadas do template Vite em `App.css` (`#root { max-width; padding; text-align }`) que conflitam com Tailwind.
- Adicionar em `index.css`:
  - `html, body { overflow-x: hidden; }` como rede de segurança.
  - `* { min-width: 0; }` em containers flex/grid principais via classe utilitária.
  - `img, video, iframe { max-width: 100%; height: auto; }` global.
  - Suporte a `env(safe-area-inset-*)` para iOS PWA.

### B. Tipografia fluida
**Arquivo:** `tailwind.config.ts` + `index.css`

- Adicionar utilitários `text-fluid-*` usando `clamp()` para H1/H2/H3:
  - H1: `clamp(1.75rem, 4vw + 1rem, 2.5rem)`
  - H2: `clamp(1.375rem, 2.5vw + 0.75rem, 1.875rem)`
- Aplicar nas páginas que hoje usam `text-3xl/4xl` sem variantes mobile (Dashboard, Apostila, Materiais, Admin, Biblioteca, Profile).

### C. Containers e grids
**Arquivos afetados (busca + replace direcionado):**
- `src/pages/DashboardPage.tsx`
- `src/pages/MaterialsPage.tsx`, `BibliotecaPage.tsx`, `ApostilaPage.tsx`, `ExercisesPage.tsx`, `SimuladoPage.tsx`, `AdminPage.tsx`, `ProfilePage.tsx`, `CommunityPage.tsx`, `ReviewPage.tsx`
- `src/components/AppHeader.tsx`

Mudanças:
- Trocar paddings fixos `px-6/px-8` por `px-3 sm:px-4 lg:px-6`.
- Garantir `max-w-screen-xl mx-auto w-full` nos wrappers de página.
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` em vez de `grid-cols-2` direto.

### D. MobileCarousel
**Arquivo:** `src/components/MobileCarousel.tsx`

- Trocar `min-w-[80vw]` por `min-w-[85%] max-w-[85%]` para nunca exceder o container pai.
- Adicionar `min-w-0` no wrapper externo para evitar overflow em flex parents.

### E. GliderTabs
**Arquivo:** `src/components/GliderTabs.tsx` + CSS em `index.css`

- Adicionar `overflow-x: auto; scroll-snap-type: x mandatory;` no container.
- Recalcular glider considerando `scrollLeft` quando ativo está fora da viewport.
- Auto-scroll para a aba ativa em mobile.

### F. Apostila — leitor responsivo
**Arquivo:** `src/components/ApostilaContentRenderer.tsx`

- Wrapper raiz: `max-w-[70ch] mx-auto px-3 sm:px-4 w-full min-w-0`.
- `<img>` da apostila: garantir `class="max-w-full h-auto"`.
- Drop-cap: reduzir em mobile (`text-[2.6em] sm:text-[3.4em]`) para não estourar.
- Tabelas markdown: envolver em `<div class="overflow-x-auto -mx-3 px-3">`.

### G. Blocos de código (Shiki)
**Arquivo:** `src/components/ApostilaContentRenderer.tsx` + `index.css`

- Container `CodeBlock`: adicionar `min-w-0` e `max-w-full`.
- `.shiki-wrapper pre`: já tem `overflow-x: auto`, garantir `white-space: pre` e `font-size: clamp(0.75rem, 2vw, 0.875rem)` em mobile.
- Header (linguagem + botão copiar): `flex-wrap` para não comprimir.

### H. Diálogos e Sheets
**Arquivos:** `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`

- DialogContent: substituir largura fixa por `w-[calc(100%-1.5rem)] max-w-lg sm:max-w-2xl`.
- SheetContent (lado direito): `w-full sm:max-w-md`.

### I. Tabelas Admin
**Arquivo:** `src/pages/AdminPage.tsx` (e onde houver `<Table>`)

- Envolver cada `<Table>` em `<div className="w-full overflow-x-auto rounded-md border">`.

### J. Header e FABs
**Arquivos:** `src/components/AppHeader.tsx`, `src/components/QuickActionsFab.tsx`, `src/components/ScrollToTopFab.tsx`

- AppHeader: `px-3 sm:px-4`, esconder textos secundários em `<sm` (já parcialmente feito), respeitar `pt-[env(safe-area-inset-top)]`.
- FABs: `bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 sm:right-4`.

## Não muda
- Lógica de negócio, hooks, Supabase, autenticação, gamificação.
- Conteúdo das apostilas, ordem de seções, cores do tema.
- Estrutura de rotas e componentes.

## Como vou validar
1. Navegar em 360px, 390px, 414px e 768px no preview e verificar:
   - Sem scroll horizontal em nenhuma página.
   - Headings legíveis sem quebra estranha.
   - Apostila com código C# rolando dentro do bloco, não da página.
   - Tabs do Admin com scroll horizontal funcional.
   - Diálogos cabem na tela com botões visíveis.
2. Confirmar que desktop (≥1024px) permanece idêntico ao atual.

## Resultado esperado
- Você abre o app no celular e nada precisa ser redimensionado.
- Apostilas, dashboards, admin e materiais se ajustam automaticamente entre 320px e 1920px.
- Código continua copiável e com syntax highlighting, agora sem estourar a tela.

