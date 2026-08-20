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


## Separação realizada

Após identificar o marcador editorial `## **Parte 2 - Continuação**`, foi criado um backup em `apostila_versions` com ID `faa8c4ed-1ab0-41f9-94d0-9552240a48a0` antes de qualquer alteração.

A operação autorizada separou o registro de Pesquisa Operacional sem apagar dados:

| Registro | Resultado |
|---|---|
| `apostilas.content` | Mantidos 7.886 caracteres, encerrando no resumo final da primeira parte. |
| `apostila_pages` | A página existente foi atualizada para `Parte 2 — Continuação (19/08/2026)` com 41.990 caracteres. |
| Conteúdo original | Preservado integralmente no backup antes da separação. |

A atualização foi transacional na prática: se a segunda gravação falhasse, o script restauraria o conteúdo principal original.


## Verificação visual

A rota direta `/apostilas/{id}` na publicação Loveable redirecionou para a landing page, então a verificação visual precisa seguir a navegação interna autenticada. A sessão permanece restaurada no navegador e o botão `Acessar apostilas` está visível na landing page.


## Confirmação visual após a separação

A rota autenticada correta é `/apostila/b132f212-5ede-4522-92d3-b0ead2cd8ce2`. A publicação carregou o conteúdo da apostila e exibiu o índice com a primeira parte terminando no resumo final, seguida pelas seções da continuação. O conteúdo principal agora termina antes do marcador `Parte 2`, enquanto a página salva aparece com o título `Parte 2 — Continuação (19/08/2026)` no armazenamento.

Observação: a tela de detalhes foi projetada para apresentar o conteúdo principal e as páginas adicionais em uma única leitura contínua, com títulos de seção. A verificação do “Modo estudo” ainda será feita para confirmar a separação como lição/página navegável.


## Confirmação final no Modo estudo

No leitor estruturado, a página aparece separadamente na seção `PÁGINAS DA APOSTILA` como `Parte 2 — Continuação (19/08/2026)`. Ao selecioná-la, o cabeçalho muda para `Páginas da apostila · Conteúdo adicional` e o conteúdo começa em `Parte 2 - Continuação`, seguido pelo material do gerador, terceirização, programação linear e demais tópicos da aula de 19/08. A página 1 não é exibida dentro desse bloco.


## Reprodução do erro de criação de página

Na rota administrativa autenticada da apostila `b132f212-5ede-4522-92d3-b0ead2cd8ce2`, o botão `+ PÁGINA` está visível com o hint `Adicionar página persistida (Ctrl+Shift+P)`. O editor mostra o conteúdo principal e a apostila está publicada. O teste de clique será realizado após fechar o anúncio sobreposto.


## Correção do botão Nova Página

A reprodução confirmou que o botão superior `+ PÁGINA`, apesar do título `Adicionar página persistida`, chamava `setAddSectionOpen(true)`. Isso abria o diálogo `Nova Seção`, anexava Markdown ao conteúdo atual e mostrava o toast incorreto `Página criada`, sem inserir uma linha em `apostila_pages`.

O fluxo foi corrigido para salvar alterações pendentes, inserir uma nova linha em `apostila_pages` via `createApostilaPage`, atualizar a lista local, navegar para `?page=<novo-id>&expanded=1` e abrir a página criada. O toast de seção também foi corrigido para dizer que uma seção foi adicionada ao conteúdo.

Validação local: TypeScript, build de produção, 63 testes automatizados e `git diff --check` aprovados.


## Teste da criação de nova página

Na versão local corrigida, autenticada com a sessão de teste, o botão `+ PÁGINA` criou o registro `9cad0f21-06fe-4a43-a10e-b030f1272470`, navegou para `?page=9cad0f21-06fe-4a43-a10e-b030f1272470&expanded=1` e abriu o editor com o título `Nova Página — 20/08/2026`, conteúdo vazio e 0 palavras. O toast confirmou: `Nova página criada. Você já está editando a página nova.`

Após a comprovação, o registro vazio criado exclusivamente para o teste foi removido. A apostila ficou com uma única página real persistida: `Parte 2 — Continuação (19/08/2026)`, com 41.990 caracteres. A página principal permanece no campo principal da apostila.


