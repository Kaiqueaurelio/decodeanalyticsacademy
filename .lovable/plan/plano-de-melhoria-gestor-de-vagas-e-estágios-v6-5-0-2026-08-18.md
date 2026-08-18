# Plano de Melhoria: Gestor de Vagas e Estágios v6.5.0

Melhorar a experiência de importação e gestão de vagas, corrigindo duplicidades e implementando um fluxo híbrido (Regex + IA) para importação em lote, com uma interface de administração mais detalhada.

## Alterações Propostas

### 1. Correção de Duplicidades no Admin
- Remover o botão duplicado de "Vagas e Estágios" na `AdminPage.tsx` e `config/adminNav.ts`.
- Centralizar a gestão exclusivamente na aba `jobs`.

### 2. Importador MD Híbrido (Regex + Ella AI)
- **Modo Regex (Rápido):** Mantém o suporte a campos estruturados (`Empresa:`, `Link:`, etc.).
- **Modo Ella AI (Inteligente):** Caso o Markdown seja desestruturado, utiliza a inteligência da Ella para extrair os dados da vaga.
- Atualizar `src/lib/jobs-importer.ts` para suportar ambos os fluxos.

### 3. Nova Interface "Lista Detalhada" no Admin
- Substituir os cards compactos no `JobsManager.tsx` por uma visualização em lista.
- Adicionar "Visualização Rápida" da descrição sem precisar abrir o editor.
- Melhorar a responsividade da lista para dispositivos móveis.

### 4. Estabilidade e Transparência
- Atualizar o changelog para a versão **6.5.0**.

## Detalhes Técnicos

- **Frontend:** Atualização dos componentes Shadcn (Table/Accordion) para a lista detalhada.
- **Backend:** Uso da Edge Function `ella-chat` ou similar para o processamento de IA (extração de JSON a partir de texto).
- **Segurança:** Manter as políticas de RLS e validação de `application_link`.

## Perguntas Interativas (Respondidas)
- **Formato:** Híbrido (Regex + IA).
- **Exibição:** Lista Detalhada.
