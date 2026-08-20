# Prova técnica da separação da apostila

## Escopo

Esta verificação foi executada novamente após a solicitação de confirmação. A consulta foi feita com a sessão administrativa autenticada e os hashes SHA-256 foram calculados sobre o conteúdo retornado diretamente pelo banco.

## Prova matemática dos conteúdos

| Registro | ID | Caracteres | SHA-256 | Comparação |
|---|---|---:|---|---|
| Apostila principal atual | `b132f212-5ede-4522-92d3-b0ead2cd8ce2` | 52.798 | `ba7a7128d4c33fd21a2833f7a4d980c1d782b834fb893da670d0680154cfa0e0` | Igual à versão limpa histórica |
| Versão limpa histórica | `55b33e2d-3b51-4225-a86e-87166ed1e649` | 52.798 | `ba7a7128d4c33fd21a2833f7a4d980c1d782b834fb893da670d0680154cfa0e0` | Hash idêntico ao campo principal |
| Página nova atual | `812c2375-dc09-460e-a964-1bba36d586ba` | 49.879 | `dc96e1ff2b4a9b7739ba155efd8c44ddf953c3b1946d635a387068ae8dd56e93` | Igual ao snapshot completo do conteúdo novo |
| Snapshot completo do conteúdo novo | `faa8c4ed-1ab0-41f9-94d0-9552240a48a0` | 49.879 | `dc96e1ff2b4a9b7739ba155efd8c44ddf953c3b1946d635a387068ae8dd56e93` | Hash idêntico à página nova |

A igualdade dos hashes e dos tamanhos comprova que os conteúdos foram copiados integralmente, sem truncamento ou edição intermediária. A página nova contém simultaneamente `Programação linear & Métodos Gráficos`, `Dia: 19/08/2026`, `As Equipes do Projeto`, `Parte 2` e `Gerador de Energia`. A apostila principal não contém `19/08/2026`.

## Provas de preservação por backup

| Backup | ID | Caracteres | SHA-256 | Finalidade |
|---|---|---:|---|---|
| Estado anterior da página nova | `3c23668c-bbe6-4b5c-8644-47cd5c073610` | 41.990 | `8adfc261aef99e24c6a592eafc428547ff454c2dc313d30149b10b95e5d32610` | Preserva a página antes de receber o conteúdo completo |
| Estado anterior do campo principal | `57e25e20-f439-4e24-ac77-d061072dbe9f` | 7.886 | `3fd453b9aac3e0158ea881495d7aa56ea70effda86de5d6773b724f551826dfd` | Preserva o bloco que estava misturado antes da restauração |

Os dois backups têm hashes diferentes dos registros atuais, confirmando que o estado anterior foi preservado antes das alterações.

## Prova visual autenticada

| Tela testada | Resultado observado |
|---|---|
| `/reader/b132f212-5ede-4522-92d3-b0ead2cd8ce2` | Mostrou a apostila original e `Excel | Power BI | Pesquisa Operacional`; não mostrou `19/08/2026`, `Parte 2` ou `Gerador de Energia`; não exibiu mensagem de conteúdo vazio. |
| `/reader/b132f212-5ede-4522-92d3-b0ead2cd8ce2?lesson=page%3A812c2375-dc09-460e-a964-1bba36d586ba` | Mostrou `Parte 2 — Continuação (19/08/2026)`, `Programação linear & Métodos Gráficos`, `Dia: 19/08/2026`, `As Equipes do Projeto`, `Parte 2` e `Gerador de Energia`. |
| `/apostila/b132f212-5ede-4522-92d3-b0ead2cd8ce2` | Renderizou a apostila principal e a página adicional, sem mensagem de conteúdo vazio. |

## Prova de testes e versionamento

Foram executados novamente `tsc --noEmit --pretty false`, `vite build`, `vitest run --reporter=dot` e `git diff --check`. A suíte terminou com 11 arquivos de teste aprovados e 63 testes aprovados. O build e o TypeScript terminaram sem falhas.

O commit atual é `a334fc3a98c3f8aeb6830f089cdfbc9874170831`, com a mensagem `docs: preserve full new apostila content`. O SHA local e o SHA de `origin/main` foram comparados e são idênticos. O checkout estava limpo após a verificação.

## Conclusão

A evidência concreta é composta por três confirmações independentes: igualdade criptográfica entre a apostila principal e a versão limpa histórica; igualdade criptográfica entre a página nova e o snapshot completo do conteúdo novo; e validação visual autenticada nos dois modos de leitura. Portanto, o conteúdo novo não foi removido: ele está preservado integralmente na página independente, enquanto a apostila original permanece intacta no campo principal.
