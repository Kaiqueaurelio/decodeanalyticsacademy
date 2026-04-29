# Plano: Responsividade Global + Mobile-First na Aba Play Books

## Objetivo
Eliminar pontos fracos de responsividade do app (em especial 320–414 px) e refinar a aba **Play Books** para ter experiência fluida e nativa em celular, sem quebrar nenhuma funcionalidade existente. Nada na lógica de leitura, sync ou banco será alterado — apenas layout, tamanhos, alvos de toque e overflow.

---

## Escopo

### 1) Play Books — Library (`PlayBooksLibrary.tsx`)
**Problemas atuais em mobile (411 px):**
- Tabs (Início / Biblioteca / Audiolivros) + botão "Enviar" colidem na mesma linha → estouro horizontal.
- Grid `grid-cols-3` força capas ~110 px de largura → títulos truncados demais; muito apertado em telas pequenas.
- Prateleiras (Shelves) usam `-mx-4 px-4`, mas o container pai já tem `px-4 sm:px-6` no `PlayBooksPage` → não há sangramento real até a borda em mobile.

**Mudanças:**
- Tabs viram **scroll horizontal** com `snap`, alturas/paddings reduzidos (`px-3 py-2`), botão "Enviar" sobe para o cabeçalho (lado do título no `PlayBooksPage`) liberando a linha de tabs.
- Grid de capas em mobile: `grid-cols-2` (≤360 px) e `grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 …` com `gap-y-5`.
- Prateleiras em mobile usam scroll com `snap-x` + cards de **128 px** (continue) e **108 px** (demais), garantindo 2,5 cards visíveis em 375 px (descoberta visual).
- Cobertura/escala de toque: cada `BookCard` ganha `min-h-[44px]` no rótulo e `active:scale-[0.97]` para feedback tátil.
- Busca: input ganha `text-[16px]` (evita zoom automático no iOS) e ícone alinhado ao centro vertical.

### 2) Play Books — Reader (`PlayBooksReader.tsx`)
**Problemas atuais em mobile:**
- Header e footer com altura fixa (12 / 14) e barras de progresso `inset-x-3 bottom-14` ficam quase tocando o footer → conflito visual.
- Menu de seleção (highlights) usa coordenadas `absolute` baseadas em `clientRect` — em telas estreitas pode sair da viewport (`-translate-x-1/2` + 7 botões = ~280 px).
- TypographySheet, BookmarksSheet, HighlightsSheet abrem como Sheet à direita (largura padrão) — desconfortável em mobile; ideal: bottom sheet.
- TOC do EPUB: Sheet à direita `w-72` corta em telas <320.
- `pageWidth` do PDF não respeita `safe-area-inset` (notch/home bar) e em landscape pode passar do limite.
- Não há respeito a `env(safe-area-inset-*)` nem a `100dvh` (a barra de URL móvel "come" 100vh em iOS Safari).

**Mudanças:**
- Container raiz: `h-[100dvh]` + `paddingTop: env(safe-area-inset-top)` e `paddingBottom: env(safe-area-inset-bottom)` no header/footer (via inline style), nunca cortando conteúdo.
- Cálculo de `pageWidth` do PDF passa a usar `Math.min(containerWidth - margin*2, containerHeight * 0.62, 1100)` e `margin` dinâmico (12 em <380 px, 24 em ≥640).
- Menu de seleção (highlight bubble): clamp horizontal para ficar dentro de `[12, viewportWidth - 12]`; em mobile reduz para 5 botões essenciais (3 cores + Nota + Copiar) e move "Compartilhar/Fechar" para uma segunda linha colapsável quando width < 360.
- Slider/page indicator inferior: sobe de `bottom-14` para `bottom-[calc(56px+env(safe-area-inset-bottom))]` e ganha 100% de largura útil.
- TypographySheet, BookmarksSheet, HighlightsSheet, TOC: detectam mobile via `useIsMobile()` e passam `side="bottom"` no `<SheetContent>` com `h-[80vh] rounded-t-2xl`. No desktop continua à direita.
- Botão de marcador (top-right) ganha `h-10 w-10` (alvo de toque WCAG ≥44 px) e `top-[calc(48px+env(safe-area-inset-top))]`.
- Tap zones laterais (28% / 72%) ficam visíveis através de hint sutil na primeira abertura (já existe `chrome` overlay; reforçar contraste em <380 px).

