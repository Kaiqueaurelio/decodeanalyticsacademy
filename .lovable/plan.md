

## Diagnóstico

Olhando a sua print + DOM + banco:

1. **A imagem ESTÁ sendo renderizada** (HTTP 200, 625KB). O que aparece como "vazio escuro" é a própria imagem — provavelmente um PNG com fundo escuro/transparente do Gemini/ChatGPT, que se funde com o fundo dark da apostila. Por isso parece "sumida".
2. **A legenda "ChatGPT Image 19 de abr. de 2026, 19_07_14.png"** vem do `alt` do markdown (`![ChatGPT Image …](url)`), que o `ImageBlock` em `ApostilaContentRenderer.tsx` exibe como `<figcaption>`.

## Solução

Editar **`src/components/ApostilaContentRenderer.tsx`** → função `ImageBlock`:

**1. Remover legendas que parecem nome de arquivo**
Detectar padrões tipo `*.png`, `*.jpg`, `Gemini_Generated_Image_…`, `ChatGPT Image …`, `IMG_1234`, `Screenshot …` e **não renderizar** o `<figcaption>` nesses casos. Só mostra legenda se o `alt` for texto descritivo real (sem extensão de arquivo, sem padrões de nome gerado).

**2. Garantir visibilidade da imagem em fundo escuro**
- Embrulhar `<img>` em uma moldura com `bg-white` (ou `bg-zinc-50`) e `padding`, para que PNGs escuros/transparentes apareçam contra fundo claro.
- Adicionar `min-height` e `loading="lazy"` + handler de erro mostrando placeholder visível ("Imagem indisponível") em vez de espaço vazio.
- Manter `rounded-xl` e sombra elegante.
- Largura confortável (`max-w-full sm:max-w-[90%]`), centralizada.

**3. Aplicar a mesma lógica no PDF (`src/lib/apostila-pdf.ts`)**
Para a exportação ficar consistente: mesma moldura clara nas imagens e supressão de legendas com nome de arquivo.

## Helper (lógica)

```ts
function isFilenameLike(alt: string): boolean {
  if (!alt?.trim()) return true;
  return (
    /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(alt) ||           // extensão
    /^(IMG[_\-]?\d|Screenshot|Captura|Gemini[_ ]Generated|ChatGPT Image)/i.test(alt) ||
    /^[a-z0-9_\-]{8,}$/i.test(alt)                            // string aleatória sem espaços
  );
}
```

Se `isFilenameLike(alt)` → não renderiza `<figcaption>`.

## Arquivos modificados
- `src/components/ApostilaContentRenderer.tsx` — `ImageBlock`: moldura clara + supressão de caption de nome de arquivo + fallback de erro.
- `src/lib/apostila-pdf.ts` — mesma melhoria visual para o PDF exportado.

## Não muda
- Conteúdo do banco (markdown intacto).
- Distribuição de imagens entre seções (já funciona — você viu 4 imagens entre os parágrafos).
- Nada do chat, anotações, exercícios, código copiável.

## Resultado
- Sem mais "ChatGPT Image 19 de abr…" embaixo das imagens.
- Imagens com fundo escuro passam a aparecer claramente sobre uma moldura branca arredondada.
- Se algum dia o link de uma imagem quebrar, aparece um placeholder amigável em vez de buraco.

