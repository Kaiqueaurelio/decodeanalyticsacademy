# Plano: GIF showcase do app na landing

## Objetivo
Criar um GIF de ~25s mostrando as principais telas do Decode Analytics Academy e inseri-lo numa nova seção **"Veja por dentro"** na landing page.

## Conteúdo do GIF (storyboard, ~25s @ 24fps)
Mockup de notebook/navegador com transições suaves entre 6 cenas:
1. **Login/Portal** (3s) — split-screen com identidade Decode
2. **Dashboard do aluno** (4s) — hero greeting, widgets, carrosséis de apostilas
3. **Leitura de apostila** (4s) — layout 3 colunas com TOC hierárquico
4. **Exercícios + Gamificação** (4s) — questão, feedback, XP subindo, badge
5. **Flashcards + Pomodoro** (4s) — ferramentas de produtividade
6. **Biblioteca Digital + Leaderboard** (6s) — PDFs estilo Google Play + ranking

Estética: dark #050508, ciano #00f0ff, roxo #a855f7, fonte Space Grotesk. Transições estilo Apple (fade + leve scale/parallax).

## Como será produzido
- Construir cenas via **Remotion** (React + Tailwind) com mocks fiéis ao app (sem precisar logar/screenshotar telas reais, evitando dados sensíveis e marca d'água).
- Renderizar primeiro um MP4 1280x720 mudo, depois converter para **GIF otimizado** via `ffmpeg` com palette (paletteuse) para manter qualidade e tamanho razoável (~3-6 MB).
- Salvar em `public/showcase/decode-app-tour.gif` para uso direto na landing.

## Nova seção na landing
- Criar `src/components/landing/AppShowcaseSection.tsx`:
  - Título: "Veja por dentro da Academy"
  - Subtítulo curto
  - GIF dentro de um frame de notebook/mac com glow ciano/roxo
  - Pequenos chips destacando: Dashboard · Apostilas · Exercícios · Gamificação · Biblioteca
- Inserir entre o hero e a próxima seção existente em `src/pages/Index.tsx` (ou equivalente da landing), mantendo todas as seções atuais intactas (Regra de Ouro).
- Animação de entrada com Framer Motion (fade + slide) seguindo o sistema já existente.

## Detalhes técnicos
- **Remotion**: scaffold em `remotion/` com `bun init`, render via `scripts/render-remotion.mjs` (headless chrome-for-testing, muted).
- **Conversão GIF**: `ffmpeg -i tour.mp4 -vf "fps=18,scale=900:-1:flags=lanczos,palettegen" palette.png` + `paletteuse` para reduzir peso.
- Fallback: também gerar uma versão `.mp4`/`.webm` e usar `<picture>`/`<video autoplay loop muted playsinline>` com `<img>` GIF como fallback — melhor performance no mobile sem perder o "GIF" pedido.
- Lazy-load com `loading="lazy"` e `prefers-reduced-motion` exibe um still PNG.

## Arquivos
- Criar: `remotion/*` (Root, MainVideo, 6 scenes, render script)
- Criar: `public/showcase/decode-app-tour.gif` (+ `.mp4`, `.webm`, poster `.png`)
- Criar: `src/components/landing/AppShowcaseSection.tsx`
- Editar: arquivo da landing (Index/Landing) para incluir a seção

## Entregáveis
- GIF funcionando na landing dentro de seção "Veja por dentro"
- Fontes do Remotion versionadas para futuras edições
