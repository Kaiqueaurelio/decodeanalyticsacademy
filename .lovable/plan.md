

## Plano: Corrigir erro de reprodução de vídeo

### Problema
O `<video>` falha porque:
1. O `<source>` não tem atributo `type` — o navegador não sabe o formato
2. Falta `crossOrigin="anonymous"` — necessário para carregar de domínio externo (Supabase Storage)
3. Não há fallback `src` direto no `<video>`

### Correções em `src/pages/MaterialsPage.tsx`

1. **Criar helper `getMimeType(url)`** que detecta extensão → MIME type (`.mp4` → `video/mp4`, `.mov` → `video/quicktime`, `.webm` → `video/webm`, `.m4a` → `audio/mp4`, etc.)

2. **No `VideoPlayer`**:
   - Adicionar `crossOrigin="anonymous"` no `<video>`
   - Adicionar `src={url}` direto no `<video>` como fallback
   - Adicionar `type={getMimeType(url)}` no `<source>`
   - Adicionar lógica de retry: no `onError`, tentar recarregar uma vez antes de mostrar erro

3. **No `AudioPlayer`**: Aplicar as mesmas correções (`crossOrigin`, `type` no source)

### Resultado
Vídeos e áudios do Supabase Storage vão carregar corretamente em todos os navegadores, incluindo Safari/iOS.

