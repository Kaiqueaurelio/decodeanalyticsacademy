# Plano: Modo Claro legível + Pop-up de Anúncio funcionando

## 1. Modo Claro (light mode) — revisão completa

Hoje os tokens light em `src/index.css` (`:root`) usam um fundo cinza-azulado (`220 14% 96%`) com primário ciano escuro (`188 92% 28%`) e bordas/muted muito próximos do fundo, gerando baixo contraste e "lavagem" geral. Resultado: texto e cards desaparecem.

**Ações:**
- Reescrever a paleta `:root` em `src/index.css` para um light mode "Apple-like" limpo:
  - `--background`: branco puro (`0 0% 100%`)
  - `--foreground`: quase preto (`222 47% 8%`) — contraste AAA
  - `--card`: `0 0% 100%` com `--card-foreground` igual ao foreground
  - `--muted`: `220 14% 96%` (suave) / `--muted-foreground`: `222 16% 28%` (legível)
  - `--border`: `220 13% 88%` (visível mas sutil) / `--input`: igual
  - `--primary`: ciano da marca, mas escurecido para contrastar com branco (`188 95% 32%`) com `--primary-foreground` branco
  - `--accent`: roxo da marca em tom legível (`271 70% 50%`)
  - `--secondary`: `220 14% 94%` com texto escuro
  - `--destructive`, `--success`, `--warning`: tons saturados sobre branco com foreground branco
  - `--ring`: usa primary
- Adicionar sombras suaves específicas para light mode (token `--shadow-elegant` já existente, validar se funciona em ambos os temas; ajustar opacidade no light).
- Verificar superfícies que usam `bg-background/80 backdrop-blur` (header, popovers): garantir que com fundo branco continuam legíveis (aumentar opacidade base se preciso).
- Conferir gradientes hard-coded no Dashboard/Landing que assumem fundo escuro — se houver `from-black`, `to-black`, `text-white` fixos, substituir por tokens semânticos quando o usuário realmente quiser legibilidade no claro. (Escopo limitado: só o que estiver visivelmente quebrado.)

## 2. Pop-up de Anúncio não aparece — correções

Inspeção mostra:
- 2 anúncios `popup` ativos no banco (target=all). Backend OK.
- `<AdPopup trigger="onLoad" delay={2500} />` está montado em `App.tsx`. ✅
- **Bugs no `src/components/AdPopup.tsx`:**
  1. `sessionStorage.setItem('popup_ad_shown', 'true')` é gravado **antes** de o pop-up aparecer com sucesso. Se o usuário visitou o app uma vez na sessão (ou o timer disparou antes do anúncio carregar), o flag fica gravado e o pop-up nunca mais aparece naquela aba — mesmo após F5 dependendo do navegador.
  2. O `useEffect` de trigger depende de `currentAd` e `hasShownThisSession`, mas só lê `sessionStorage` uma vez no mount; múltiplos re-renders podem agendar múltiplos `setTimeout`.
  3. Não há log/erro visível quando RLS bloqueia `ad_views` insert.

**Ações:**
- Em `AdPopup.tsx`:
  - Mover `sessionStorage.setItem('popup_ad_shown', ...)` para **dentro** de `showPopup`, depois de confirmar `currentAd` existe.
  - Garantir `clearTimeout` no cleanup do `useEffect` (já existe, mas remover `currentAd` das dependências para não reagendar).
  - Adicionar `console.debug('[AdPopup]', { adsCount, loading, hasShownThisSession })` para diagnosticar no preview.
  - Adicionar fallback: se `sessionStorage` indisponível, ainda exibir.
- Verificar RLS da tabela `ad_views` / `ad_clicks` — se `INSERT` exige usuário autenticado, anônimos quebram. Confirmar e ajustar policy se necessário (permitir insert anônimo apenas com `session_id` não nulo).

## 3. Validação
- Alternar tema no header e revisar visualmente Dashboard, Landing, Login, Apostila e Admin no modo claro.
- Limpar `sessionStorage.popup_ad_shown` no console e recarregar para conferir o pop-up aparecer após 2,5s.
- Verificar console por logs `[AdPopup]` e erros de RLS.

## Arquivos afetados
- `src/index.css` (tokens `:root`)
- `src/components/AdPopup.tsx`
- Possivelmente nova migração para policy `ad_views`/`ad_clicks` (somente se confirmado bloqueio)
