# Correções de segurança

## Correções aplicadas

A função `ella-chat` agora reaplica, mesmo usando cliente service-role, os filtros `published = true` e `content_scope` para `search_app` e `get_apostila` quando o usuário não é administrador. Alunos com escopo `enem_only` ficam limitados às categorias ENEM e Simulados ENEM.

As policies de SELECT da tabela `apostilas` foram consolidadas em uma única policy autenticada que exige publicação e respeita o escopo do perfil. Policies SELECT antigas e policies ALL que poderiam ampliar a leitura foram removidas; as policies de escrita administrativas continuam separadas.

Foi aplicada uma migration de hardening das funções `SECURITY DEFINER`: o acesso anônimo foi revogado para funções sensíveis e o `search_path` foi fixado nas funções existentes apontadas pelo linter. `has_role` e `get_email_for_ra` permanecem exceções intencionais para o fluxo de login por RA.

## Itens já corrigidos no checkout

`gemini-direct` já exigia `requireAdmin: true`, portanto não precisou de alteração adicional. `extract-announcement` também já usava `requireAdmin: true` no código atual.

A referência a `src/lib/content-recovery/recovery-client.ts` não existe no checkout atual e não foi encontrada nenhuma referência `VITE_*` a service-role dentro de `src/`. O segredo service-role permanece restrito às Edge Functions.

## Itens mantidos como exceção

A extensão `vector` continua no schema `public` por ser uma extensão gerenciada e usada diretamente por colunas e índices de embeddings. Movê-la exigiria refatorar o modelo vetorial e os índices em conjunto.

Algumas tabelas com RLS sem policies aparecem como avisos informativos. Nessa configuração, a ausência de policy mantém o acesso bloqueado por padrão; não foram criadas policies permissivas sem um requisito funcional explícito.
