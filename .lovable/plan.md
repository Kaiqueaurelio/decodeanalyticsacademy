# Apostila de hoje (Sistemas Operacionais Abertos e Mobile) não aparece

## O que foi verificado no banco

A apostila "Sistemas Operacionais Abertos e Mobile" (semestre 6, publicada, status liberada) tem hoje duas páginas com o mesmo título:

- "Aula 2 - Controle de fluxo — 31/08/2026" — salva às 22:40, 54.586 caracteres
- "Aula 2 - Controle de fluxo 31/08/2026" — salva às 00:15 (versão ampliada), 100.945 caracteres

Além delas há uma "Nova Página — 31/08/2026" vazia (0 caractere), criada às 22:08.

O trecho inicial da página menor aparece dentro da página maior, ou seja, as duas são consideradas conteúdo duplicado pelo leitor.

## Causa

No leitor (`src/pages/ApostilaReaderPage.tsx`), a função `mergePagesIntoTree` percorre as páginas em ordem de posição e, ao encontrar uma página parecida com outra já aceita, simplesmente descarta a página nova (`return false`), sem comparar tamanhos. Como a versão de 54k entra primeiro (posição 5), a versão completa de 100k salva hoje (posição 6) é descartada — o aluno continua vendo a versão antiga e a aula de hoje "some".

O mesmo arquivo já possui a lógica correta em `mergeDistinctPages` (`src/lib/content-formatting.ts`), que substitui a duplicata pela versão mais longa.

## Correção proposta

1. **Leitor: manter sempre a versão mais completa**
   - Em `mergePagesIntoTree`, trocar o descarte simples por comparação de tamanho: quando a página nova for duplicata de uma já aceita, manter a que tiver mais conteúdo (reaproveitando a lógica de `mergeDistinctPages`).
   - Aplicar a mesma regra na poda de aulas estruturadas, para que uma aula curta do RPC não prevaleça sobre a página salva completa.
   - Ignorar páginas totalmente vazias no menu (a "Nova Página" em branco).

2. **Limpeza de dados desta apostila**
   - Remover a página vazia "Nova Página — 31/08/2026".
   - Consolidar as duas versões da "Aula 2 - Controle de fluxo": manter a de 100.945 caracteres e remover a de 54.586 (superada), reordenando as posições.

3. **Regressão**
   - Teste cobrindo: duas páginas duplicadas com tamanhos diferentes → o leitor mostra apenas a maior; página vazia não vira item de menu.
   - Validar no navegador como aluno que a aula de 31/08/2026 abre com o conteúdo completo e sem item duplicado.

## Resultado esperado

A aula de hoje aparece no sumário com o conteúdo completo salvo, sem duplicatas nem páginas em branco, e futuras reedições ampliadas passam a substituir a versão anterior em vez de serem escondidas.
