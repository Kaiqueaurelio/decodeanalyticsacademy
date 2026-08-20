# Auditoria integral — Decode Analytics Academy

## Fonte de verdade

O checkout auditado é `/home/ubuntu/decodeanalyticsacademy-correct`, branch `main`, remoto `https://github.com/Kaiqueaurelio/decodeanalyticsacademy.git`. No início da auditoria, o checkout estava sincronizado com `origin/main` no commit `a2f267ca` (`feat: add apostila chronology diagnostics and regression tests`). O stack local é React/Vite/TypeScript com Supabase, Edge Functions, RLS e Vitest.

## Escopo

A auditoria cobre autenticação e rate limiting, autorização/RLS/RPCs, exposição de gabaritos, Edge Functions, Workbench e separação cronológica, gamificação, Ella, oportunidades, navegação, acessibilidade, responsividade, performance, cache/service worker, observabilidade, branding e testes.

## Achados iniciais confirmados por leitura estática

### Crítico — migração final de gabaritos com contrato incompatível

A migração `20260819210000_harden_exercise_answer_rpc.sql` define `check_exercise_answer(uuid,text)` com retorno `json`. A migração posterior `20260820060000_security_audit_and_login_rate_limit.sql` tenta substituir a mesma função com retorno `jsonb` sem executar `DROP FUNCTION` antes. PostgreSQL não permite `CREATE OR REPLACE FUNCTION` alterar o tipo de retorno. A aplicação dessa cadeia pode falhar nesse ponto.

### Crítico — RPC final ainda referencia colunas removidas

As migrações `20260818200000_secure_exercises_rls.sql` e `20260819210000_harden_exercise_answer_rpc.sql` movem `correct_answer`, `explanation` e `reference_answer` para `public.exercise_answers` e removem essas colunas de `public.exercises`. Porém, a migração `20260820060000_security_audit_and_login_rate_limit.sql`, nas funções `check_exercise_answer` e `get_exercise_reveal`, ainda faz `SELECT e.correct_answer, e.explanation` e `SELECT e.explanation, e.reference_answer`. Depois da separação, esses campos não existem em `exercises`, causando falha no fluxo de exercícios.

### Alto — histórico de grants públicos amplos

A cadeia de migrações contém várias concessões históricas de `ALL` para `anon` e `authenticated` em `apostilas`, `apostila_pages`, `exercises`, `content_backups` e `workbook_content_integrity`. Há revogações posteriores em partes do fluxo, mas o estado efetivo precisa ser verificado no banco e a migração final deve reforçar explicitamente o menor privilégio para tabelas sensíveis. A presença de um `GRANT` histórico não prova exposição atual, mas é um risco de manutenção e regressão.

### Médio — superfície de XSS depende do renderer customizado

`ApostilaContentRenderer.tsx` utiliza múltiplos `dangerouslySetInnerHTML`, mas possui funções `safeUrl`/`sanitizeHtml` com allowlist e DOMPurify. A segurança depende de todos os sinks passarem pelo sanitizador; será verificado com testes negativos de HTML, esquema de URL e atributos.

### Baixo/Médio — abertura de anúncio sem política explícita de noopener

`src/components/AdPopup.tsx` usa `window.open(currentAd.link_url, '_blank')` sem a opção explícita `noopener,noreferrer`. O risco é menor porque a URL é controlada pelo conteúdo do anúncio, mas o fluxo deve validar esquema e abrir com proteção contra reverse tabnabbing.

## Estado da auditoria

Os achados acima foram levantados antes de qualquer correção nesta auditoria. O próximo passo é confirmar o esquema atual acessível pelo endpoint público, revisar Edge Functions e fluxos de gamificação/Ella, e então aplicar correções aditivas com testes e migrações compatíveis.

## Evidências adicionais da auditoria

### Crítico — Edge Function `fix-user-login` sem autenticação

`supabase/functions/fix-user-login/index.ts` aceita requisições sem validar `Authorization`, usa `SUPABASE_SERVICE_ROLE_KEY` e executa alterações administrativas fixas: confirma e-mail, limpa tentativas, altera perfil para `account_type = 'admin'` e faz upsert em `user_roles` para o usuário administrativo hardcoded. Se publicada, essa função representa uma rota não autenticada capaz de modificar identidade e privilégios. Deve ser removida/desativada ou protegida com `requireAdmin`; a opção segura é deixar a função como endpoint administrativo autenticado e sem dados hardcoded mutáveis por cliente.

### Alto — migrações históricas concederam privilégios amplos