### 3) Play Books — Upload (`PlayBooksUpload.tsx`)
- Modal vira **bottom sheet** em mobile (Drawer com `vaul`, já disponível em `components/ui/drawer.tsx`), permanecendo como modal centralizado em ≥sm.
- Inputs de arquivo recebem `text-[16px]` para não disparar zoom no iOS.
- Botão "Adicionar à estante" com `h-11` para conforto.

### 4) AppHeader (`AppHeader.tsx`)
**Problemas atuais em mobile:**
- 7+ ícones na barra (theme, sino, menu) podem amassar em 320 px se houver badge de notificação.
- Botão "Decode Analytics" (logo + nome) usa breakpoint custom `xs:` que pode não estar configurado no Tailwind; conferir e padronizar.

**Mudanças:**
- Garantir que o nome da marca em mobile use `<360px:` ícone só; ≥360: "Decode"; ≥sm: nome completo (substituindo `xs:` custom por classes nativas).
- Espaçamento dos ícones reduzido para `gap-0.5` em mobile.
- Sheet menu (Drawer lateral) ganha `w-[85vw] max-w-xs` para não estourar nem ficar pequeno demais.

### 5) Tweaks globais
- `index.css`: adicionar utilitário `.scrollbar-hide` (caso ainda não exista) e classe `.safe-bottom` (`padding-bottom: env(safe-area-inset-bottom)`).
- `tailwind.config.ts`: adicionar (se ausente) breakpoint `xs: 380px` para evitar uso fantasma.
- Páginas com tabela densa (Admin) já tratadas; nenhuma mudança aqui — apenas verificação que continuam funcionando.
- `Dashboard`/`Biblioteca`: revisar paddings horizontais para serem `px-3 sm:px-6` consistentes (corrigir só onde houver overflow real).

---

## Arquivos afetados

```text
src/modules/playbooks/components/PlayBooksLibrary.tsx   (refatorar grid + tabs + shelves mobile)
src/modules/playbooks/components/PlayBooksReader.tsx    (safe-area, bottom sheets, clamp, dvh, alvos toque)
src/modules/playbooks/components/PlayBooksUpload.tsx    (modal vira bottom sheet em mobile)
src/pages/PlayBooksPage.tsx                             (mover botão "Enviar" para o cabeçalho)
src/components/AppHeader.tsx                            (substituir xs:custom; reduzir gaps mobile)
src/index.css                                           (utilitário .safe-bottom; .scrollbar-hide se faltar)
tailwind.config.ts                                      (adicionar xs: 380px se não existir)
```

Nenhuma migração SQL, nenhuma edge function, nenhuma mudança em rotas, auth, gamificação, leitor de PDF/EPUB engine ou sync — apenas CSS/layout/sheet variants.

---

## Detalhes técnicos

- **`useIsMobile()`** já existe em `src/hooks/use-mobile.tsx` → usar para escolher `side="bottom" | "right"` nos `<SheetContent>` do Reader.
- **`100dvh`** (dynamic viewport) substitui `h-screen` apenas no container fixed do Reader; fallback `h-screen` mantido via classe.
- **Safe-area:** aplicado via `style={{ paddingTop: 'env(safe-area-inset-top)' }}` em header e `paddingBottom: 'env(safe-area-inset-bottom)'` em footer/slider — compatível com PWA standalone.
- **Clamp do bubble de seleção:** `Math.min(Math.max(x, 90), window.innerWidth - 90)`.
- **Não remover** nenhum botão/cor de highlight; apenas reorganizar visualmente quando `window.innerWidth < 360`.
- **Não alterar** assinatura de props nem APIs internas — refactor puramente visual.

---

## Critérios de aceite

1. Em 320 / 360 / 411 / 768 px nenhum elemento da aba Play Books gera scroll horizontal indesejado.
2. Bubble de highlight permanece 100% visível em qualquer largura ≥ 320 px.
3. Sheets de tipografia, marcadores, destaques e TOC abrem por baixo em mobile, à direita em desktop.
4. Reader respeita notch/home bar em iOS PWA.
5. Botão de upload acessível em qualquer aba (Início, Biblioteca, Audiolivros) sem competir por linha com as tabs.
6. Todas as funcionalidades existentes (highlight, bookmark, search, TOC, sync, themes, modes) continuam funcionando exatamente como antes.
