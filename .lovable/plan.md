## Objetivo
Corrigir os erros que ainda estão travando o app e fazer a ordenação de exercícios do admin funcionar de ponta a ponta, com persistência correta da ordem e regra de dissertativas no final.

## O que vou corrigir

1. Estabilizar o app e o Modo Seguro
- Ajustar o `SafeModeBoundary` para permitir recuperação real quando a página quebra.
- Impedir que o Modo Seguro prenda o usuário em rotas públicas como `/login`.
- Limpar o estado persistido do Modo Seguro ao tentar novamente/recarregar, para evitar loop de tela travada.

2. Corrigir o crash do organizador de exercícios
- Refatorar `src/components/admin/ExerciseOrganizer.tsx` para remover atualização de estado durante render.
- Trocar a sincronização atual de `items` por `useEffect`, mantendo drag-and-drop estável.
- Garantir que a lista sempre reaja corretamente quando `loadAll()` trouxer novos exercícios.

3. Fazer a ordenação funcionar em todos os fluxos do admin
- Padronizar todas as inserções de exercícios em `src/pages/AdminPage.tsx` para salvar:
  - `sort_order`
  - `question_type`
  - `type`
  - `allow_image_upload`
  - `expected_answer` quando aplicável
- Corrigir os fluxos hoje inconsistentes:
  - importação de apostila com exercícios extraídos
  - importação em lote
  - criação individual
  - geração por IA
  - edição de apostila com criação/importação/IA
- Fazer novas questões já entrarem na ordem correta, sem quebrar o drag-and-drop.

4. Garantir exibição e persistência corretas da ordem
- Ordenar os exercícios no carregamento do admin antes de renderizar listagens simples e o organizador.
- Ao salvar no organizador, persistir a ordem final de forma consistente e recarregar os dados refletindo essa ordem.
- Reforçar a regra obrigatória: questões dissertativas sempre no final, inclusive cálculo, grafo e algoritmo.

5. Validar o fluxo do aluno que depende dessa estrutura
- Conferir `ExercisesPage.tsx` para continuar respeitando `sort_order`, `question_type` e `allow_image_upload` após os ajustes.
- Garantir que a correção por imagem continue compatível com as questões reordenadas e tipadas.

## Resultado esperado
- O login e outras rotas públicas não ficam mais presos por Safe Mode residual.
- O admin consegue abrir o organizador sem crash.
- Arrastar e salvar a ordem dos exercícios passa a funcionar.
- Novos exercícios deixam de “quebrar” a ordenação por serem criados sem metadados.
- Dissertativas ficam sempre no fim, inclusive nos fluxos de importação e IA.

## Arquivos envolvidos
- `src/lib/safe-mode.ts`
- `src/components/SafeModeBoundary.tsx`
- `src/components/admin/ExerciseOrganizer.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/ExercisesPage.tsx`

## Detalhes técnicos
- Problema principal do organizador: há `setItems(...)` dentro de `useMemo(...)`, que é efeito colateral em render e pode causar loop/re-render inválido.
- Problema principal da ordenação: vários pontos de criação ainda inserem exercícios sem `sort_order` e sem os novos campos de tipagem, então a base fica heterogênea e o organizador não consegue manter um estado consistente.
- Problema do Safe Mode: o flag persistido em `sessionStorage` continua ativo e a recuperação da boundary não limpa esse estado em rotas onde isso deveria ser seguro.

## Entrega
Vou implementar tudo isso de uma vez, sem mudar a proposta visual geral do sistema, focando em estabilidade e funcionamento correto do admin.