## Auditoria publicada — nova página

A rota pública autenticada `https://decodeanalyticsacademy.lovable.app/admin/apostilas/b132f212-5ede-4522-92d3-b0ead2cd8ce2` carregou o Workbench da apostila de Pesquisa Operacional com o botão `+ PÁGINA` e o conteúdo de 19/08. Esta evidência foi comparada com a versão local corrigida; a publicação continua sendo tratada separadamente do checkout até a confirmação do SHA servido pelo deployment.


## Reprodução no deployment publicado — causa confirmada

Em `https://decodeanalyticsacademy.lovable.app/admin/apostilas/b132f212-5ede-4522-92d3-b0ead2cd8ce2`, o clique real no botão visível `+ PÁGINA` abriu o modal `Nova Seção`, com o texto `Adicione um novo título dentro do conteúdo Markdown desta apostila` e campos de seção. A URL não mudou e nenhum `?page=<novo-id>` foi criado. Isso confirma que o deployment publicado ainda serve a implementação antiga, enquanto o checkout local já contém a implementação corrigida do commit `28fc8750`.


## Comparação dos chunks publicados

A análise dos chunks JavaScript carregados confirmou: `AdminApostilaWorkbench-BIpX5f3B.js` ainda contém `Nova Seção` e `open-quick-add-section`, mas não contém o toast da implementação nova; `NewApostilaPageButton-D_-MUiDJ.js` contém `apostila_pages`, porém é um componente separado usado no dashboard e não substitui o callback antigo que o Workbench publicado ainda usa. A causa do comportamento em produção é, portanto, deployment/publicação desatualizada do Workbench, além do atalho `Ctrl+Shift+P` ainda apontar para seção interna no checkout.

## Auditoria profunda do fluxo de criação — 20/08/2026

A publicação Lovable ainda servia o Workbench antigo: o botão `+ PÁGINA` abria `Nova Seção`, confirmando que o deployment publicado não continha o commit persistido. No checkout corrigido, a porta 4173 estava ocupada por um servidor antigo; a validação correta foi feita na porta 4175.

Foi encontrado e corrigido um erro adicional introduzido na primeira refatoração: `createPersistedPageRef.current = handleCreatePersistedPage` estava antes da declaração do handler, causando `Cannot access 'Ge' before initialization` no bundle. A atribuição foi movida para depois do handler.

Na versão local recompilada e autenticada, o clique em `+ PÁGINA` criou o ID `2f1df076-a55f-4af8-8f74-a71a6872ed02`, mudou a URL para `?page=2f1df076-a55f-4af8-8f74-a71a6872ed02&expanded=1`, mostrou `Nova página criada` e abriu um editor com 0 palavras. A lista exibiu separadamente `Página principal`, `Parte 2 — Continuação (19/08/2026)` e `Nova Página — 20/08/2026`. A busca por `Programação linear` não encontrou texto na nova página, confirmando que o conteúdo dos outros dias não foi carregado nela.

O primeiro teste na porta 4173 não representa o código atual: essa porta já estava ocupada pelo processo 9029 e servia o bundle antigo, enquanto o Vite corrigido subiu em 4175.


## Auditoria profunda do fluxo de criação — validação final

Na versão local recompilada em `http://localhost:4175`, o botão `+ PÁGINA` criou o registro `17b22df1-a514-491d-9994-143704b5e8a2` e navegou para `?page=17b22df1-a514-491d-9994-143704b5e8a2&expanded=1`. A nova página abriu com 0 palavras. A inspeção controlada do DOM confirmou `hasMainText=false` e `hasContinuationText=false`.

A consulta autenticada dos registros temporários encontrou somente dois IDs criados durante os testes: `17b22df1-a514-491d-9994-143704b5e8a2`, vazio, e `2f1df076-a55f-4af8-8f74-a71a6872ed02`, contendo apenas `ISOLAMENTO_TESTE_2026_PAGE_NEW`. Ambos devem ser removidos após a validação. As páginas reais da apostila permanecem preservadas.


