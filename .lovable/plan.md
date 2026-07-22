## Objetivo

Aplicar o sistema **liquid glass em duas camadas** (`.liquid-glass` e `.liquid-glass-strong`) em toda a landing — hero + Recursos + Trilha + Depoimentos + Redes/Projetos + rodapé — preservando 100% da copy, dos links, das rotas e da lógica. Só camada visual muda.

## Decisões confirmadas

- **Vídeo do hero:** `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4`. Sistema de fade em JS mantido (rAF, 500ms in/out, dispara out 0.55s antes do fim, `fadingOutRef` evita duplicata, cancela rAF anterior, reset em `ended` com currentTime = 0).
- **Paleta:** neutralização 100%. Todo ciano/roxo/verde-WhatsApp/gradiente-Instagram/estrelas coloridas viram branco/cinza sobre vidro. Links continuam funcionais — perdem só a cor de marca.
- **Fundo fora do hero:** preto sólido com glows brancos/cinza sutis atrás dos cards.

## Arquivos editados (só visual)

```text
src/index.css                                   → @layer components: .liquid-glass e .liquid-glass-strong; --radius: 1rem
src/components/landing/CinematicHero.tsx        → nova VIDEO_SRC + remove <style> local (classes vêm do CSS global)
src/components/landing/AppShowcaseSection.tsx   → chips, frame do vídeo e glows em glass neutro
src/components/TechStackSection.tsx             → Timeline / Stack / Features em .liquid-glass, ícones brancos
src/components/LiveAppSection.tsx               → painel em .liquid-glass-strong, 4 pilares em .liquid-glass
src/components/CreatorSection.tsx               → card em .liquid-glass-strong, quote/pilares em .liquid-glass, botões neutros
src/components/TestimonialsSection.tsx          → cards em .liquid-glass, avatares cinza, stars brancas
src/components/SocialAndProjectsSection.tsx     → cards sociais, painel share e card WriteLab em glass neutro
src/pages/LandingPage.tsx                       → mantém bg-black; adiciona glows sutis brancos atrás das seções
```

Nenhum outro arquivo é tocado. Nenhuma rota, hook, fetch ou integração muda.

## Diretrizes técnicas

1. **CSS base** — adiciona ao fim de `src/index.css`:
  - `:root { --radius: 1rem; }` (append, não sobrescreve o resto).
  - `@layer components { .liquid-glass { … } .liquid-glass-strong { … } }` com os valores exatos da spec: blur 4px vs 50px, `background-blend-mode: luminosity`, `::before` com `mask-composite: exclude`, gradiente 180deg (0.45→0.15→0→0→0.15→0.45 no fraco; 0.5→0.2→0→0→0.2→0.5 no forte), `box-shadow` diferenciado, `pointer-events: none` no `::before`.
  - Remove o bloco `<style>` inline do `CinematicHero` (usa a classe global).
2. **Regra "sem `border-*`"** — remove classes/inline `border` de todos os componentes editados; contorno passa a vir só do `::before`.
3. **Cor:** substituições sistemáticas `#00f0ff` / `#a855f7` / verde WhatsApp / gradiente Instagram → `text-white`, `text-white/70`, `text-white/50`, `bg-white/10`. Ícones sociais e stars ficam brancos.
4. **Ícones-ação secundários:** `w-8 h-8 rounded-full bg-white/10 flex items-center justify-center`.
5. **Interações:** clicáveis com `hover:scale-105 transition-transform`; botões primários `active:scale-95`.
6. **Tipografia:** títulos de seção passam a `fontFamily: "'Instrument Serif', serif"` inline (mesma fonte já importada no hero). Corpo continua na sans-serif atual — `tailwind.config.ts` não muda.

## Guardrails

- Toda copy existente permanece byte a byte (Timeline, Stack, Features, quote do Kaique, WriteLab, depoimentos do banco, share text).
- Links intactos: WhatsApp, e-mail, Instagram, Twitter, WriteLab, Termos, âncoras `#recursos`/`#roadmap`/`#depoimentos`, form → `/login`.
- Créditos do rodapé permanecem.

## Ordem de execução

1. `src/index.css` — sistema de vidro + `--radius`.
2. `CinematicHero.tsx` — nova `VIDEO_SRC`, remove `<style>` local.
3. Seis componentes de seção — passam para glass neutro na mesma leva.
4. `LandingPage.tsx` — glows brancos sutis atrás das seções.  
[https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4](https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4)