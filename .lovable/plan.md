## Objetivo

Aplicar a estética "liquid glass + hero cinematográfico" do referencial na landing page, **mantendo o DNA da Decode** (Space Grotesk, paleta ciano #00f0ff / roxo #a855f7, copy atual, todas as seções existentes). Só a **primeira dobra (hero + nav)** ganha o novo tratamento visual; o resto da landing continua igual.

## O que muda

**1. Novo Hero com vídeo em background**
- Vídeo `/showcase/decode-app-tour.mp4` (o tour Remotion que já renderizamos) rodando em loop, muted, autoplay, `object-cover`, com `translate-y-[17%]` cropando o topo.
- Sistema de fade em JS via `requestAnimationFrame` (500ms fade-in no load/loop, 500ms fade-out quando faltam 0.55s pro fim, reset em `onended` com 100ms de delay). `fadingOutRef` previne re-trigger; cada fade cancela o RAF anterior; retoma da opacidade atual (sem snap).
- Overlay escuro por cima do vídeo (`bg-black/55` + gradient sutil ciano→roxo) pra garantir contraste e reforçar identidade Decode.

**2. Nav flutuante liquid-glass**
- Container `rounded-full` centralizado, `max-w-5xl mx-auto`, com classe `.liquid-glass`.
- Esquerda: logo da coruja Decode (mantido — não usar Globe do referencial) + wordmark "Decode Academy" em Space Grotesk semibold.
- Meio (md+): links atuais da landing ("Recursos", "Depoimentos", "Sobre" — mantendo a copy que já existe).
- Direita: "Entrar" (texto simples) + "Começar agora" (botão liquid-glass rounded-full) → ambos apontam pra `/login` como hoje.

**3. Conteúdo central do hero**
- Mantém **exatamente** a copy atual da landing (headline, subheadline, CTAs). Apenas reformatada no novo layout:
  - Headline atual em Space Grotesk (não Instrument Serif — preserva marca), `text-5xl md:text-6xl lg:text-7xl`, com a palavra-chave destacada em gradient ciano→roxo.
  - Subtítulo atual abaixo.
  - CTA principal como botão glass branco arredondado com `ArrowRight` (lucide) — leva pra `/login`.
  - Botão secundário "Ver por dentro" em liquid-glass, scrolla até a `AppShowcaseSection`.
- **Sem campo de newsletter** e sem "Sign Up / Login" com copy inglesa do referencial — nossa landing converte pra login de aluno, não pra newsletter.

**4. Ícones sociais no rodapé do hero**
- Três botões circulares liquid-glass com ícones lucide (Instagram, Youtube, Globe) → linkam pros perfis reais se existirem, senão ocultam. `aria-label` em cada um.

## O que NÃO muda

- Fonte Space Grotesk continua como fonte principal do projeto (não importamos Instrument Serif — quebraria a memória "Fonte Space Grotesk").
- Paleta: dark #050508 + ciano #00f0ff + roxo #a855f7. Overlays glass usam branco translúcido só como acento.
- Todas as seções abaixo do hero (`AppShowcaseSection`, features, testimonials, CreatorSection, footer com "Desenvolvido por: Kaique Aurelio & Decode Analytics") ficam **intactas**.
- Rota `/`, roteamento, PWA, autenticação, `MobileBottomNav` no interior do app — nada é tocado.

## Detalhes técnicos

- **CSS**: adicionar classe `.liquid-glass` em `src/styles/landing-motion.css` (ou novo `src/styles/liquid-glass.css` importado no `App.tsx`) com exatamente as specs do referencial: `rgba(255,255,255,0.01)` + `background-blend-mode: luminosity` + `backdrop-filter: blur(4px)` + `box-shadow: inset 0 1px 1px rgba(255,255,255,0.1)` + pseudo-`::before` com gradient mask trick (`-webkit-mask-composite: xor`) pra borda glass. `pointer-events: none` no `::before`.
- **Componente**: novo `src/components/landing/HeroCinematic.tsx` encapsulando vídeo + nav + conteúdo central + sociais. Substitui o hero atual dentro de `src/pages/LandingPage.tsx` (a seção antiga do hero é removida; showcase, features, etc. permanecem).
- **Vídeo fade JS**: hook local com refs (`videoRef`, `rafRef`, `fadingOutRef`), listeners `loadeddata`, `timeupdate`, `ended`. Fade cancela `cancelAnimationFrame(rafRef.current)` antes de iniciar novo. Respeita `prefers-reduced-motion` (sem fade, opacidade fixa).
- **Fallback**: se o vídeo falhar (`onerror`), mostra o poster `/showcase/decode-app-tour-poster.jpg` estático — o hero continua legível.
- **Mobile**: nav vira compacta (`max-w-5xl` já responsivo), links do meio somem em `<md`, sociais e CTA permanecem. `translate-y-[17%]` do vídeo mantém-se; overlay mais denso no mobile pra garantir leitura.
- **Acessibilidade**: `aria-hidden` no vídeo decorativo, `aria-label` nos ícones sociais, `prefers-reduced-motion` desativa autoplay/fade.

## Arquivos afetados

- **novo** `src/components/landing/HeroCinematic.tsx`
- **editado** `src/pages/LandingPage.tsx` (troca só o bloco do hero)
- **novo** `src/styles/liquid-glass.css` importado em `src/App.tsx`

Sem mudanças em backend, rotas, auth, ou qualquer outra tela.
