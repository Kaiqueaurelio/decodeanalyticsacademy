## O que vou fazer

Gerar uma **nova versão do logo** com a mesma composição (coruja + livros), mas com **fundo totalmente transparente** e detalhes ajustados para ele "respirar" no tema dark (#050508) do app — sem moldura branca, sem caixa, sem borda.

## Como vou gerar

Uso a IA de edição de imagem sobre o `src/assets/logo-decode.png` atual com o prompt:

> "Remove o fundo escuro/azulado completamente, deixando apenas a coruja sentada sobre os livros. Fundo 100% transparente. Mantém as cores originais da coruja (marrom/dourado) e dos livros (azul ciano com detalhes de circuito). Adiciona um leve glow ciano (#00f0ff) sutil ao redor para destacar contra fundos escuros. Estilo high-tech, traços limpos."

Salvo em **`src/assets/logo-decode.png`** (sobrescreve o atual — todos os imports continuam funcionando, sem precisar mexer em código).

Tamanho: 1024×1024, PNG transparente.

## Ajustes de uso (depois da nova imagem)

Como a imagem passa a ser transparente, removo as molduras claras que adicionei nas etapas anteriores — a coruja vai aparecer "flutuando" sobre o fundo, mais elegante:

- **`SplashScreen.tsx`** — tira a caixa branca com borda ciano, deixa só a coruja com drop-shadow ciano.
- **`AppHeader.tsx`** — tira `bg-white/95` e `ring-2`, mantém só o glow externo.
- **`LandingPage.tsx`** (header e footer) — já estão transparentes, só confirmo.
- **`LoginPage.tsx`** e **`AppLock.tsx`** — tiram `bg-background` da img.
- **`ResetPasswordPage.tsx`** — idem.

## Validação

1. Conferir que a imagem gerada realmente tem fundo transparente (alpha=0 nas bordas).
2. Screenshot da splash, da landing e do header — confirmar que a coruja aparece destacada sem caixa.
3. Se a IA não conseguir remover bem o fundo, faço uma segunda tentativa com prompt mais específico (sem regerar do zero — só edição).

## Arquivos afetados

- `src/assets/logo-decode.png` (sobrescrito)
- `public/logo-decode.png` (sobrescrito — mesma imagem)
- `src/components/SplashScreen.tsx`
- `src/components/AppHeader.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/components/AppLock.tsx`

Não mexo em: favicon, ícones PWA (`icon-192/512.png`, `apple-touch-icon.png`) — esses precisam de fundo opaco para o sistema operacional.
