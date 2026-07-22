## Objetivo

Três entregas isoladas, sem quebrar nada do que já existe:

1. Deixar o projeto pronto para gerar um **Android App Bundle (.aab)** com Capacitor, mantendo o PWA funcionando.
2. Validar os feeds RSS em tempo real (backend + admin) e manter só os que funcionam.
3. Fazer o clique numa notícia abrir **dentro do app** (sem sair para outro app/navegador).

---

## 1. Capacitor Android pronto para .aab

O `capacitor.config.ts` e as dependências (`@capacitor/core`, `cli`, `android`, `ios`) já existem. Falta preparar o projeto para build de produção Android.

**O que será feito:**

- Ajustar `capacitor.config.ts` com um modo de produção: manter o `server.url` atual (hot-reload no sandbox Lovable) apenas em dev; em build de produção o app carrega os assets locais de `dist/` (obrigatório para publicar na Play Store — Google não aceita apps que só carregam URL remota).
- Adicionar script `build:android` no `package.json` que roda `vite build` + `cap sync android`.
- Criar um guia passo-a-passo em `ANDROID_BUILD.md` na raiz explicando o fluxo completo:
  1. Exportar o projeto para GitHub e clonar localmente
  2. `npm install`
  3. `npx cap add android`
  4. `npm run build && npx cap sync android`
  5. Abrir `npx cap open android` no Android Studio
  6. Configurar keystore de assinatura
  7. Build → Generate Signed Bundle → `.aab` para Google Play
- Documentar o `appId` (`app.lovable.4dd1aec291754ae994018637f1ffe1a2`) e nome (`decodeanalyticsacademy`) já configurados.
- Manter o PWA 100% intacto: nenhuma alteração em `vite.config.ts` (VitePWA), `manifest.json`, `sw-push.js`, `src/lib/pwa.ts`.

**Nota importante:** o build final do `.aab` precisa ser feito na máquina do usuário (Android Studio + JDK + keystore). O sandbox Lovable não gera `.aab` — deixamos tudo configurado para que baste seguir o guia.

---

## 2. Validação de RSS (só feeds que funcionam)

**Backend — nova edge function `validate-rss`:**

- Recebe uma URL, faz `fetch` com timeout de 6s.
- Verifica: status HTTP 200, content-type XML/RSS/Atom, e se o corpo contém `<item>` ou `<entry>` com pelo menos 1 título parseável.
- Retorna `{ ok, source: string|null, itemCount: number, error?: string }`.

**Admin — `RssFeedsManager.tsx`:**

- Ao digitar a URL e sair do campo (blur) ou clicar em "Validar", chama `validate-rss` e mostra:
  - ✓ verde: "Feed válido — X notícias detectadas"
  - ✗ vermelho: "Feed indisponível: {motivo}"
- Botão "Adicionar" só habilita se a validação passou (com opção "Adicionar mesmo assim" escondida atrás de um link discreto).
- Adiciona botão "Revalidar todos" na lista existente: roda `validate-rss` em cada feed cadastrado e marca visualmente os quebrados (badge vermelha "Fora do ar") + botão para desativar em 1 clique.

**Edge function `tech-news`:**

- Continua com a lógica atual de fallback, mas agora ignora silenciosamente feeds que retornaram 0 itens (sem devolver `errors` para a UI).
- Remove a exibição do banner "alguns feeds indisponíveis" do `NewsPage.tsx`.

**Limpeza inicial dos feeds default:** dos 8 defaults atuais (Canaltech, Tecnoblog, Olhar Digital, TudoCelular, Diolinux, SempreUpdate, Hardware.com.br, Baguete), manter na lista default apenas os que a `validate-rss` confirmar como ativos no momento da implementação. Os quebrados saem do array `DEFAULT_FEEDS`.

---

## 3. Leitor de notícias in-app (sem sair da plataforma)

Hoje o `NewsPage` abre um iframe modal, mas quando o site bloqueia iframe (`X-Frame-Options: DENY`) mostra um botão que leva o usuário para fora. Vamos resolver isso.

**Nova edge function `news-reader`:**

- Recebe `?url=...`, faz fetch do HTML da notícia.
- Usa um extrator de conteúdo principal (Readability-like: pega `<article>`, `<main>`, ou o maior bloco de `<p>`) e retorna HTML limpo com título, imagem principal, autor, data e corpo — sem scripts, sem iframes de anúncio, sem trackers.
- Retorna JSON: `{ title, byline, siteName, image, contentHtml, url }`.
- Cache de 1h em memória por URL.

**`NewsPage.tsx` — novo componente `InAppNewsReader`:**

- Ao clicar numa notícia, abre uma tela cheia (drawer/modal) dentro do próprio app, chama `news-reader` e renderiza o conteúdo com a tipografia da plataforma (Space Grotesk, cores do tema high-tech).
- Loading skeleton enquanto busca.
- Se a extração falhar, mostra o resumo + botão "Abrir no site original" (fallback controlado, mas raro).
- Header com: voltar, fonte (badge com portal), tempo de leitura estimado, botão compartilhar (Web Share API quando disponível).
- Nenhum iframe. Nenhum `window.open`. Nenhum redirecionamento externo por padrão.

**Impacto:** o usuário lê a matéria completa sem sair do Decode Analytics Academy, com visual consistente e sem ads de terceiros.

---

## Detalhes técnicos

**Arquivos novos:**
- `ANDROID_BUILD.md`
- `supabase/functions/validate-rss/index.ts`
- `supabase/functions/news-reader/index.ts`
- `src/components/news/InAppNewsReader.tsx`

**Arquivos editados (sem quebrar comportamento):**
- `capacitor.config.ts` — server.url só em dev
- `package.json` — script `build:android`
- `src/components/admin/RssFeedsManager.tsx` — validação inline + revalidar todos
- `src/pages/NewsPage.tsx` — trocar iframe modal pelo `InAppNewsReader`, remover banner de erros
- `supabase/functions/tech-news/index.ts` — silenciar erros de feeds, filtrar vazios

**Nada é tocado em:** rotas existentes, MobileBottomNav, StudentSidebar (já tem "Notícias Tech"), banco de dados (tabela `rss_feeds` continua igual), PWA, autenticação, dashboard.

**Riscos e mitigação:**
- Alguns portais podem quebrar a extração de conteúdo → fallback para resumo + link externo em último caso.
- Build Android exige ferramentas locais → documentado no `ANDROID_BUILD.md`; não há como gerar `.aab` no sandbox.
