# Plano de Implementação: Player de Áudio Profissional

Implementação de um componente de áudio interativo e robusto para apostilas, seguindo os padrões de design do Decode Analytics Academy.

## Alterações Propostas

### Frontend

- **Novo Componente `ProfessionalAudioPlayer`**: Criar um player de áudio completo em `src/components/ProfessionalAudioPlayer.tsx` com:
  - Controles de Play/Pause, Progresso (seekable), Volume, Mudo e Velocidade (0.75x a 2x).
  - Exibição de tempo atual e total.
  - Persistência de progresso e volume via `localStorage`.
  - Suporte a atalhos de teclado (Espaço, Setas, M, +/-).
  - Responsividade total e temas dark/light.
  - Opcional: Waveform visual simples.

- **Atualização em `ApostilaContentRenderer.tsx`**:
  - Substituir o `AudioBlock` atual (que usa a tag `<audio>` nativa) pelo novo `ProfessionalAudioPlayer`.
  - Garantir que o parser continue identificando blocos de áudio markdown.

- **Contexto de Áudio**:
  - Verificar se o `GlobalAudioPlayer` existente conflita ou se pode ser integrado. O objetivo aqui é um player *embutido* no conteúdo, conforme solicitado.

## Detalhes Técnicos

- **Tecnologias**: React hooks (`useRef`, `useState`, `useEffect`), Tailwind CSS para estilização, Lucide-React para ícones.
- **Acessibilidade**: Labels ARIA completos, navegação por teclado.
- **Persistência**: Chave única no `localStorage` baseada na URL/ID do áudio para salvar `currentTime`.

## Próximos Passos

1. Criar o arquivo `src/components/ProfessionalAudioPlayer.tsx`.
2. Modificar `src/components/ApostilaContentRenderer.tsx` para usar o novo player.
3. Validar a funcionalidade com o áudio existente na apostila de Aspectos Teóricos.
