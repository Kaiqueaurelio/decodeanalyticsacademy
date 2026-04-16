

## Plano: Auto-vincular materiais às apostilas por disciplina

### Situação atual
- Apostilas têm um campo `category` (texto, ex: "Arquitetura de Computadores")
- Materiais têm um campo `category_id` (UUID, referência à tabela `categories`)
- A maioria dos materiais **não tem** `category_id` preenchido (null)
- A vinculação manual é feita pela tabela `apostila_materials`

### Estratégia de auto-vinculação

Duas abordagens combinadas:

**1. Por categoria (match exato)**
Quando um material tem `category_id` preenchido, vincular automaticamente a todas as apostilas da mesma categoria.

**2. Por título (match fuzzy)**
Quando um material **não** tem `category_id`, usar correspondência de palavras-chave no título do material vs título/categoria da apostila para sugerir vínculos.

### Implementação

**Arquivo: `src/components/ApostilaMaterialsManager.tsx`**
- Adicionar botão "Auto-vincular" no dialog
- Ao clicar, executar lógica que:
  1. Busca a categoria da apostila atual
  2. Encontra materiais com a mesma `category_id` (ou com título contendo palavras da categoria)
  3. Vincula automaticamente os que ainda não estão vinculados
  4. Mostra toast com quantidade vinculada

**Arquivo: Novo botão no Admin (aba Apostilas)**
- Adicionar botão "Auto-vincular Todos" que percorre todas as apostilas e executa o mesmo processo em lote
- Mostra progresso e resumo final

### Regras de matching
- Match por `category_id`: material.category_id → categories.name === apostila.category
- Match por título: palavras do título do material (>4 chars) presentes no título ou categoria da apostila
- Nunca duplicar vínculos existentes (checar `apostila_materials` antes de inserir)

### O que NÃO muda
- O manager manual continua funcionando normalmente
- Nenhuma tabela ou schema é alterado
- Materiais sem match não são afetados

