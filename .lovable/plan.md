## Plano

A coruja (`src/assets/owl-icon.png`) já está configurada como ícone de instalação do app. Apenas vou regenerar os arquivos para garantir nitidez e cache atualizado.

### Mudanças
1. Regerar a partir de `src/assets/owl-icon.png` com fundo sólido `#050508` e padding seguro:
   - `public/icon-192.png` (192×192)
   - `public/icon-512.png` (512×512)
   - `public/apple-touch-icon.png` (180×180)
2. Bump de cache: `?v=5` em `index.html` e `public/manifest.json`.
3. Manter o logo Decode no header do app (sem alterações em `AppHeader.tsx` nem `SplashScreen.tsx`).

### Não muda
- Favicon do navegador (continua o atual).
- Logo dentro do app.