A cadeia versionada inclui vários `GRANT ALL` para `anon` e `authenticated` em tabelas de conteúdo. O estado live consultado pelo papel anônimo retorna `401 permission denied` para `exercises` e `auth_attempts`, o que é evidência de que essas tabelas não estão acessíveis diretamente ao anônimo no momento. Entretanto, o endpoint PostgREST retornou `404 schema cache` para `exercise_answers` e `exercise_answer_access_log`, confirmando que as migrações de separação/auditoria ainda não estão aplicadas no banco conectado.

### Alto — diagnóstico cronológico ainda não aplicado

As tabelas e RPCs do diagnóstico (`apostila_validation_alerts`, `apostila_operation_logs`, `get_apostila_validation_dashboard`) também não aparecem no schema cache live. Portanto, o painel e os alertas estão implementados no código e nas migrações, mas ainda dependem da aplicação da migração correspondente.

### Médio — `list-ads` usa service role em endpoint público

A função retorna apenas anúncios ativos e remove `start_date`, `end_date` e `target_pages`, mas usa service role sem autenticação e ainda expõe `view_count` e `click_count`. É necessário limitar o retorno a campos de descoberta e validar URL no servidor ou no cliente antes da abertura.

### Médio — popup abre URL sem noopener

`AdPopup.tsx` chama `window.open(currentAd.link_url, '_blank')`. Deve validar apenas `http`/`https` e usar `noopener,noreferrer`, alinhando-se ao padrão já usado no renderer de apostilas.

## Próximas mitigações prioritárias

1. Proteger ou desativar `fix-user-login` imediatamente.
2. Corrigir as funções finais de gabaritos para ler somente `exercise_answers` e garantir que a migração seja aplicável em ordem.
3. Reforçar a migração de menor privilégio para anúncios e tabelas sensíveis.
4. Adicionar testes de segurança para esses contratos e executar a auditoria de rotas, renderer, Ella, gamificação e performance.

## Rodada adicional de auditoria e mitigação

### Achados confirmados

| Severidade | Área | Achado | Impacto |
|---|---|---|---|
| Crítica | Edge Function `admin-create-user` | O helper `json` referenciava `req` fora do escopo da função, causando erro em qualquer resposta que passasse por esse caminho. | Criação administrativa de usuários podia falhar mesmo com sessão válida. |
| Alta | Storage de anúncios | Migração histórica permitia `INSERT`, `UPDATE` e `DELETE` no bucket `ads` para qualquer usuário autenticado. | Um usuário autenticado poderia alterar ou remover mídia de anúncios. |
| Média | Anúncios | A função pública e o fallback frontend retornavam ou solicitavam `view_count` e `click_count`, que são métricas internas. | Exposição desnecessária de analytics e superfície de enumeração. |
| Média | Popup de anúncios | Abertura com `window.open(..., '_blank')` sem `noopener,noreferrer`. | A página externa poderia manter referência à aba de origem via `window.opener`. |
| Média | Autenticação | A senha do usuário especial estava embutida no código da Edge Function. | Segredo operacional exposto no repositório e em deploys da função. |
| Média | Recuperação de senha | O `redirectTo` aceitava qualquer URL HTTPS. | Possibilidade de redirecionamento para domínio externo após fluxo legítimo de recuperação. |

### Mitigações aplicadas

A função `admin-create-user` agora usa `getCorsHeaders` por requisição e `requireUser(..., { requireAdmin: true })`, valida método HTTP, trata ausência de configuração como indisponibilidade controlada e devolve mensagens genéricas em falhas internas. O upsert de perfil e papel também passou a registrar apenas códigos de erro no log, sem vazar mensagens sensíveis ao cliente.

A nova migração `20260820140000_public_surface_hardening.sql` remove as políticas históricas permissivas do bucket de anúncios e recria operações de mídia exclusivamente para administradores. A leitura pública de imagens é mantida por necessidade funcional, enquanto a visualização de métricas de anúncios é limitada a administradores.

A resposta pública de anúncios e o fallback do frontend passaram a selecionar somente campos de apresentação. O popup agora abre links externos com `noopener,noreferrer`. A credencial do usuário especial foi movida para `SPECIAL_USER_PASSWORD`, e os redirecionamentos de recuperação de senha foram limitados aos domínios oficiais e hosts locais de desenvolvimento.

### Evidência de regressão

