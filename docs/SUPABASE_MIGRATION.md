# Migração para o Supabase

## Projeto de destino

A aplicação Decode Analytics Academy foi apontada para o projeto Supabase `wxkkpjpqyrygglbuogsd`, com URL `https://wxkkpjpqyrygglbuogsd.supabase.co`.

O arquivo `.env` deixou de ser versionado. Use `.env.example` para configurar cada ambiente com a URL, o identificador do projeto e a chave pública do Supabase.

## O que foi migrado

O schema local foi consolidado e aplicado ao banco novo em blocos ordenados. Foram preservadas as tabelas, enums, índices, policies RLS, triggers, funções RPC e objetos relacionados ao Storage presentes no histórico do repositório.

O projeto novo também recebeu tabelas-base ausentes no histórico de migrations, reconstruídas a partir do contrato TypeScript existente, além de colunas de compatibilidade identificadas durante a execução incremental.

As Edge Functions publicadas até a validação final são `ra-auth`, `apostila-chat`, `mcp` e `generate-exercises`, todas com verificação JWT habilitada.

## Correções de compatibilidade

Foram normalizadas criações repetidas de tabelas, triggers, índices e policies. Também foram corrigidas divergências históricas entre `viewed_at`/`clicked_at` e `created_at`, o seed administrativo com UUID fixo, o escopo de conteúdo das apostilas, o leaderboard legado baseado em `profiles.xp`, o modelo de empresas de vagas (`company_name`) e seeds de conteúdo dependentes de dados antigos.

Foram adicionadas as colunas necessárias para o contrato atual em `profiles`, `apostilas` e `exercises`, além das funções-base de compatibilidade `award_badge` e `log_user_action` exigidas por migrations posteriores.

## Validação

A geração de tipos TypeScript a partir do projeto Supabase de destino foi instalada em `src/integrations/supabase/types.ts`. A verificação `tsc --noEmit` passou sem erros.

O build Vite transformou todos os módulos, mas a minificação foi encerrada pelo ambiente com código 143 devido à pressão de memória. Os avisos observados foram relacionados a seletores CSS arbitrários, não a erros de TypeScript ou de integração Supabase.

## Pendências

O projeto contém outras Edge Functions locais além das quatro publicadas nesta etapa. Elas podem ser publicadas incrementalmente pelo mesmo fluxo, priorizando as funções usadas pelas páginas ativas e configurando previamente os secrets externos correspondentes, como chaves de provedores de IA, Firecrawl, PhotoRoom e notificações.

Os dados de usuários e conteúdo do projeto Supabase antigo não foram copiados porque o histórico disponível não continha um dump completo e a consulta autenticada ao projeto antigo não estava autorizada. O schema e os seeds compatíveis foram migrados; dados operacionais devem ser exportados e importados separadamente quando o acesso ao projeto antigo estiver disponível.
