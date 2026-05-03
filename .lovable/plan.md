Vou corrigir o problema de sessão que está causando o “entra e desloga”.

Diagnóstico
- O app hoje usa um cache local próprio (`decode_session_cache`) em `src/hooks/useAuth.tsx` para restaurar `user` e `isAdmin` antes de confirmar a sessão real no backend.
- Isso pode deixar a interface acreditando que o usuário está logado quando a sessão real ainda não existe ou ainda não foi restaurada.
- Nesse intervalo, páginas protegidas e hooks começam a rodar com um `user.id` em cache, mas as requisições saem anônimas. O snapshot de rede confirma isso: chamadas com `authorization` anônimo enquanto o app ainda tenta usar um `user_id`.
- Quando `getSession()` finalmente retorna `null`, o provider limpa o usuário e a rota protegida manda de volta para `/login`. É esse “entra e me desloga”.
- Há também sinais de contenção no lock de autenticação no navegador, o que piora a instabilidade durante a inicialização.

Plano
1. Reescrever a inicialização do `AuthProvider`
- Remover o `decode_session_cache` como fonte de verdade para `user`.
- Fazer o provider depender primeiro da sessão real do backend.
- Manter `loading=true` até a checagem inicial terminar de forma confiável.
- Só liberar rotas protegidas depois de confirmar sessão válida.

2. Separar cache visual de autenticação real
- Se necessário, manter cache apenas para pequenos detalhes de UI, como `isAdmin`, nunca para autenticar usuário.
- Garantir que `user`, `session` e redirects dependam apenas da sessão real.

3. Blindar o fluxo de login
- Ajustar o `LoginPage` para navegar apenas com estado de autenticação estável.
- Evitar corrida entre `signIn`, `onAuthStateChange` e `getSession()`.
- Garantir que, após login bem-sucedido, o app não renderize uma área protegida com sessão indefinida.

4. Endurecer a proteção das rotas
- Ajustar `ProtectedRoute` para esperar o bootstrap do auth terminar antes de decidir redirecionamento.
- Evitar bounce para `/login` enquanto a sessão ainda estiver em restauração.

5. Revisar o lock biométrico e logout indireto
- Verificar o fluxo `BiometricLockGate` / `AppLock` para garantir que ele não force ida ao login em cenários normais de restauração de sessão.
- Manter redirecionamento para login apenas quando a sessão realmente expirou ou o usuário escolheu sair.

6. Reduzir contenção do auth lock
- Minimizar chamadas concorrentes que dependem da sessão durante o boot.
- Aproveitar melhor `useAuth()` nos hooks iniciais para evitar múltiplas leituras simultâneas de sessão.

Resultado esperado
- O usuário entra e permanece logado.
- Não haverá mais “flash” de área interna seguido de retorno ao login.
- As rotas protegidas só abrirão quando a sessão estiver validada.
- O estado de admin e perfil continuará funcionando sem quebrar o que já foi feito.

Detalhes técnicos
- Arquivos principais:
  - `src/hooks/useAuth.tsx`
  - `src/components/ProtectedRoute.tsx`
  - `src/pages/LoginPage.tsx`
  - `src/components/BiometricLockGate.tsx`
  - `src/components/AppLock.tsx`
- Não pretendo remover funcionalidades existentes; a correção será focada em estabilidade do login e persistência correta da sessão.

Se você aprovar, eu implemento essa correção agora.