A limpeza pós-teste foi concluída com sucesso: os registros `17b22df1-a514-491d-9994-143704b5e8a2` e `2f1df076-a55f-4af8-8f74-a71a6872ed02` foram removidos; ambos haviam sido criados exclusivamente para validar criação, navegação e isolamento. A página principal e a página real `Parte 2 — Continuação (19/08/2026)` não foram alteradas.


Teste ponta a ponta adicional: em 20/08/2026, o botão `+ PÁGINA` criou e abriu a página `a65b7259-f538-46d2-bcd9-1761193fb68b`, com título `Nova Página — 20/08/2026`, 0 palavras e rota `?page=a65b7259-f538-46d2-bcd9-1761193fb68b&expanded=1`. Um marcador controlado `TESTE_APOSTILA_2026_08_20_ISOLAMENTO` foi inserido exclusivamente nesse editor para validar persistência e isolamento.


## Teste ponta a ponta adicional — 20/08/2026

A nova página de teste foi criada com o ID `a65b7259-f538-46d2-bcd9-1761193fb68b`, abriu pela URL `?page=a65b7259-f538-46d2-bcd9-1761193fb68b&expanded=1`, recebeu o marcador `TESTE_APOSTILA_2026_08_20_ISOLAMENTO`, e o marcador permaneceu após recarregar a rota.

Ao abrir a página real `Parte 2 — Continuação (19/08/2026)`, a busca pelo marcador não encontrou texto, confirmando isolamento da nova página em relação à Parte 2. Ao voltar à nova página, o marcador continuou presente.

Ao abrir a página principal, o conteúdo exibido começa por `Programação linear & Métodos Gráficos` e `Dia: 19/08/2026`, confirmando que o registro principal ainda contém material de 19/08. Portanto, a criação e o autosave da nova página estão isolados, mas a separação editorial do conteúdo histórico precisa ser revisada antes de afirmar que a apostila inteira está totalmente separada.


### Resultado final do teste ponta a ponta

O registro temporário `a65b7259-f538-46d2-bcd9-1761193fb68b` foi encontrado com título `Nova Página — 20/08/2026`, conteúdo de 41 caracteres e data de criação `2026-08-20T03:17:19.740004+00:00`. O teste confirmou criação, navegação para o novo ID, autosave, recarga e isolamento: o marcador não apareceu na Parte 2 de 19/08 nem na página principal, e retornou ao voltar para a nova página. Após a validação, o registro foi removido com DELETE autenticado, status 200, e a consulta posterior retornou `after: []`. Nenhuma página real foi removida.


## Verificação atual da movimentação — 20/08/2026

Consulta autenticada somente leitura ao projeto `gynguskgysompgcajunc`:

| Registro | Resultado atual |
|---|---|
| `apostilas.content` | 7.886 caracteres; contém `Programação linear`, `Dia: 19/08/2026` e `As Equipes do Projeto`. Não contém `Parte 2` nem `O Gerador de Energia`. |
| `apostila_pages` | 1 página real: `Parte 2 — Continuação (19/08/2026)`, ID `812c2375-dc09-460e-a964-1bba36d586ba`, 41.990 caracteres. Contém `Parte 2`, `O Gerador de Energia` e `Programação linear`, mas não contém `As Equipes do Projeto` nem o marcador exato `Dia: 19/08/2026`. |

Conclusão técnica: a Parte 2 foi movida para uma página persistida separada, mas o conteúdo principal ainda contém um bloco de 19/08 (`Programação linear`, `Dia: 19/08/2026`, `As Equipes do Projeto`). Portanto, a movimentação foi parcial em relação à expectativa de deixar a página principal somente com a página anterior; ainda não é possível afirmar que a apostila está totalmente limpa de conteúdo de 19/08.


## Verificação visual no Modo estudo — 20/08/2026

O leitor local carregou a apostila e mostrou no menu lateral `Páginas da apostila > Conteúdo adicional` separadamente da seção `Introdução e Resumo`. A página atualmente selecionada é `Visão geral`, cujo conteúdo é uma apostila geral de Excel, Power BI, Pesquisa Operacional e Gestão de Projetos. A separação estrutural existe no leitor, mas a confirmação da Parte 2 exige selecionar `Conteúdo adicional`; o conteúdo principal exibido no leitor não é o bloco `Parte 2`.


### Confirmação visual da página movida

