# Verificação pública — 20/08/2026

Fonte: https://decodeanalyticsacademy.lovable.app/

A primeira navegação exibiu um intersticial de atualização informando que o navegador mantinha uma versão antiga em cache. Após a atualização automática/recarga, a página pública carregou a landing atual com os recursos Apostilas, Exercícios, Flashcards, Simulados, Progresso e Calendário. A página oferece os controles `ENTRAR`, `COMEÇAR A ESTUDAR` e `Acessar apostilas`.

Conclusão desta etapa: a plataforma pública está acessível, mas ainda existe um fluxo de detecção de cache antigo no primeiro carregamento. A verificação das páginas internas das apostilas exige autenticação e ainda não foi concluída nesta etapa.

Screenshot inicial: /home/ubuntu/screenshots/decodeanalyticsacade_2026-08-20_00-18-41_8685.webp
Screenshot após atualização: /home/ubuntu/screenshots/decodeanalyticsacade_2026-08-20_00-18-55_7098.webp

A consulta anônima ao REST do Supabase retornou zero linhas para `apostila_pages` e `apostilas`, compatível com RLS bloqueando leitura anônima; portanto, não foi usada como evidência de que não existam páginas no banco.


## Sessão autenticada

Ao abrir a rota de login, a aplicação redirecionou para `/admin` durante a validação, indicando que a sessão persistida já estava autenticada como administrador. O painel mostrou 52 apostilas, 299 exercícios e a categoria `Pesquisa Operacional` com uma apostila publicada no 6º semestre. Também apareceu um modal de publicidade que precisa ser fechado antes da inspeção visual do acervo.


## Acervo de Pesquisa Operacional

No painel admin, o grupo `Pesquisa Operacional` contém uma única apostila publicada: `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais`, identificada pela rota `/admin/apostilas/b132f212-5ede-4522-92d3-b0ead2cd8ce2`. O cartão também oferece `NOVA PÁGINA`, portanto esta é a apostila correta para comparar a página principal e as páginas salvas.


## Evidência visual da pré-visualização

A pré-visualização administrativa da apostila `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais` mostra `106 seções`, `6803 palavras` no cabeçalho e `5.950 palavras` no editor. O sumário começa com `Programação linear & Métodos Gráficos` e `Dia: 19/08/2026`, seguido de seções como `As Equipes do Projeto`, `Os Gerentes`, `O Que é Pesquisa Operacional?`, `Parte 2 - Continuação` e `O Gerador de Energia e Redundância de Sistemas`.

Também foi observado que alguns títulos aparecem com numeração e markup residual no sumário, por exemplo `1\\. As Equipes do Projeto` e `<u>6. O Exemplo Político - Análise de Dados em Campanha</u>`. Isso confirma que a apostila atual tem conteúdo de edição recente incorporado no documento principal, mas ainda é necessário separar a origem entre `apostilas.content`, `apostila_lessons` e `apostila_pages` antes de alterar dados.

A pré-visualização foi aberta dentro da rota autenticada `/admin/apostilas/b132f212-5ede-4522-92d3-b0ead2cd8ce2` em https://decodeanalyticsacademy.lovable.app/.


## Diagnóstico técnico parcial

O `AdminApostilaWorkbench` mantém `apostilas.content` e `apostila_pages.content` em estados separados. Quando a URL contém `?page=...`, o editor carrega a página salva e o autosave atualiza apenas `apostila_pages`, com filtro simultâneo por `id` e `apostila_id`. Sem `?page`, o autosave atualiza somente `apostilas.content`.

A rota do leitor estruturado consulta `get_apostila_reader_tree` e depois anexa páginas salvas do mesmo `apostila_id`. A deduplicação atual compara o texto normalizado por igualdade exata; a página de detalhes, porém, anexa qualquer página cujo conteúdo não seja um trecho de pelo menos 120 caracteres contido no conteúdo principal.

A leitura REST anônima não é válida para auditar os dados porque a RLS retorna 401/zero linhas sem sessão. A sessão persistida do administrador está ativa no navegador e o bundle público contém apenas a chave anon do Supabase; a próxima etapa será consultar metadados e prévias dos registros reais em modo somente leitura.


## Evidência decisiva no banco

Consulta somente leitura realizada com a sessão autenticada para `apostila_id = b132f212-5ede-4522-92d3-b0ead2cd8ce2`:

| Fonte | Resultado |
|---|---|
| `apostila_pages` | 1 registro, título `Introdução e Resumo`, posição 1, criado em 15/08/2026, conteúdo com apenas 111 caracteres: `Conteúdo em processamento para Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais.` |
| `apostilas.content` | 49.879 caracteres, atualizado em 06/08/2026, começando por `# **Programação linear & Métodos Gráficos**` e `### **Dia: 19/08/2026**`, seguido de todo o conteúdo que aparece no editor e na pré-visualização. |

Conclusão: o conteúdo atribuído pelo usuário como “página salva hoje” **não está em `apostila_pages`**; ele está armazenado dentro de `apostilas.content`. A página persistida separada permanece apenas como placeholder. Portanto, a mistura já está gravada no conteúdo principal, e a deduplicação da interface não consegue separar com segurança essa parte sem recuperar uma versão anterior ou uma delimitação editorial confiável.


## Histórico de versões

O histórico `apostila_versions` contém **86 versões**. A primeira versão disponível, de 07/08/2026, tinha 57.577 caracteres e começava com a apresentação antiga (`Excel | Power BI | Pesquisa Operacional`), sem a data `19/08/2026`. Em 19/08/2026 aparece uma versão vazia e, logo depois, versões de 7.374 e 7.811 caracteres que começam com `Programação linear & Métodos Gráficos`.

Isso indica que houve uma troca do conteúdo principal da apostila no editor em 19/08, seguida por vários autosaves. É necessário resumir o restante do histórico para localizar quando o texto cresceu para aproximadamente 49 mil caracteres e verificar se o crescimento foi um append indevido ou uma recuperação automática local.


## Auditoria do acervo completo

A consulta autenticada encontrou **52 apostilas** e páginas persistidas em grande parte do acervo. A maioria das páginas tem conteúdo real e uma página associada; `Pesquisa Operacional` e `Metodos de Pesquisa` são exceções observadas com uma página cujo texto ainda é placeholder. A resposta completa foi compactada pelo navegador, então a próxima consulta filtrará apenas registros suspeitos com data recente, múltiplas páginas, ou conteúdo de página que possa aparecer duplicado no campo principal.


## Duplicações encontradas no acervo

A comparação normalizada encontrou **40 candidatos** em que o conteúdo da página persistida já aparece integralmente dentro do conteúdo principal da mesma apostila. Exemplos confirmados: `APOSTILA BUSCA HEURÍSTICA 22/04/26` (14.128 caracteres), `Do zero ao Multiplayer unity` (178.796), `Busca A estrela 29/04/26` (44.020), `Preparo para a APS` (41.297), `resumo NP2 Autômatos` (24.920), `NP2 Teoria dos Grafos` (16.144), `Processamento de Imagem e Visao Computacional` (276.215) e `Fundamentos de Processamento de Imagens Digitais` (40.485). Em todos esses exemplos, a página se chama `Introdução e Resumo` e tem o mesmo tamanho do conteúdo principal ou é um trecho completo dele.

Esse padrão parece ser histórico do acervo: muitas apostilas foram criadas com uma página inicial persistida contendo o mesmo material que também foi colocado em `apostilas.content`. Já a apostila de Pesquisa Operacional tem uma página placeholder, enquanto o conteúdo de 19/08/2026 está somente no campo principal.
