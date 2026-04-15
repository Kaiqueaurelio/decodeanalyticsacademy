

## Plano: Exercícios completos nos 2 dialogs (Exercícios da apostila + Editar apostila)

### O que muda

Os dois dialogs que você mostrou nas screenshots ganham funcionalidades completas de gestão de exercícios:

**1. Dialog "Exercícios — [Apostila]"** (abre ao clicar no ícone de caneta na lista de apostilas)
- Mantém a lista de exercícios existentes + formulário manual individual
- Adiciona toggle de 3 modos: **Individual** | **Importar em Lote** | **Gerar com IA**
- **Importar em Lote**: campo de texto para colar exercícios no formato (pergunta, A-D, gabarito, explicação)
- **Gerar com IA**: botão que envia o conteúdo da apostila para uma edge function, gera 8-10 exercícios, mostra preview editável antes de salvar

**2. Dialog "Editar Apostila"** (abre ao clicar no ícone de edição)
- Mantém campos de título, categoria e conteúdo
- Adiciona seção abaixo com os mesmos 3 modos de exercícios (Individual, Lote, IA)
- Lista os exercícios existentes da apostila com opção de excluir

### Detalhes técnicos

**Nova Edge Function: `generate-exercises/index.ts`**
- Recebe `{ content, title, count? }` 
- Usa Lovable AI (gemini-3-flash-preview) via tool calling para retornar exercícios estruturados
- Retorna array de `{ question, options, correct_answer, explanation }`

**Mudanças em `AdminPage.tsx`**
- Refatorar o dialog de exercícios (linhas 1127-1184) para incluir 3 abas: Individual, Lote, IA
- Adicionar seção de exercícios no dialog de edição (linhas 1186-1197)
- Novo estado `aiGenerating` e `aiExercises` para preview dos exercícios gerados
- Reutilizar `parseBulkExercises` e `handleBulkExerciseImport` já existentes

**Fluxo "Gerar com IA":**
1. Clica "Gerar Exercícios" → loading spinner
2. Edge function retorna exercícios → preview na tela
3. Pode remover exercícios individuais do preview
4. Clica "Salvar Todos" → insere no banco

