# Auditoria Completa de Segurança — Plano

Nada será alterado agora. Este plano descreve as fases da auditoria; correções só entram depois da sua aprovação (e as críticas primeiro).

## Fase 0 — Preparação (sem mudanças)
- Rodar o scanner de segurança da plataforma + linter do banco + scan de dependências (npm audit).
- Levantar inventário: tabelas e políticas RLS, edge functions e seus modos de autenticação, segredos configurados, rotas do frontend.
- Definir contas de teste: admin, aluno comum e aluno com escopo restrito (ENEM).

## Fase 1 — Banco de dados e isolamento de usuários
- Para cada tabela pública: conferir RLS habilitado, GRANTs coerentes com as políticas e ausência de políticas permissivas (`using (true)`) indevidas.
- Verificar funções `security definer` (has_role, get_email_for_ra, get_student_detail, delete_user_completely, etc.): `search_path` fixo e checagem de papel dentro da função.
- Teste prático: com o token de um aluno, tentar ler/alterar linhas de outro usuário nas tabelas sensíveis (profiles, planos_estudo, flashcards, respostas_foto, tira_duvidas, notifications, user_roles).
- Confirmar que `user_roles` não é gravável pelo próprio usuário (escalada de privilégio via banco).

## Fase 2 — Autenticação e sessão
- Fluxo RA/e-mail: checar enumeração de usuários (mensagens de erro distintas, timing), bloqueio por tentativas, e se `get_email_for_ra` vaza e-mails.
- Sessão: persistência, refresh, logout multi-aba, expiração, e se algum dado sensível fica em localStorage.
- Reset de senha e `admin-set-password`: confirmar exigência de papel admin no servidor.

## Fase 3 — Edge functions / APIs
- Para cada função em `supabase/functions/`: exige JWT? valida papel? valida entrada (schema/limites)? retorna erro genérico sem stack trace? CORS restrito ao necessário?
- Foco em funções que gravam ou usam service role: `admin-set-password`, `admin-upload-ad-image`, `send-push`, `promo-media`, `list-ads`, `mcp`, geradores de conteúdo.
- Testes de manipulação de parâmetro: IDs de outro usuário, campos extras (`user_id`, `role`, `is_admin`), payloads gigantes, tipos errados, URLs internas em funções que fazem fetch (SSRF em `news-reader`, `validate-rss`, `firecrawl-scrape`).
- Rate limiting: verificar quais funções caras estão sem limite (geradores de IA, upload, tira-dúvidas).

## Fase 4 — Assistente Ella (riscos de IA)
- Revisar o gate de autorização (`security.ts`) e confirmar que a decisão vem só do servidor.
- Bateria de ataques contra a função real: prompt injection direta e indireta (conteúdo de apostila/RSS/PDF), jailbreak, extração do system prompt, role override, tool injection e chamada de ferramentas de admin por aluno, chaining, exfiltração de dados de outros usuários, bypass de escopo ENEM.
- Confirmar que cada tentativa é negada, auditada em `ella_audit_log` e gera alerta em `security_notifications`, e que o rate limit / bloqueio temporário funciona.
- Ampliar `security_test.ts` com os cenários que faltarem.

## Fase 5 — Frontend e uploads
- Buscar segredos/chaves no bundle (só a publishable key deve aparecer), `dangerouslySetInnerHTML` sem sanitização, XSS em markdown/comentários/menções.
- Verificar se alguma decisão de permissão existe só no cliente (esconder botão ≠ proteger ação) e confirmar o equivalente no backend.
- Upload de arquivos e geração de PDF: validação de tipo/tamanho, políticas de storage, URLs assinadas com expiração.
- Conferir os 4 estados (carregando, vazio, erro, sucesso) e tratamento de erro com toast nas telas tocadas por correções.

## Fase 6 — Segredos, dependências e resiliência
- Confirmar que nenhuma chave privada está em código ou versionada; todas em segredos de backend.
- Dependências com vulnerabilidade alta/crítica: listar e propor atualização.
- Resiliência: entradas malformadas, rede caindo, requisições em rajada, dados duplicados — sistema deve falhar de forma controlada e sem vazar detalhes internos.

## Fase 7 — Relatório e correções
- Entregar `SECURITY_AUDIT.md` na raiz com: vulnerabilidade, criticidade (Crítico/Alto/Médio/Baixo), evidência técnica, impacto no negócio, recomendação.
- Aplicar as correções em ordem de criticidade, uma frente por vez, sem quebrar comportamento existente (checando dependências antes de cada mudança).
- Reexecutar os testes que falharam e marcar cada item como corrigido/aceito.
- Registrar a entrega no `src/data/changelog.ts`.

## Critério de aprovação
Sem vulnerabilidades críticas em aberto; impossível obter privilégio de admin indevidamente; Ella resistente a injection/jailbreak/escalada; permissões validadas só no backend; dados isolados por usuário; APIs autenticadas e limitadas; segredos protegidos.

## Observações
- Fases 0–6 são leitura e teste: nada muda no app.
- Correções que exigirem migração de banco virão como migração separada, com aprovação sua.
- Se algum teste depender de credenciais reais de aluno em produção, uso as contas de teste já existentes.