Foi criada a suíte `src/test/security-hardening.test.ts`, cobrindo a guarda de endpoints administrativos, ausência de senha hardcoded, contrato dos RPCs de gabaritos, ausência de contadores internos na superfície pública de anúncios e navegação externa segura. Após as alterações, TypeScript, Vitest, build de produção e `git diff --check` passaram.

### Pendente de produção

A migração de hardening precisa ser aplicada no projeto Supabase de produção para revogar efetivamente as políticas antigas do storage e restringir as métricas. A remoção do segredo hardcoded também exige configurar `SPECIAL_USER_PASSWORD` no ambiente da Edge Function antes de depender do fluxo especial.

## Validação visual e autenticada desta rodada

A landing page local carregou sem erro visível, com branding Decode Analytics Academy, navegação pública, recursos e links legais. A tela de login exibiu o fluxo atual sem referência a portal de terceiro; o login administrativo com a conta autorizada G802144 foi concluído e redirecionou para `/admin`. O painel autenticado exibiu a navegação administrativa, incluindo Segurança e Diagnóstico Acadêmico, e o dashboard apresentou Saúde das Apostilas como 100% OK e sem alertas críticos no resumo inicial. A validação foi visual e funcional; não foram executadas operações destrutivas.

Os gates técnicos desta rodada passaram: TypeScript, Vitest com 13 arquivos e 81 testes, build Vite/PWA e `git diff --check`. Permanecem avisos não bloqueantes de depreciação do módulo `punycode` e de atualizações React fora de `act(...)` em testes do drawer, que devem ser tratados como dívida de qualidade de testes, não como falhas de produção.

Data da validação: 20/08/2026.

## Findings confirmados nesta rodada

- O login administrativo está operacional no ambiente local autenticado.
- O painel administrativo expõe a seção de Diagnóstico Acadêmico e a visão geral não reportou inconsistências críticas.
- A superfície pública não exibiu branding UNIP durante a validação visual.
- A auditoria estática identificou e mitigou riscos nos endpoints de manutenção, superfície pública de anúncios, navegação externa, Mermaid, cache/PWA, biometria e quizzes de áudio; a aplicação das migrações Supabase ainda é uma dependência de produção.
- Persistem avisos de teste sobre `act(...)` e a depreciação do `punycode`, sem falha de gate.

## Limites da evidência

A validação local não comprova que todas as migrações novas estão aplicadas no projeto Supabase remoto nem que o deployment de produção da Vercel está servindo o mesmo bundle. Essas duas propriedades devem ser verificadas separadamente após a aplicação das migrações e a liberação de um deployment `READY`.

## Diagnóstico Acadêmico — validação autenticada

A rota `/admin?tab=apostila-validation` abriu e o componente foi montado, mas após o carregamento assíncrono a área principal permaneceu praticamente vazia, exibindo apenas `0` e o cabeçalho. Isso é compatível com a ausência das tabelas/RPCs da migração de diagnóstico no schema live, já identificada na auditoria, porém revela uma oportunidade de UX: o painel deve mostrar explicitamente “migração não aplicada” ou erro de integração, em vez de uma área vazia indistinguível de falha visual. Este achado foi classificado como **médio**, pois não concede acesso indevido, mas dificulta diagnóstico operacional.


## Hardening adicional de SSRF e robustez de ingestão

A revisão direcionada das funções que consomem conteúdo remoto confirmou que o risco não estava apenas na validação inicial do esquema: redirects podiam trocar o destino depois da primeira checagem, respostas podiam ser lidas sem limite e alguns erros eram devolvidos com status 200 e detalhes internos. As funções de IA com endpoints fixos (`apostila-chat`, `apostila-summary` e chamadas equivalentes aos provedores configurados) não foram classificadas como SSRF arbitrário, pois não aceitam o destino externo do cliente.

| Função | Correção aplicada | Status |
|---|---|---|
| `news-reader` | Redirect manual com revalidação de cada destino, máximo de três redirects, limite de 2 MB, sanitização de URLs absolutizadas, `Cache-Control: private, no-store` e erro genérico com log interno. | Implementado e coberto por regressão |
| `tech-news` | Filtro de feeds provenientes do banco, helper compartilhado de SSRF, redirect manual, limite de 1,5 MB por feed, links e imagens não públicos descartados e erro fatal sem mensagem interna. | Implementado e coberto por regressão |
| `validate-rss` | Helper compartilhado, redirect manual, limite de 1,5 MB, lote limitado a 20 URLs, `feedId` validado e erro genérico com status 500. | Implementado e coberto por regressão |
| `extract-content` | Detecção de Notion restrita ao host real, fetch direto com timeout e redirects revalidados, limite de 2 MB, payload administrativo limitado a 500 KB e resposta Firecrawl limitada. | Implementado e coberto por regressão |

