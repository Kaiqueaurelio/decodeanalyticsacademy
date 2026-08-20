# Validação de interface — 20/08/2026

A sessão autenticada abriu `http://localhost:4175/admin` e carregou o Dashboard Admin da Decode Analytics Academy.

A navegação lateral apresentou as seções **Usuários**, **Alertas de Segurança**, **Diagnóstico**, **Testes** e **Apostilas**. O dashboard carregou os contadores de 52 apostilas, 299 exercícios, 29 usuários e 9 anúncios.

A seção `http://localhost:4175/admin?tab=users` carregou **Gerenciar Usuários**, com 29 usuários ativos e controles administrativos. A interface não exibiu erros de rota ou tela em branco.

A validação do Workbench e da separação da apostila de Gestão de Projetos Operacionais já está registrada em `audit-gestao-projetos-2026-08-20.md` e `public-deployment-evidence-2026-08-20.md`.

Nenhuma operação destrutiva foi realizada durante esta validação visual.


## Validação adicional do dashboard

Em 20/08/2026, o dashboard local autenticado abriu em `/admin?tab=users` com a mensagem de sessão restaurada, 29 usuários cadastrados, lista de usuários e controles de permissão visíveis. A interface carregou o painel administrativo completo e a tabela de usuários; o primeiro controle `Aluno` é um combobox de permissão, não o botão de abrir detalhes. O estado visual foi preservado para continuidade da validação do relatório e da auditoria.

A validação de compilação foi executada no checkout local antes desta etapa: TypeScript, build Vite, 63 testes em 11 arquivos e `git diff --check` passaram. Os avisos observados foram apenas warnings de `act(...)` nos testes e depreciação do `punycode`, sem falha de teste.

A migração de segurança foi revisada: o RPC administrativo do PDF exige `has_role(auth.uid(), 'admin')`, e o payload inclui apenas escolhas/resultados do aluno, sem campos de gabarito.

## Prova do PDF

O exportador real `downloadStudentPerformancePdf` foi executado no dashboard local com dados sintéticos de validação, sem campos de gabarito. O Chromium registrou o download concluído como `relatorio-desempenho-aluno-de-valida-o.pdf` em 20/08/2026. Isso comprova a criação do PDF no fluxo de frontend; os dados reais do aluno são obtidos pelo RPC administrativo protegido e há fallback para os dados já carregados no modal.

## Correção descoberta durante a validação

A abertura de `/admin?tab=workbench` reproduziu um erro real: `Cannot read properties of undefined (reading 'title')`. A causa foi um parâmetro legado de URL que não corresponde mais a uma aba válida do AdminPage; o Workbench atual é uma rota separada em `/admin/apostilas/:id`, mas o mapa de títulos era acessado sem guarda. A correção adicionou validação dos IDs de aba e fallback seguro para `Visão Geral`, além de uma guarda no metadado renderizado. Após a alteração, a mesma URL renderizou o painel normalmente com `Visão Geral`.

O registro `e9923dc3-33be-4023-9567-ed7c9726caf6`, criado exclusivamente para reproduzir o botão `+ PÁGINA`, foi removido com a sessão administrativa autenticada. O DELETE retornou o próprio ID, sem erro.

## Revisão final de segurança e compatibilidade

Durante a revisão do SQL foi identificado e corrigido um risco de aplicação da migração: a primeira versão referenciava uma tabela `exercise_answers` que não existe no esquema do projeto e alterava indevidamente o retorno de `check_exercise_answer` de `jsonb` para `json`. A versão final usa as colunas protegidas da tabela `exercises`, mantém `RETURNS jsonb` compatível com a função anterior e registra as respostas em `answers` com upsert idempotente. A checagem estática confirmou ausência de `exercise_answers` e `question_type` nessa migração.

Também foram removidos os rótulos visíveis “Aluno UNIP” das funções de criação/login e da página de perfil. O domínio técnico legado `ra.unip.local` foi preservado somente como compatibilidade interna para contas RA já existentes; ele não é exibido como portal, link ou branding na interface.

Após esses ajustes, TypeScript, build Vite, Vitest (11 arquivos e 63 testes) e `git diff --check` passaram novamente. O build manteve apenas o warning já conhecido de chunks acima de 500 kB e os testes mantiveram apenas avisos deprecados não bloqueantes.


## Implementação adicional — diagnóstico cronológico e observabilidade do Workbench

Foi adicionada a migração `20260820100000_apostila_chronology_diagnostics.sql`. Ela cria execuções de validação, issues com severidade e metadados, alertas abertos para correção preventiva e logs operacionais do Workbench com `operation_id`, fase, status, IDs afetados, código de erro, mensagem e metadados. O conteúdo integral das aulas não é persistido nesses registros; a evidência fica limitada a títulos, datas detectadas, posições e identificadores.

A validação server-side verifica conteúdo principal com múltiplas datas, divergência entre título e conteúdo, página sem data no título, página com mais de uma data, divergência de data em página e ordem cronológica invertida. O parser SQL trata datas impossíveis sem abortar a transação. Triggers em `apostilas` e `apostila_pages` executam a validação após inserção ou edição, criando alertas para inconsistências que precisam ser revisadas antes da publicação.

O Workbench agora registra o início, bloqueio, sucesso ou falha da criação de uma página. O log inclui a página atual, a página criada, a posição escolhida, a URL de navegação, o resultado da validação e o erro retornado pelo banco quando houver falha. O autosave e a publicação também mantêm validação local determinística e guarda server-side quando a função estiver disponível.

O painel administrativo `ApostilaValidationDashboard` exibe resumo das validações, últimas execuções, alertas abertos, evidências e operações recentes. As rotinas administrativas de criação, substituição, anexação e importação de apostilas também disparam rastreamento e validação pós-mutação, permitindo identificar clonagens e edições com cronologia incompatível.

### Evidência dos testes finais

A suíte dedicada `src/test/apostila-chronology.test.ts` cobre normalização de datas, conteúdo principal com múltiplas aulas, divergência entre título e conteúdo, ordem invertida, sequência válida, atualização isolada de página, criação na próxima posição e propagação de erro de leitura. O resultado final foi **12 arquivos de teste aprovados e 71 testes aprovados**. O TypeScript passou sem erros, o build Vite/PWA foi concluído com sucesso e `git diff --check` não encontrou whitespace inválido. Permanecem apenas os avisos preexistentes de chunks maiores que 500 kB e avisos de `act(...)` em testes antigos do menu.

### Aplicação em produção

A migração precisa ser aplicada no projeto Supabase de produção antes que o painel leia os dados persistidos, os triggers sejam executados, os logs server-side sejam gravados e os alertas automáticos fiquem ativos. O frontend degrada de forma segura enquanto a migração não estiver aplicada: a validação local continua disponível e a indisponibilidade do RPC é registrada no console, sem impedir o uso normal das apostilas.
