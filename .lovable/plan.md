Objetivo: corrigir o ícone do app instalado no celular para usar o logo da coruja que você enviou, tanto no Android quanto no iPhone.

O que identifiquei

- O app já tem `manifest.json`, mas os arquivos `public/icon-192.png` e `public/icon-512.png` ainda não foram substituídos pelo logo correto.
- O `manifest.json` usa `purpose: "any maskable"` combinado, o que pode causar incompatibilidade em alguns launchers.
- O `index.html` aponta `apple-touch-icon` para `/icon-192.png`, mas o ideal é gerar um ícone específico para iOS.
- Existe `public/favicon.ico`, que também pode continuar mostrando um ícone antigo em alguns contextos.

Plano de implementação

1. Usar a imagem enviada como base oficial do app.
2. Gerar os assets corretos para instalação mobile:
  - `public/icon-192.png`
  - `public/icon-512.png`
  - `public/apple-touch-icon.png`
  - opcionalmente um novo `public/favicon.png` ou `favicon.ico`
3. Atualizar `public/manifest.json`:
  - separar entradas `any` e `maskable`
  - manter nome, short_name e cores atuais
  - garantir melhor compatibilidade com Android
4. Atualizar `index.html`:
  - apontar `apple-touch-icon` para o novo arquivo iOS
  - revisar `theme-color` e favicon para evitar conflito visual
5. Remover/substituir o favicon antigo para o navegador não continuar puxando o ícone errado.
6. Validar no preview publicado e orientar que, no celular, pode ser necessário:
  - remover o atalho antigo da tela inicial
  - reinstalar o app para o novo ícone aparecer

Resultado esperado

- Ao instalar o app no celular, o ícone exibido será o logo da coruja enviado.
- Melhor compatibilidade entre Android, iPhone e navegadores diferentes.

Detalhe técnico

- Como estou em modo somente leitura, não posso gerar os arquivos nem substituir os assets agora.
- Na implementação, o trabalho principal será criar versões redimensionadas do logo enviado e trocar os arquivos públicos que o manifest já referencia.
- Se o logo original tiver muito espaço em branco, também posso centralizar e ajustar a arte para ficar melhor em formatos quadrados e maskable.

Verificar que funcionaCorrigir ícone do appAtualizar favicon

Os ícones PWA atuais (`icon-192.png` e `icon-512.png`) não são o logo da coruja que você enviou. Quando o app é instalado no celular, ele mostra ícones genéricos em vez da marca Decode Analytics.

## Plano

1. **Copiar a imagem enviada** para o projeto (`src/assets/` temporariamente)
2. **Gerar os ícones PWA** a partir da imagem da coruja:
  - `public/icon-192.png` (192x192px)
  - `public/icon-512.png` (512x512px)
  - `public/apple-touch-icon.png` (180x180px) para iOS
  - Usar ImageMagick (`nix run nixpkgs#imagemagick`) para redimensionar
3. **Atualizar** `public/manifest.json` para separar `"purpose": "any"` e `"purpose": "maskable"` em entradas distintas (melhor compatibilidade)
4. **Atualizar** `index.html` para incluir `<link rel="apple-touch-icon">` apontando para o ícone 180px (iOS não usa manifest para ícones)

### Detalhe Técnico

- O `purpose: "any maskable"` combinado pode causar problemas em alguns dispositivos; separar em dois entries é a prática recomendada
- iOS Safari ignora o manifest para ícones e usa apenas `<link rel="apple-touch-icon">`