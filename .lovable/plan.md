# Correção: aulas somem no leitor e página nova não aparece

## O que foi verificado no banco

- Nenhuma apostila com conteúdo está marcada como oculta. A única não publicada ("Pesquisa Operacional") está realmente vazia (0 caracteres na apostila e na sua única página).
- O sumiço não vem da visibilidade e sim do **filtro anti-duplicidade do leitor**. Exemplo comprovado em *Sistemas Operacionais Abertos e Mobile*:
  - Página "Aula 2 - Controle de fluxo — 31/08/2026" (100.945 caracteres)
  - Página "Apostila Única — Shell Script Bash Detalhada — 31/08/2026" (88.491 caracteres)
  - Elas não são cópias literais (nenhuma contém a outra), mas compartilham 86,5% dos trechos de 8 palavras. A regra atual considera duplicata a partir de 78% e **descarta silenciosamente a página menor**. Por isso ela existe no banco, aparece na lista da disciplina, mas não abre/aparece no leitor.
- Páginas novas criadas hoje/ontem ("Nova Página — 02/09/2026") estão gravadas com conteúdo vazio. O leitor trata conteúdo vazio como placeholder e remove a aula da árvore, então a página recém-criada não aparece até ter texto — e, se o texto for parecido com outra aula, cai na regra acima e some de novo.
- O salvamento em si funciona: a atualização grava em `apostila_pages` e atualiza a lista local.

## O que será feito

1. **Nunca descartar uma página real** (`src/pages/ApostilaReaderPage.tsx`)
   - Substituir a poda por uma marcação: páginas muito parecidas continuam visíveis, apenas ordenadas com a versão mais completa primeiro e com um selo discreto "versão alternativa".
   - Manter a remoção apenas para cópias idênticas (mesmo texto normalizado), que é o caso real de duplicata.
   - Mesmo tratamento no `flatten`, que hoje também elimina aulas com conteúdo igual sem avisar.

2. **Endurecer o critério de duplicata** (`src/lib/content-formatting.ts`)
   - Só considerar duplicata quando um texto contém o outro com cobertura ≥ 0,98, ou quando a semelhança por trechos for ≥ 0,95 **e** a diferença de tamanho for menor que 5%. Isso impede que uma aula com 88 mil caracteres seja engolida por outra de 100 mil.

3. **Página nova sempre visível** (`src/pages/ApostilaReaderPage.tsx`, `src/lib/apostila-pages.ts`)
   - Páginas sem conteúdo passam a aparecer na árvore como aula vazia ("Sem conteúdo ainda"), em vez de sumirem, para o admin confirmar que a criação funcionou.
   - Após salvar no workbench, recarregar a lista de páginas do banco (não só o estado local), garantindo posição e data corretas.

4. **Diagnóstico para o admin** (`src/components/admin/ApostilaHealthDashboard.tsx`)
   - Listar páginas vazias e páginas quase idênticas, com atalho para abrir e resolver, em vez de escondê-las.

5. **Testes e changelog**
   - Novo caso em `src/test/apostila-reader-merge.test.ts` com o par real de 100.945/88.491 caracteres, garantindo que as duas aulas continuem na árvore.
   - Entrada nova no topo de `src/data/changelog.ts`.

## Observação

As duas "Nova Página — 02/09/2026" existentes estão em branco no banco; após a correção elas aparecerão listadas como vazias para você preencher ou excluir.
