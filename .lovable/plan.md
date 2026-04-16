

## Plano: Integrar materiais vinculados como conteúdo nativo da apostila

### Objetivo
Ao invés de exibir os materiais vinculados numa seção separada "Material de Apoio" com cards, eles serão renderizados **inline no conteúdo da apostila**, como se fossem seções naturais dela — PDFs embutidos, vídeos, imagens, áudios etc., tudo fluindo junto com o texto.

### O que muda

**Arquivo: `src/components/ApostilaMaterials.tsx`**
- Remover a apresentação em grid de cards com ícones e badges de tipo
- Renderizar cada material diretamente no fluxo de leitura:
  - **PDF/Office** → iframe embutido com visualizador, título como heading
  - **Imagem/GIF** → imagem renderizada inline com legenda
  - **Vídeo** → player embutido ou link para o video player interno
  - **Áudio** → player inline (já existe o `InlineAudioPlayer`)
  - **Link** → card discreto com botão "Acessar"
- Remover o header "Material de Apoio" com ícone de clipe
- Cada material aparece como uma seção com título (h3) e conteúdo renderizado diretamente

**Arquivo: `src/pages/ApostilaPage.tsx`**
- Nenhuma mudança necessária — o componente `ApostilaMaterials` já está posicionado após as seções de conteúdo

### Resultado visual
Os materiais vinculados aparecerão como continuação natural do conteúdo da apostila, com títulos no mesmo estilo das seções existentes e o conteúdo embutido diretamente na página — sem cards, sem badges de tipo, sem separação visual como "seção de materiais".

### Detalhes técnicos
- O componente `ApostilaMaterials` será refatorado para renderizar cada material inline
- PDFs e Office usarão iframe (Google Docs viewer para Office)
- Vídeos terão tag `<video>` nativa ou navegação para `/video/:id`
- O botão de tela cheia será mantido para PDFs e Office
- Signed URLs continuam sendo geradas normalmente