As correções preservam os fluxos existentes: a importação continua aceitando fontes públicas, o agregador continua usando feeds configurados, o leitor continua acessível a usuários autenticados e o validador permanece administrativo. O comportamento novo é bloquear apenas esquemas, hosts privados, destinos de redirect não públicos, respostas acima do limite e lotes excessivos.

## Evidência técnica da rodada final local

A suíte passou com **13 arquivos e 86 testes aprovados**. O TypeScript terminou sem erros, o build Vite/PWA foi concluído e `git diff --check` não encontrou whitespace inválido. O build ainda emite avisos não bloqueantes de chunks acima de 500 kB, principalmente módulos de diagramas, PDF, páginas administrativas e apostilas; isso permanece como oportunidade de code-splitting, não como falha funcional desta rodada.

## Status consolidado antes da publicação

As alterações desta rodada ainda precisam ser incluídas no commit e enviadas ao repositório remoto. As migrações `20260820060000`, `20260820100000`, `20260820140000` e `20260820160000` continuam dependentes de aplicação no projeto Supabase conectado. A variável `SPECIAL_USER_PASSWORD` continua necessária no ambiente da função `ra-auth`. A produção Vercel segue condicionada ao bloqueio de configuração de conta já observado; portanto, nenhum resultado local ou de GitHub deve ser apresentado como prova de que os domínios públicos já servem o novo bundle.

Data da atualização: 20/08/2026.


## Verificação externa após a publicação no GitHub

