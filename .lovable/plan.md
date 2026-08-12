# Plano: Padronização Notion Pro em Toda a Experiência de Apostilas (v4.66.0)

Este plano visa unificar a linguagem visual "Notion Pro" em todos os componentes de visualização e edição de apostilas, garantindo consistência em tipografia, blocos, espaçamentos e interações.

## Mudanças

### Frontend (UI/UX)

1. **Refatorar `ApostilaContentRenderer.tsx`**:
    - Padronizar tipografia (títulos, corpo de texto) com pesos e tamanhos idênticos ao Notion.
    - Atualizar `CalloutBlock` com o visual moderno usado nas disciplinas (borda lateral colorida, fundo suave).
    - Ajustar `HeadingBlock` para usar os tamanhos exatos do Notion (H1 = 1.875rem, H2 = 1.5rem, H3 = 1.25rem).
    - Refinar `TableBlock` com visual de grade limpa e cabeçalhos em cinza suave.
    - Padronizar listas (UL/OL) com marcadores customizados e recuos alinhados.
    - Ajustar espaçamentos verticais entre blocos (o "Notion feel" vem do espaçamento generoso, mas controlado).

2. **Sincronizar `NotionBlockEditor.tsx`**:
    - Ajustar os estilos dos blocos no editor para que o que o admin vê durante a edição seja 99% fiel ao que o aluno vê no renderer (WYSIWYG real).
    - Padronizar os callouts, citações e blocos de código no editor.

3. **Refinar `MarkdownEditor.tsx`**:
    - Ajustar os estilos padrão do TipTap para espelhar a tipografia do Notion.
    - Garantir que a "Folha A4" no editor use a mesma largura e padding que o renderer final.

4. **Refinar `NotionTopicAccordion.tsx` e `NotionSubjectDetail.tsx`**:
    - Pequenos ajustes de polimento para garantir que a transição da lista de tópicos para o conteúdo da apostila seja visualmente contínua.

## Detalhes Técnicos

- **Design System**: Uso exclusivo de variáveis CSS (`--foreground`, `--primary`, etc.) e utilitários Tailwind configurados.
- **Tipografia**: Reforçar o uso de `Space Grotesk` para títulos e Inter/Sans para corpo, com `leading-relaxed` (1.625).
- **Componentes**: Manter a lógica de renderização em blocos, apenas atualizando o CSS e a estrutura HTML dos sub-componentes.
- **Compatibilidade**: Garantir que o parser de markdown continue interpretando corretamente as tags HTML inline (como as geradas pelo editor de cores/fontes).

---

Usuário, este plano vai deixar a experiência de leitura e edição 100% fiel ao estilo Notion que você escolheu. Posso prosseguir?
