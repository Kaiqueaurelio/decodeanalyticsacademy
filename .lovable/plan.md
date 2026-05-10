## Problema

O logo da coruja (`src/assets/logo-decode.png`) só está sendo usado em 2 lugares:
- `AppHeader.tsx` (cabeçalho, 36px — fica pequeno demais)
- `SplashScreen.tsx` (tela de carregamento)

As telas principais (Landing, Login, Reset de senha, Tela de Bloqueio) ainda importam o **logo antigo** (`logo-dark.jpeg`) — aquele círculo neon com `</>`, sem coruja. Por isso "a coruja não aparece" nessas páginas.

## O que vou fazer

1. **Substituir o logo em todas as telas** trocando o import `logo-dark.jpeg` → `logo-decode.png` (coruja) em:
   - `src/pages/LandingPage.tsx`
   - `src/pages/LoginPage.tsx`
   - `src/pages/ResetPasswordPage.tsx`
   - `src/components/AppLock.tsx`

2. **Ajustar o estilo** para o logo da coruja aparecer bem (ele tem fundo opaco, então não pode ficar com `object-cover` em moldura pequena que corta a coruja):
   - Trocar `object-cover` por `object-contain` onde necessário
   - Garantir tamanho mínimo legível (≥ 56px nas telas de auth, ≥ 44px no header)

3. **Header (`AppHeader.tsx`)**: aumentar de `h-9 w-9` (36px) para `h-11 w-11` (44px) e remover o `bg-background` que escurece o quadrado, deixando o logo mais nítido.

4. **Não vou mexer** em: SplashScreen (já usa coruja), favicon/PWA icons, Watermark (logo transparente é proposital), nem em qualquer lógica de negócio.

## Arquivos editados

- `src/pages/LandingPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/components/AppLock.tsx`
- `src/components/AppHeader.tsx`

## Validação

Após as mudanças, verifico via screenshot do preview que a coruja aparece em: header, login, landing e splash.
