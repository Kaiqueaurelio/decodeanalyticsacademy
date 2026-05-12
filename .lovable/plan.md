## Plano: Coruja como ícone do app

### 1. Salvar a imagem da coruja
- Copiar `user-uploads://image-16.png` para `src/assets/owl-icon.png` (uso em componentes React).
- Copiar também para `public/owl-source.png` (fonte para gerar ícones).

### 2. Gerar todos os ícones do app a partir da coruja
Usando ImageMagick, gerar a partir de `public/owl-source.png`:
- `public/favicon.ico` (multi-size)
- `public/favicon.png` (256x256)
- `public/apple-touch-icon.png` (180x180)
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/logo-decode.png` (1024x1024)

Isso faz com que, ao instalar o app no celular (PWA / "Adicionar à tela inicial"), o ícone seja a coruja. O `manifest.json` já aponta para esses arquivos — não precisa mexer.

### 3. Atualizar `index.html`
Bumpar o cache (`?v=3`) nas tags de favicon e apple-touch-icon para forçar atualização nos navegadores.

### 4. Adicionar logo da coruja onde ainda não aparece
Manter intactos os locais que já mostram a coruja (Header, Splash, AppLock, Login). Adicionar nestes pontos onde hoje não há logo:
- **`src/pages/LandingPage.tsx`** — adicionar a coruja no hero (ao lado do título principal) caso ainda não exista.
- **`src/pages/NotFound.tsx`** — coruja acima do "404".
- **`src/pages/OfflinePage.tsx`** — coruja acima da mensagem de offline.
- **`src/components/SafeModeBanner.tsx`** — pequeno ícone da coruja ao lado do título.
- **Footer da Landing** (dentro de `LandingPage.tsx` ou componente próprio) — coruja pequena junto da assinatura "Desenvolvido por: Kaique Aurelio & Decode Analytics".

Antes de editar cada um, leio o arquivo para confirmar se já tem logo e só adiciono onde estiver faltando, preservando 100% do conteúdo existente (Regra de Ouro).

### 5. Validação
- Verificar que arquivos de ícone foram gerados nos tamanhos corretos (`identify`).
- Confirmar build limpo (sem imports quebrados).

### Detalhes técnicos
- Não tocar em `src/integrations/supabase/*`, `.env`, `supabase/config.toml`.
- Não alterar `manifest.json` (já referencia os caminhos corretos).
- Imports da coruja em componentes via `@/assets/owl-icon.png`.
- Tokens semânticos preservados — só adição de `<img>` com classes Tailwind existentes.