A branch `main` foi publicada no GitHub no merge commit `02a0e4f6`. A integração Git da Vercel reconheceu esse SHA e criou o deployment `dpl_AjHQ3ABADG2xLK52ouBJHK8vjgET`, mas o estado retornado foi **BLOCKED**, com alvo `production`. A URL do inspector é [Vercel deployment inspector](https://vercel.com/decode-analytics-s-projects/decodeanalyticsacademy/AjHQ3ABADG2xLK52ouBJHK8vjgET), e o alias de deployment é `decodeanalyticsacademy-po4lt2w7p-decode-analytics-s-projects.vercel.app`.

A consulta direta ao alias respondeu HTTP 200, porém o conteúdo foi a página padrão da Vercel com título **“Deployment is building”**, não o bundle da Decode Analytics Academy. Isso confirma que o código já chegou ao GitHub e que a integração detectou o commit, mas não confirma publicação funcional em produção; o bloqueio de conta/configuração permanece a etapa impedida.

Fonte externa consultada em 20/08/2026: [lista de deployments do projeto Vercel](https://vercel.com/decode-analytics-s-projects/decodeanalyticsacademy) e [alias do deployment consultado](https://decodeanalyticsacademy-po4lt2w7p-decode-analytics-s-projects.vercel.app/).


## Verificação dos endereços públicos

Em 20/08/2026, os dois endereços oficiais foram consultados sem autenticação: [Lovable](https://decodeanalyticsacademy.lovable.app/) e [Vercel](https://decodeanalyticsacademy.vercel.app/). Ambos responderam com sucesso e exibiram o mesmo conteúdo textual de landing page, incluindo o título “Estude com Ciência da Computação”, a referência a 48 disciplinas, exercícios práticos e acesso por computador e celular. A igualdade textual confirma que não há divergência básica entre os dois hosts nessa página pública. Essa verificação não substitui o teste autenticado das rotas internas nem prova que o deployment Vercel mais recente esteja ativo, pois o alias de deployment recém-criado ainda retornou a página intermediária “Deployment is building”.


## Verificação do painel Supabase

A URL do painel de migrações foi aberta em modo somente leitura. Após o carregamento, o Supabase redirecionou para `/dashboard/sign-in`, portanto não havia sessão autenticada disponível neste navegador para consultar ou aplicar as migrações. Nenhuma alteração foi executada no banco. O estado já observado anteriormente permanece: as migrações auditadas precisam ser confirmadas no projeto `gynguskgysompgcajunc` por uma sessão administrativa do Supabase.


### Atualização do estado Vercel após os commits documentais

Após os pushes `46bd578b` e `4c6a29d0`, a integração Git da Vercel detectou ambos os SHAs e criou os deployments `dpl_HDXkbZmba3wSSDY18K8QeWxMPECo` e `dpl_1oGavUgnS3p9dVwF2JVYJWpHiS5Y`. Os dois retornaram `state: BLOCKED` e `target: production`. A publicação do código no GitHub está confirmada; a promoção em produção continua bloqueada pela configuração/conta da Vercel, não por falha dos gates locais.


## Verificação ao vivo das apostilas agrupadas

Em 20/08/2026, o host Lovable restaurou uma sessão existente no navegador. A landing page exibiu o botão “Acessar apostilas”; ao acioná-lo, a URL permaneceu na landing page e a página apenas reposicionou o viewport para o bloco de recursos. Portanto, essa interação pública não abriu a lista interna de apostilas e não é evidência suficiente para confirmar ou negar a separação dos registros.


## Evidência do dashboard autenticado

A rota [dashboard autenticado](https://decodeanalyticsacademy.lovable.app/dashboard) restaurou a sessão administrativa no navegador e exibiu `Auth: Authorized`, `Access Level: 4` e a seção “Minhas Disciplinas”. O dashboard informou `52 apostilas disponíveis` e agrupou a grade por disciplina/semestre; a rota interna registrada no código é `/apostila/:id`, enquanto `/apostilas` redireciona para `/dashboard#apostilas`. Essa página confirma que a sessão e a lista agregada carregam, mas o conteúdo extraído ficou truncado antes de permitir comparar todas as páginas da apostila específica.


Na verificação interativa, o dashboard autenticado exibiu o menu lateral completo. O item visualmente correspondente a “Exercícios” abriu corretamente `/exercicios`; portanto, a sessão e a navegação protegida estão ativas. A área de apostilas deve ser acessada pelo item específico `/dashboard#apostilas` ou pelo botão “MINHAS DISCIPLINAS”, não pelo índice visual usado nessa tentativa.


A rota `/dashboard#apostilas` carregou com `AUTH: AUTHORIZED`, preservou o usuário administrador e destacou o item “APOSTILAS” no menu lateral. A listagem de 52 apostilas continua acessível no dashboard; a verificação de mistura ainda depende de abrir a apostila específica e comparar suas páginas/registros.


No DOM do dashboard, a apostila `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais` aparece no card “Continue de onde parou”. O controle “Retomar leitura” é um `<button>` interno sem `href`; por isso, a navegação precisa ser acionada pelo evento React do próprio botão, e não por um link direto visível no HTML.


## Evidência adicional — retomada da apostila

Ao acionar o botão `Retomar leitura` do card de `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais` na versão pública Lovable, o navegador foi levado para `https://decodeanalyticsacademy.lovable.app/`, a landing page pública, em vez de `/apostila/:id` ou `/reader/:id`. Isso demonstra um problema separado de navegação do card de retomada; não constitui, por si só, prova de que páginas estejam misturadas. As rotas protegidas previstas no código local são `/apostila/:id` e `/reader/:id`.


## Verificação de agrupamento — dashboard público autenticado

Em 20/08/2026, o dashboard Lovable restaurou a sessão administrativa e carregou a área de disciplinas. A inspeção do DOM encontrou o botão de retomada e a pasta `Gestao de Projetos I1 Caderno` com a ação `Explorar Disciplina`. Também foram listadas outras pastas e apostilas, mas a busca textual visual não localizou a string sem acento porque o texto renderizado pode estar normalizado de forma diferente. A verificação continua em modo somente leitura.


### Evidência de pasta de Gestão de Projetos

A inspeção direcionada do DOM encontrou exatamente um botão de exploração para `Gestao de Projetos I`, exibido como `1 Caderno`. Não foram encontrados dois cards de exploração para essa mesma pasta no dashboard carregado. O card `Continue de onde parou` é outro componente e exibe `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais`; por isso, ele não deve ser usado como prova de duplicação da pasta de Gestão de Projetos.


### Pasta aberta — Gestão de Projetos I

A pasta única abriu em `/materia/Gestao%20de%20Projetos%20I` e exibiu `Gestao De Projetos I`, `6º Semestre`, `1 módulos` e um único módulo `Materiais de Estudo`. Não há dois cadernos ou duas pastas duplicadas visíveis nessa tela. Isso confirma a separação no nível de disciplina; a conferência final deve verificar as páginas internas e a apostila específica de Gestão de Projetos Operacionais.


### Leitor aberto — Gestão de Projetos I

O módulo abriu no registro `773fa9ba-6714-4968-87fc-6989515f7c01`, em `/apostila/:id`. O leitor exibiu `Gestao de Projetos I`, `34 seções`, `2 exercícios`, `1 capítulo` e um único conteúdo principal com as seções de Fundamentos de Gerenciamento de Projetos. Não apareceu, nessa leitura, um segundo capítulo, página ou título de outra aula/dia misturado ao conteúdo.


## Resultado decisivo — apostila agrupada ainda inconsistente

Consulta somente leitura autenticada ao Supabase, realizada em 20/08/2026, encontrou a apostila `b132f212-5ede-4522-92d3-b0ead2cd8ce2`, intitulada `Introdução às Ferramentas de Análise de Dados e Gestão de Projetos Operacionais`, categorizada como `Pesquisa Operacional`, com três páginas:

| Posição | ID | Título | Datas detectadas | Tamanho do conteúdo |
|---:|---|---|---|---:|
| 1 | `812c2375-dc09-460e-a964-1bba36d586ba` | Aula - 19/08/2026 (Pesquisa Operacional & Modelagem) | 19/08/2026 | 7.886 caracteres |
| 2 | `ad3c4196-1a07-46ff-a415-3a5503fb7dac` | Aula - 01/01/2024 | 01/01/2024 | 52.798 caracteres |
| 3 | `206fac6f-845d-4b91-bd30-e6cb0497a3f1` | Fragmento de Aula (Data Pendente) | nenhuma | 100 caracteres |

Isso confirma que a separação **não está totalmente corrigida**. A página de 01/01/2024 e o fragmento sem data continuam no mesmo registro da aula de 19/08/2026. A apostila `Gestao de Projetos I` é outro registro, com uma única página, e não deve ser confundida com a apostila operacional afetada.


### Confirmação do conteúdo misturado

A consulta adicional mostrou que o registro principal `b132f212-5ede-4522-92d3-b0ead2cd8ce2` tem apenas 100 caracteres e nenhuma data; o conteúdo efetivo está nas páginas. A página 1 corresponde à aula de 19/08/2026 de Pesquisa Operacional e Modelagem. A página 2, criada em 20/08/2026, tem 52.798 caracteres, está titulada como 01/01/2024 e contém referências a Excel, Power BI, Pesquisa Operacional, Gestão de Projetos, modelagem e Projeto E-commerce. A página 3 é um fragmento de 100 caracteres sem data. A evidência confirma uma inconsistência de agrupamento/conteúdo ainda não resolvida.

## Ferramentas de separação por data — implementação adicional

Nesta rodada foram adicionadas ferramentas administrativas para reduzir a recorrência de aulas agrupadas incorretamente. A migração `20260820180000_apostila_date_separation_tools.sql` cria a RPC `separate_apostila_pages_by_date`, protegida por `has_role(..., 'admin')`, com operação transacional, snapshot prévio em `apostila_versions`, detecção de seções ancoradas por data, comportamento idempotente por conteúdo, registro em `apostila_operation_logs` e bloqueio seguro quando não existem pelo menos duas seções datadas. O conteúdo original não é apagado sem uma seção reconhecível; o procedimento retorna os IDs criados/reutilizados e as datas detectadas.

O Workbench agora mostra alerta quando a validação cronológica encontra inconsistências, oferece “Solicitar separação” e “Re-separar aulas por data”, e reconhece o parâmetro `?separate=1` vindo do painel para executar uma única solicitação após o carregamento da apostila. O diálogo de importação por link salva o conteúdo extraído antes de tentar a separação automática, mantendo o material importado caso a RPC esteja bloqueada ou a migração ainda não esteja aplicada.

O leitor de apostilas recebeu filtro por data, com opção de todas as aulas, cada data identificada e “Data pendente”. A filtragem atua somente na navegação de páginas livres e não altera o progresso global. O painel de diagnóstico passou a permitir exportação CSV do histórico `apostila_date_separation`, com escape de campos, BOM UTF-8, separador compatível com planilhas brasileiras e limite de 5.000 registros.

A cobertura automatizada foi ampliada para **89 testes aprovados**, incluindo extração/formatação de datas, retorno sucedido da RPC, bloqueio seguro por falta de seções datadas e encaminhamento correto do usuário/operação. TypeScript, build Vite/PWA e `git diff --check` também foram executados com sucesso; os avisos de chunks grandes do Vite permanecem informativos e não impediram o build.

A migração ainda precisa ser aplicada no projeto Supabase de produção antes que a RPC e o CSV histórico funcionem no ambiente publicado. A UI identifica a ausência da migração e informa o administrador sem apagar conteúdo nem tratar a apostila como íntegra.

---
