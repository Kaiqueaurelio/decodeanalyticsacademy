# Auditoria Técnica — Decode Analytics Academy (diagnóstico, sem correções)

Verificações executadas nesta sessão: TypeScript (`tsgo --noEmit`), ESLint, Vitest, build de produção (Vite) e linter de segurança do banco. Nenhum arquivo do projeto foi alterado.

## Resumo dos resultados

| Verificação | Resultado |
|---|---|
| TypeScript | Passa, 0 erros |
| Build de produção | Passa em ~37s (com avisos de chunk) |
| Vitest | **Falha** — 5 de 48 testes quebrados |
| ESLint | **Falha** — 616 erros, 61 avisos |
| Linter do banco | 30 avisos de segurança (0 críticos) |

## Erros encontrados

### 1. Testes quebrados — ALTO
- Arquivo: `src/components/dashboard/ApostilaCoverCard.test.tsx` (5 testes)
- Causa: o componente chama `useNavigate()` mas o teste renderiza sem `<MemoryRouter>`.
- Impacto: a suíte de testes está vermelha; qualquer CI que rode testes bloqueia. Não afeta usuário final.
- Correção: envolver o `render` num `<MemoryRouter>` (idealmente num helper `renderWithRouter` compartilhado).

### 2. ESLint com 616 erros — MÉDIO
- Arquivos: espalhado; concentração em `supabase/functions/**` (`smart-study-plan`, `tira-duvida-foto`, `tech-news`, etc.) e ~62 arquivos em `src/`.
- Causa: uso massivo de `any` (`@typescript-eslint/no-explicit-any`) e `require()` em `tailwind.config.ts`.
- Impacto: perda de segurança de tipos justamente nas bordas de dados (respostas de IA, RSS, JSON do banco) — onde erros silenciosos de runtime nascem. O build passa porque `tsgo` não reprova `any`.
- Correção: tipar as respostas das edge functions com interfaces/`zod`; converter o `require()` do Tailwind para import ESM.

### 3. Bundle de produção muito pesado — ALTO (performance)
- Maiores chunks: `invoke-function` 904 kB, `emacs-lisp` 805 kB, `cpp` 698 kB, `ApostilaPage` 675 kB, `wasm` 622 kB, `wardley`/`cytoscape` ~490/442 kB, `AdminPage` 444 kB, `pdf` + `jspdf` ~855 kB.
- Causa: Shiki carregando gramáticas de linguagens não usadas (emacs-lisp, cpp, wasm), Mermaid puxando `cytoscape` e diagramas exóticos (wardley), e `invoke-function` virando um chunk-guarda-chuva.
- Impacto: primeira carga lenta em 3G/celular antigo (iPhone 11 é público-alvo declarado), gasto de dados, PWA com precache de 5,2 MB.
- Correção: restringir as linguagens do Shiki a um conjunto fixo, carregar Mermaid/jsPDF/pdf sob demanda, e definir `manualChunks` para quebrar o `invoke-function`.

### 4. `AdminPage.tsx` com 3.603 linhas — MÉDIO
- Impacto: arquivo praticamente não editável com segurança; qualquer mudança tem alto risco de regressão e derruba a experiência de edição no celular.
- Correção: extrair por aba (apostilas, anúncios, usuários, RSS, patrocínio) para `src/components/admin/*`.

### 5. `SECURITY DEFINER` executável por anônimos — MÉDIO/ALTO
- 7 funções `SECURITY DEFINER` chamáveis sem login e 19 chamáveis por qualquer usuário logado (linter do banco, avisos 5–30).
- Impacto: funções que rodam com privilégio elevado podem ser invocadas diretamente pela API por quem não deveria (ex.: enumeração ou escrita indevida). É a categoria que já causou o incidente do `get_email_for_ra`.
- Correção: revisar função a função; `REVOKE EXECUTE ... FROM anon/authenticated` nas que só o servidor deve chamar.

### 6. Funções sem `search_path` fixo — MÉDIO
- 3 funções sem `SET search_path` (avisos 1–3).
- Impacto: vetor clássico de escalonamento via schema shadowing em funções `SECURITY DEFINER`.
- Correção: `ALTER FUNCTION ... SET search_path = public`.

### 7. Extensão instalada no schema `public` — BAIXO
- Provável `vector` (pgvector) em `public`.
- Impacto: expõe funções da extensão pela Data API; ruído no linter.
- Correção: mover para o schema `extensions` (requer cuidado com colunas `vector` existentes).

### 8. `ra-auth` com `verify_jwt = false` e rate limit inexistente — ALTO
- Arquivo: `supabase/functions/ra-auth/index.ts` + `supabase/config.toml`.
- Causa: a função é pública por necessidade (login), mas o próprio código comenta que o "rate limiting básico por IP" não persiste entre instâncias — ou seja, não existe na prática.
- Impacto: força bruta de senha por RA sem travamento efetivo do lado do servidor.
- Correção: contador persistido no banco por RA+IP com bloqueio temporário, ou Turnstile/hCaptcha no login.

### 9. CORS `*` em funções sensíveis — MÉDIO
- `ra-auth` (e o padrão replicado nas demais funções) usa `Access-Control-Allow-Origin: *`.
- Impacto: qualquer site pode postar tentativas de login contra o endpoint, amplificando o item 8.
- Correção: allowlist com o domínio publicado, o domínio de preview e `localhost`.

### 10. Avisos do PWA/Workbox — BAIXO
- Build reporta glob `registerSW.js` sem correspondência e precache de 5.259 kB.
- Impacto: instalação do PWA baixa >5 MB; possível ruído no service worker.
- Correção: ajustar `globPatterns` e excluir chunks pesados de baixo uso do precache.

## Pontos verificados e considerados saudáveis
- `ProtectedRoute` trata corretamente hidratação de sessão, bloqueio de conta, `adminOnly` e `content_scope=enem_only`, com preservação de deep link via `?next=`.
- Todo `dangerouslySetInnerHTML` do app passa por DOMPurify (`ApostilaContentRenderer`, `InAppNewsReader`) com `FORBID_TAGS`/`FORBID_ATTR` adequados.
- Papéis ficam em `user_roles` com `has_role()` `SECURITY DEFINER` — sem risco de escalonamento via `profiles`.
- Nenhum vazamento de `service_role` no código do cliente; `main.tsx` já bloqueia persistência de senha em `localStorage`.
- Camada de segurança da Ella (`ella-chat/security.ts`) é default-deny, com catálogo filtrado por papel e auditoria de recusas.
- Nenhum erro de console registrado no preview atual.

## Riscos que o build não pega
- 616 `any` mascarando mudanças de contrato das APIs de IA e RSS — quebram só em runtime, com o usuário na frente.
- Testes desatualizados (item 1): o `ApostilaCoverCard` mudou e a suíte deixou de proteger regressões de layout de capa.
- Permissões do banco: o Vite não sabe nada de RLS/`GRANT`; itens 5, 6 e 8 só aparecem em produção, como abuso.
- Peso do bundle: build "verde" com 5 MB de precache é falha de experiência, não de compilação.

## Próximo passo sugerido (para aprovar depois)
Ordem recomendada de correção: 8 e 9 (abuso de login) → 5 e 6 (privilégios do banco) → 1 (testes) → 3 e 10 (performance/PWA) → 2 e 4 (dívida técnica).
