# Plano de correção

## Problema identificado
O problema principal não é “login inválido”, e sim uma instabilidade de sessão no navegador do PC.

Encontrei estes sinais claros:
- Os logs de autenticação mostram uma tempestade de refresh token em sequência no endpoint `/token`, seguida de `429: Request rate limit reached`.
- Isso explica o comportamento “entra, fica alguns minutos, cai de novo”. Quando o refresh entra em disputa/repetição, a sessão acaba sendo invalidada visualmente e o app volta para `/login`.
- O botão Admin some porque algumas telas e o header decidem usando `isAdmin` antes do papel terminar de carregar com segurança.

## O que vou corrigir

### 1) Blindar a restauração e manutenção da sessão
Arquivos principais:
- `src/hooks/useAuth.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`

Ajustes:
- Transformar `useAuth` no único ponto de verdade da sessão, sem reprocessamentos que possam disparar cascatas de refresh.
- Endurecer o bootstrap para evitar transições intermediárias `user -> null -> user` que fazem a UI “achar” que houve logout.
- Separar melhor os estados `loading`, `session hydrated`, `role loading` e `signed out`.
- Garantir que a navegação pós-login só aconteça depois da sessão estar realmente estável, e não apenas após o retorno do `signIn()`.
- Evitar que um evento transitório de auth derrube imediatamente o usuário para `/login`.

### 2) Eliminar pontos que podem amplificar refresh/token race no desktop
Arquivos principais:
- `src/components/AppLock.tsx`
- `src/components/BiometricLockGate.tsx`
- `src/components/BiometricOnboarding.tsx`
- `src/components/BiometricToggle.tsx`
- `src/components/ApostilaChat.tsx`
- possíveis consumidores adicionais de `supabase.auth.getSession()`

Ajustes:
- Remover dependência de chamadas soltas de `getSession()` em componentes que só precisam do token/sessão atual.
- Fazer esses componentes reutilizarem a sessão já mantida pelo contexto de autenticação.
- Revisar o fluxo biométrico no desktop para impedir refresh manual redundante ou restauração indevida de sessão.
- Evitar que o cold start com biometria ligada produza lock/restauração concorrente com o bootstrap normal.
- Se necessário, adicionar proteção anti-duplicação para impedir múltiplas tentativas simultâneas de refresh/desbloqueio.

### 3) Corrigir o desaparecimento do botão Admin
Arquivos principais:
- `src/components/AppHeader.tsx`
- `src/pages/DashboardPage.tsx`
- qualquer outra tela que use `isAdmin` diretamente

Ajustes:
- Fazer o header e as telas aguardarem `roleChecked` antes de decidir esconder ações administrativas.
- Manter o último estado visual válido durante a revalidação de papel, evitando flicker.
- Garantir consistência entre header, dashboard e rotas protegidas.

### 4) Reduzir logout “fantasma” causado por lógica paralela de segurança
Arquivos principais:
- `src/hooks/useInactivityLogout.tsx`
- `src/components/BiometricLockGate.tsx`
- `src/components/AppLock.tsx`

Ajustes:
- Confirmar que o logout por inatividade só possa rodar quando a sessão estiver plenamente estável.
- Impedir que bloqueio biométrico, signOut manual e redirecionamento concorram entre si.
- Tratar melhor cenários de aba oculta, retorno ao foco e restauração de sessão no desktop.

## Resultado esperado
Depois dessa correção:
- o usuário continua logado no PC sem cair sozinho após alguns minutos;
- o app para de entrar em ciclo de login/logout;
- o botão Admin permanece visível de forma consistente para conta admin;
- o fluxo biométrico deixa de interferir na sessão normal.

## Detalhes técnicos
- A evidência principal é o padrão de múltiplos refreshes seguidos com revogação/rotação de token e estouro de limite (`429`) no backend de autenticação.
- O comportamento é compatível com corrida de sessão em navegador desktop, especialmente quando existem múltiplos consumidores consultando/restaurando sessão em paralelo.
- Vou concentrar leitura de sessão no contexto de auth e fazer os demais pontos consumirem esse estado já resolvido.

## Validação após implementar
Vou validar estes cenários:
1. Login no PC e permanência autenticada por vários minutos.
2. Reload da página sem cair para `/login`.
3. Navegação entre páginas autenticadas sem flicker de sessão.
4. Presença estável do botão Admin no header e no dashboard.
5. Fluxo com biometria habilitada e desabilitada.
6. Verificação de que a tempestade de refresh/token não volta a acontecer.

Se você aprovar, eu implemento essa correção agora.