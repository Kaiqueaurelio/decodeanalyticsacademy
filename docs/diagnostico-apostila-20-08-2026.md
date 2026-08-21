# Diagnóstico da apostila de 20/08/2026

A sessão autenticada com o aluno `G802144` foi validada no ambiente local. A navegação para `/aula-do-dia?date=2026-08-20` encontrou e abriu a apostila **Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais**, no leitor estruturado, com a página correspondente. Portanto, o registro existe e a consulta da rota diária consegue localizá-lo.

A navegação para `/dashboard` também carregou a sessão e mostrou a mesma apostila como item de continuidade, mas a grade “Minhas Disciplinas” exibida no conteúdo extraído começou por outra disciplina e não tornou a aula de ontem identificável. A hipótese principal é que a listagem usa um recorte/agrupamento por disciplina e apenas a página mais recente, ou que a data está sendo consultada sem levar em conta páginas internas adicionais.

O endpoint público anônimo retornou arrays vazios para `apostilas` e `apostila_pages`, o que é compatível com políticas RLS que exigem sessão; não foi tratado como ausência de dados. O diagnóstico autenticado mostrou que a falha é de visibilidade/seleção no Dashboard ou na listagem, não de inexistência da aula.

## Evidência adicional do Admin

Na aba administrativa, o grupo **Processamento de Imagem e Visao Computacional** contém duas apostilas publicadas: **Fundamentos de Processamento de Imagens Digitais**, salva em 21/08/2026, e **Processamento de Imagem e Visao Computacional**, salva em 15/08/2026. Ambas aparecem com dois exercícios.

O Dashboard agrupa cards pela categoria e os mini-cards exibem somente o título, sem a data. A rota da disciplina usa a mesma categoria normalizada para carregar os registros. Isso confirma que a apostila está publicada e cadastrada, mas a experiência de descoberta do aluno está deficiente; a correção deve expor cada caderno com data no Dashboard e manter o agrupamento por disciplina.

## Reprodução da falha no Dashboard

A página `/materia/Processamento de Imagem e Visao Computacional` carregou corretamente e exibiu os dois materiais:

- **Processamento de Imagem e Visao Computacional** — Aula: 15/08/2026.
- **Fundamentos de Processamento de Imagens Digitais** — Aula: 21/08/2026.

No Dashboard, a busca global `Buscar apostila ou disciplina` não encontrou o título **Fundamentos de Processamento de Imagens Digitais**. O campo da seção **Minhas Disciplinas** usa outra busca (`Buscar disciplina ou apostila`) e o componente `SubjectFolderGrid` limita inicialmente a renderização a 12 grupos (`visibleGroups = 12`), o que pode ocultar a disciplina até rolagem e torna a localização pouco confiável.

## Validação após a correção

No Dashboard local, a URL `/dashboard?search=Fundamentos%20de%20Processamento%20de%20Imagens%20Digitais` agora filtra a grade e mostra:

> Fundamentos de Processamento de Imagens Digitais — Aula: 21/08/2026

A busca foi encontrada no DOM autenticado e a disciplina exibida foi **Processamento de Imagem e Visao Computacional**. A correção elimina a limitação dos 12 grupos iniciais quando existe termo de busca, adiciona data nos mini-cards e faz a busca global encaminhar para a grade filtrada quando não houver abertura direta.

## Evidência do leitor

A rota `/reader/244d7b3f-f4eb-492c-8e12-12c87b8f6e17?lesson=5089d90c-4f3f-4624-9014-b655136ec3f1` abriu **Fundamentos de Processamento de Imagens Digitais** com a página `Introdução e Resumo`. Isso confirma que o material existe e é acessível na sessão autenticada.

A listagem da disciplina passou a mostrar múltiplas entradas por data, mas os registros observados foram 15/08/2026 e 21/08/2026; a rota diária anterior havia localizado a aula de 20/08/2026 em outro registro de página/estrutura. A causa funcional confirmada é que o código antigo reduzia todas as páginas de uma apostila à data mais recente, ocultando aulas anteriores.

## Validação final da rota diária

Após a correção, `/aula-do-dia?date=2026-08-20` redirecionou para:

`/reader/b132f212-5ede-4522-92d3-b0ead2cd8ce2?lesson=page%3A812c2375-dc09-460e-a964-1bba36d586ba`

O leitor exibiu **Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais**, com o seletor em **20/08/2026** e o texto **Aula: 20/08/2026**. Antes, a rota enviava o UUID cru e o leitor esperava `page:<id>`, por isso a seleção podia cair na primeira aula. A abertura direta da aula de ontem agora está funcionando.
