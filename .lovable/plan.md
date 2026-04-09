

## Plano: Corrigir reprodução de vídeo no app

### Problema
O `<video>` element tem `crossOrigin="anonymous"`, que exige que o servidor envie headers CORS específicos. O Supabase Storage com bucket privado e signed URLs pode não enviar esses headers corretamente, fazendo o navegador bloquear o carregamento do vídeo.

Além disso, o `src` está definido duas vezes (como atributo do `<video>` e dentro do `<source>`), o que pode causar conflitos.

### Correções

**Arquivo: `src/pages/MaterialsPage.tsx` — componente `VideoPlayer`**

1. **Remover `crossOrigin="anonymous"`** — não é necessário para reprodução de vídeo e causa bloqueio CORS com signed URLs de bucket privado
2. **Remover o atributo `src` do `<video>`** — manter apenas o `<source>` com o tipo MIME correto para evitar conflito de dupla fonte
3. **Adicionar `controlsList`** para melhor UX mobile
4. **Adicionar fallback mais robusto** — tentar recarregar com URL sem query params (cache bust) antes de mostrar erro

### Resultado
Os vídeos vão carregar e reproduzir diretamente dentro do app sem erros de CORS ou conflito de fonte.