No Modo estudo, `Conteúdo adicional` aparece separado da seção `Introdução`. Ao selecionar `Parte 2 — Continuação (19/08/2026)`, o cabeçalho mudou para `Páginas da apostila · Conteúdo adicional` e o conteúdo iniciou por `Parte 2 - Continuação`, seguido de `O Gerador de Energia e Redundância de Sistemas`. Isso confirma que a página movida existe e abre no lugar correto como página independente.

A consulta anterior e a leitura da página principal, contudo, mostram que o conteúdo principal ainda contém `Programação linear`, `Dia: 19/08/2026` e `As Equipes do Projeto`. Portanto, a Parte 2 foi movida corretamente, mas a remoção completa de todos os blocos de 19/08 do conteúdo principal ainda não foi concluída.


## Auditoria histórica para separação exata — 20/08/2026

A consulta autenticada retornou 87 versões da apostila `b132f212-5ede-4522-92d3-b0ead2cd8ce2`.

A última versão limpa identificável antes do conteúdo de 19/08 é `55b33e2d-3b51-4225-a86e-87166ed1e649`, criada em 07/08/2026 às 04:30:56 UTC, com 52.798 caracteres e sem os marcadores `19/08/2026`, `Parte 2` ou `Gerador de Energia`. A versão anterior do mesmo momento tinha 57.577 caracteres e parece ser um snapshot intermediário; a versão de 52.798 é a última versão estabilizada antes da substituição.

A primeira versão nova surgiu em 19/08/2026 às 22:48:59 UTC com 7.374 caracteres e começando por `Programação linear & Métodos Gráficos`. A primeira versão que contém o bloco de continuação e `Gerador de Energia` é `...` no índice histórico 33, às 23:00:39 UTC, com 17.366 caracteres. O conteúdo cresceu por autosaves até a versão `cd01b174-4702-46c4-b63c-fed82eff0d84`, criada em 20/08/2026 às 00:11:37 UTC, com 49.759 caracteres.

Comparação dos registros atuais: `apostilas.content` tem 7.886 caracteres, começa por `Programação linear & Métodos Gráficos` e contém `Dia: 19/08/2026`; a página `812c2375-dc09-460e-a964-1bba36d586ba` tem 41.990 caracteres, começa por `Parte 2 — Continuação` e contém `Gerador de Energia`, sem o marcador de data explícito. A página salva está corretamente separada, mas o conteúdo principal atual ainda é o bloco inicial de 19/08.

O RPC `get_apostila_reader_tree` atualmente retorna lições estruturadas sem conteúdo (`length: 0`), portanto a restauração deve usar a versão histórica limpa de 52.798 caracteres, não o RPC vazio. Nenhuma alteração de dados foi executada nesta auditoria.


## Restauração histórica definitiva — 20/08/2026

A separação foi concluída com base no histórico autenticado, sem reconstrução manual e sem truncamento aproximado. Antes da alteração, o conteúdo atual de `apostilas.content` foi preservado integralmente em `apostila_versions` no registro `57e25e20-f439-4e24-ac77-d061072dbe9f`, com 7.886 caracteres. A restauração só prosseguiu depois de confirmar que o estado anterior tinha exatamente 7.886 caracteres, que a versão limpa escolhida existia e que a página real de 19/08 correspondia ao ID e ao título esperados.

A versão restaurada foi `55b33e2d-3b51-4225-a86e-87166ed1e649`, criada em 07/08/2026 às 04:30:56 UTC, com 52.798 caracteres. O conteúdo foi copiado integralmente para `apostilas.content`; ele começa por `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais`, seguido de `Excel | Power BI | Pesquisa Operacional`, e não contém o marcador `19/08/2026`. A operação foi confirmada por igualdade exata entre o conteúdo salvo e o conteúdo da versão histórica.

| Registro validado | Estado após a restauração |
|---|---|
| `apostilas.content` | 52.798 caracteres, versão limpa de 07/08/2026, sem `19/08/2026` |
| Backup pré-restauração | ID `57e25e20-f439-4e24-ac77-d061072dbe9f`, 7.886 caracteres, conteúdo anterior preservado |
| Página `apostila_pages` | ID `812c2375-dc09-460e-a964-1bba36d586ba`, título `Parte 2 — Continuação (19/08/2026)`, 41.990 caracteres |
| Integridade da página separada | Conteúdo, título e associação à apostila permaneceram exatamente iguais antes e depois da restauração |

