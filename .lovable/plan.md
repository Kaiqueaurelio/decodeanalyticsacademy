

## Plano: Corrigir instalação do app no celular (PWA)

### Problemas encontrados

1. **Manifest não linkado** — `index.html` não tem `<link rel="manifest">`, então o navegador nunca detecta o app como instalável
2. **Ícones não existem** — `icon-192.png` e `icon-512.png` referenciados no manifest não existem em `/public`
3. **Evento `beforeinstallprompt` nunca é capturado** — nenhum código em `main.tsx` escuta o evento e salva em `window.__pwaInstallPrompt`
4. **Fallback ruim** — quando o prompt não existe, abre `window.open()` que não faz nada útil

### Correções

1. **Gerar ícones PWA** — Criar `icon-192.png` e `icon-512.png` a partir do logo existente (`src/assets/logo-dark.jpeg`) usando canvas/script

2. **Adicionar `<link rel="manifest">` no `index.html`**
   ```html
   <link rel="manifest" href="/manifest.json" />
   <link rel="apple-touch-icon" href="/icon-192.png" />
   ```

3. **Capturar evento `beforeinstallprompt` em `main.tsx`**
   ```typescript
   window.addEventListener('beforeinstallprompt', (e) => {
     e.preventDefault();
     (window as any).__pwaInstallPrompt = e;
   });
   ```
   Com guard para não rodar em iframe/preview (seguindo as regras PWA do Lovable)

4. **Melhorar `handleInstallPWA` no LandingPage** — Mostrar instruções manuais (iOS: "Compartilhar → Adicionar à Tela de Início", Android: "Menu → Instalar app") quando o prompt nativo não está disponível, em vez de abrir uma aba vazia

5. **Manifest** — Adicionar campos recomendados (`description`, `orientation`, `scope`) para melhorar compatibilidade

### Resultado
O botão "Instalar no celular" vai funcionar: no Android mostra o prompt nativo de instalação; no iOS mostra instruções visuais de como adicionar à tela de início.

