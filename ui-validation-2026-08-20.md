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