## Validação visual final após a restauração

No Modo estudo local autenticado, a entrada principal carregou o título original e o cabeçalho `Excel | Power BI | Pesquisa Operacional`, sem exibir `19/08/2026` e sem mensagem de conteúdo vazio. Ao selecionar explicitamente `page:812c2375-dc09-460e-a964-1bba36d586ba`, o leitor exibiu `Páginas da apostila · Conteúdo adicional`, o título `Parte 2 — Continuação (19/08/2026)` e o conteúdo iniciado por `Parte 2 - Continuação` e `O Gerador de Energia e Redundância de Sistemas`. Na página de detalhes `/apostila/b132f212-5ede-4522-92d3-b0ead2cd8ce2`, o conteúdo principal e a página adicional foram renderizados, sem estado em branco.

## Gates técnicos finais

Foram executados no checkout corrigido `tsc --noEmit --pretty false`, `vite build` e `vitest run --reporter=dot`. Os três comandos foram concluídos com sucesso; a suíte terminou com 11 arquivos de teste aprovados e 63 testes aprovados. Os avisos de `act(...)` e depreciação `punycode` já existentes não causaram falhas. A restauração de dados foi feita separadamente do código, e os artefatos temporários de depuração foram removidos antes do commit.

Conclusão final: o campo principal foi restaurado para a versão histórica limpa com igualdade exata, enquanto o conteúdo novo de 19/08 permanece preservado na página persistida independente. A evidência anterior que registrava 7.886 caracteres no campo principal fica supersedida por esta seção final.


## Correção solicitada pelo usuário — conteúdo novo preservado na página — 20/08/2026

A interpretação anterior estava incompleta: restaurar a apostila principal para a versão limpa não era suficiente, porque os textos novos de 19/08 precisavam continuar disponíveis na página nova. A operação foi corrigida sem apagar esses textos.

A fonte exata foi o snapshot histórico `faa8c4ed-1ab0-41f9-94d0-9552240a48a0`, criado em 20/08/2026 às 00:42:37 UTC, com 49.879 caracteres. Esse snapshot contém, no mesmo bloco novo, `Programação linear & Métodos Gráficos`, `Dia: 19/08/2026`, `As Equipes do Projeto`, `Parte 2` e `O Gerador de Energia`. Ele foi copiado integralmente para a página persistida `812c2375-dc09-460e-a964-1bba36d586ba`.

| Verificação | Resultado |
|---|---|
| Conteúdo da página antes da correção | 41.990 caracteres; começava em `Parte 2 - Continuação`, portanto faltava o bloco inicial de 19/08 |
| Backup antes da atualização | `apostila_versions` ID `3c23668c-bbe6-4b5c-8644-47cd5c073610`, preservando exatamente os 41.990 caracteres anteriores |
| Conteúdo da página depois da correção | 49.879 caracteres, igualdade exata com o snapshot histórico completo |
| Conteúdo novo preservado | Sim: a página agora contém o bloco inicial, `Parte 2` e o gerador de energia |
| Apostila principal | Permanece com 52.798 caracteres e igualdade exata com a versão limpa `55b33e2d-3b51-4225-a86e-87166ed1e649`; não contém `19/08/2026` |

## Validação final da correção solicitada

No Modo estudo, a entrada principal continuou exibindo a apostila original, sem o bloco de 19/08. Ao selecionar `Parte 2 — Continuação (19/08/2026)`, a página nova passou a começar por `Programação linear & Métodos Gráficos`, mostrar `Dia: 19/08/2026` e `1. As Equipes do Projeto`, e conter também `Parte 2` e `O Gerador de Energia`. Na página de detalhes, a página adicional foi renderizada junto ao conteúdo principal, sem estado vazio.

Conclusão corrigida: nenhum texto novo foi removido. A apostila original está preservada no campo principal, e o conteúdo completo que havia sido colocado nela foi transferido para a página independente, com backup do estado anterior e igualdade exata com o histórico.
