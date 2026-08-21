# Auditoria inicial de segurança — Decode Analytics Academy

## Escopo e fonte de verdade

A auditoria está sendo executada no checkout `/home/ubuntu/decodeanalyticsacademy-correct`, na branch `main`, conectado ao repositório `Kaiqueaurelio/decodeanalyticsacademy`. O checkout local está no commit `ae5cb6f4` (`fix: tornar fallback de login resiliente`) e foi sincronizado com `origin/main` antes do início desta auditoria.

A aplicação usa React/Vite, Supabase, Edge Functions, RLS, TanStack Query e um fluxo de PWA que sofreu divergência entre os domínios públicos. A Vercel identificou o commit atual, porém o deployment de produção foi cancelado com `githubCommitVerification: unverified`; o projeto Git reutilizado também aparece como `live: false` e não lista o domínio público `decodeanalyticsacademy.vercel.app` entre seus domínios ativos. Portanto, a auditoria separa explicitamente evidências locais, GitHub, deployment construído e produção.

## Escopo técnico

Serão revisados autenticação e sessão, fallback de RA/e-mail, rate limiting e bloqueio, guards de rota e permissões administrativas, Edge Functions e CORS/JWT, RLS/RPCs, exposição de respostas de exercícios, inserções de auditoria, URLs externas, renderização de HTML/Markdown, chaves e segredos, headers de segurança, service worker/cache, dependências e testes automatizados.

## Restrições

Nenhum dado do banco será alterado durante a auditoria. Migrações ou mudanças de RLS só serão propostas/aplicadas se houver evidência suficiente, escopo mínimo e validação explícita. Senhas, tokens, chaves privadas e valores de `.env` não serão impressos em logs ou relatórios.

## Critérios de evidência

Cada achado será classificado como crítico, alto, moderado ou baixo, com arquivo/fluxo afetado, impacto, correção aplicada ou pendência, teste correspondente e distinção entre código corrigido localmente, commit enviado e deployment/produção efetivamente atualizado.

## Achados prioritários identificados

1. **Alto — exclusão de conta sem método HTTP restrito e sem confirmação explícita**: `delete-account` aceita qualquer método diferente de OPTIONS, usa autenticação própria com service role e devolve a mensagem bruta do erro. A operação é irreversível e precisa aceitar somente POST, validar Bearer estritamente, exigir confirmação no corpo e registrar auditoria sem usar `logout` como proxy.

2. **Moderado/alto — exportação de dados com service role e `select('*')`**: `export-user-data` filtra pelo usuário autenticado, mas retorna campos completos de várias tabelas e aceita qualquer método diferente de OPTIONS. Deve ser restrita a POST, validar o corpo/aceite, limitar colunas exportadas e não incluir segredos, tokens ou metadados internos.

3. **Moderado — `admin-set-password` aceita UUID sem validação formal e devolve mensagens brutas do Auth**: a função já exige admin, mas precisa restringir método, validar UUID, normalizar erros e registrar a ação administrativa.

4. **Moderado — `list-ads` usa service role sem autenticação apesar do comentário afirmar que usuários não autenticados recebem lista vazia**: há divergência entre contrato e implementação. O endpoint deve ser explicitamente público somente se essa for a intenção, ou exigir sessão; a resposta deve usar CORS do projeto.

5. **Baixo/moderado — política histórica de auditoria permite que qualquer usuário autenticado insira eventos próprios arbitrários**: isso não permite leitura de outros usuários, mas pode poluir ou forjar eventos. A correção deve privilegiar RPC/Edge Function para eventos sensíveis e manter compatibilidade com eventos de produto.

6. **Informativo — `split_apostila_by_date` legado é removido pela migration posterior**: a migration de separação administrativa exige papel admin e preserva conteúdo. Será adicionada uma revogação explícita para evitar que instalações parciais mantenham privilégios legados.

A auditoria está sendo executada em modo conservador: nenhuma alteração de dados será feita; somente código, políticas/migrations e testes serão modificados, seguidos de typecheck, testes, lint e build.

## Linha de base

- Os testes existentes em `src/test/security` passaram.
- O lint global ainda falha por débitos técnicos preexistentes, sobretudo `no-explicit-any` em Edge Functions e o arquivo gerado de MCP; esses itens serão separados das correções de segurança para evitar mudanças amplas desnecessárias.

## Resultado do hardening realizado

### Achados corrigidos

1. **Alto — falsificação de auditoria administrativa.** A tabela `admin_audit_logs` permitia inserção direta por administradores autenticados, deixando `admin_id`, `action` e `target_user_id` sob controle do cliente. Foi removida a permissão de INSERT e criada a RPC `public.log_admin_audit(text, uuid, jsonb)`, com `SECURITY DEFINER`, `search_path` fixo, autorização administrativa e uso de `auth.uid()` como autor. O painel de usuários passou a chamar essa RPC.

2. **Alto — endpoint administrativo de alteração de senha.** `admin-set-password` passou a aceitar somente POST, usar o guard compartilhado com `requireAdmin`, validar UUID e senha entre 8 e 72 caracteres, evitar mensagens internas na resposta, resetar o estado de bloqueio e registrar auditoria sem armazenar a senha.

3. **Alto — exportação de dados com seleção ampla.** `export-user-data` passou a exigir POST e sessão válida, usar uma allowlist explícita de colunas, aplicar redaction recursivo de chaves sensíveis, responder com `Cache-Control: private, no-store` e não devolver erros internos.

4. **Médio — endpoint de anúncios exposto.** `list-ads` passou a exigir usuário autenticado, aceitar somente GET, validar parâmetros de filtro e limite, consultar o perfil para respeitar bloqueio/escopo e devolver apenas campos de exibição. O hook `useAds` não usa mais fallback direto para usuários sem sessão ou diante de 401/403.

5. **Médio — fallback de anúncios contornando a proteção do servidor.** O fallback foi mantido apenas para falhas transitórias de infraestrutura quando já existe token de sessão; respostas de autorização recusada não fazem consulta direta ao banco.

### Controles verificados

A auditoria também confirmou sanitização de conteúdo do leitor, navegação externa segura, Mermaid em modo restrito, proteção biométrica, respostas de exercícios por RPC segura, CORS com allowlist, guards de rotas administrativas, invalidação de caches do PWA e funções privilegiadas com permissões restritas. Nenhuma senha, chave privada, token ou dado de banco foi adicionado ao repositório.

### Validação

A suíte completa passou com **18 arquivos e 114 testes**. O `tsc --noEmit` passou, o build Vite de produção passou e `git diff --check` não encontrou whitespace inválido. O build ainda emite apenas avisos não bloqueantes sobre chunks grandes e o módulo legado `punycode` usado pelo ambiente de testes.

### Limitações remotas

A migration `20260821230000_security_audit_rpc_hardening.sql` precisa ser aplicada no projeto Supabase remoto para que as políticas e a RPC entrem em vigor. O código frontend e as Edge Functions precisam ser publicados no domínio ativo; a Vercel anteriormente cancelou deployments por verificação de commit, portanto o domínio público pode continuar servindo uma versão anterior até a publicação ser aceita.
