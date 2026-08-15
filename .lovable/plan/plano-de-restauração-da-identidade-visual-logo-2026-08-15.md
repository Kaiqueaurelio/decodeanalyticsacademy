# Plano de Restauração da Identidade Visual (Logo)

O usuário solicitou a reversão da mudança do logo na Landing Page. O logo atual está usando versões otimizadas (`owl-icon-72.avif`, etc.) que parecem ter substituído a versão anterior preferida pelo usuário (provavelmente o `owl-icon.png` ou `logo-decode.png` com o estilo original).

## Ações Técnicas

1. **Restaurar Logos na Landing Page**:
   - Substituir as importações de logos otimizados (`logoAvif1x`, `logoWebp1x`, etc.) pelo `logoDark` vindo de `@/assets/owl-icon.png`.
   - Substituir os componentes `<picture>` pelo componente `<img>` simples que usa `logoDark`, mantendo os efeitos de `drop-shadow` e classes de estilo.

2. **Padronizar nos componentes relacionados**:
   - Garantir que `src/pages/LandingPage.tsx` use a mesma identidade visual do restante do app (que já utiliza `owl-icon.png`).

3. **Remover Assets não utilizados**:
   - Não removeremos os arquivos agora para evitar quebras, apenas a referência no código.

## Detalhes Técnicos

- Arquivo: `src/pages/LandingPage.tsx`
- Mudança:
  - De: `import logoAvif1x from '@/assets/owl-icon-72.avif';` (...)
  - Para: `import logoDark from '@/assets/owl-icon.png';`
  - De: `<picture>...<img src={logoPng1x} ... /></picture>`
  - Para: `<img src={logoDark} alt="Decode Analytics" width={36} height={36} ... />`
