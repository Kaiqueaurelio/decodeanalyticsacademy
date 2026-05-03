## Objetivo
Resolver de forma conjunta estes 3 problemas sem remover nada do que já existe:

1. Fórmulas e cálculos das apostilas ficam bagunçados.
2. O app ainda não permanece logado.
3. O botão Admin some às vezes, mesmo na conta administradora.

## O que está acontecendo hoje

### 1) Apostilas com cálculo
O `ApostilaContentRenderer` usa um parser próprio de Markdown/blocos e hoje não entende notação matemática. Então contas com frações, expoentes, raízes e equações acabam sendo tratadas como texto comum, ficando quebradas no layout do aluno.

### 2) Login que não persiste
A autenticação melhorou, mas ainda existem pontos do app que podem desestabilizar a sessão:

- `BiometricLockGate.tsx` hoje bloqueia o app quando `user` fica `null`, mesmo em cenários de restauração/transição da sessão. Isso pode simular “deslogou”.
- `AppLock.tsx` chama `getSession()`, `refreshSession()` e até `signOut()` em fluxos que podem acontecer durante recuperação da sessão.
- Há outros componentes que ainda chamam `supabase.auth.getSession()` diretamente em paralelo (`BiometricOnboarding`, `BiometricToggle`, `AdminBibliotecaPage`, `ApostilaChat`, `AIProviderSettings`). Isso aumenta contenção e pode piorar o boot do auth.
- `useInactivityLogout.tsx` fica globalmente ativo em todas as rotas autenticadas; vou revisar para garantir que ele não esteja disparando logout indevido em reload/restore.

### 3) Botão Admin sumindo
O problema está no acoplamento entre `isAdmin` e `roleChecked`:

- Em `AppHeader.tsx`, o botão depende só de `isAdmin`.
- Em `useAuth.tsx`, `roleChecked` pode ficar verdadeiro cedo demais por causa do cache visual ou por corrida entre bootstrap e checagem real de role.
- Resultado: a rota admin pode até continuar funcionando, mas o header às vezes renderiza sem o botão porque a role ainda não foi estabilizada naquele frame.

## Plano de implementação

### Etapa 1 — Blindar a autenticação como única fonte de verdade
Vou refinar `useAuth.tsx` para que:

- o bootstrap da sessão termine de forma determinística antes de liberar a UI protegida;
- `loading`, `roleChecked` e `isAdmin` sejam sincronizados sem “atalhos” que criem estado intermediário inconsistente;
- a checagem de role só marque como concluída quando a resposta real do backend chegar para o usuário atual;
- troca de usuário, refresh de token e restore de sessão não reaproveitem estado antigo.

### Etapa 2 — Corrigir o fluxo de bloqueio biométrico para não parecer logout
Vou ajustar:

- `src/components/BiometricLockGate.tsx`
- `src/components/AppLock.tsx`
- `src/components/BiometricOnboarding.tsx`
- `src/components/BiometricToggle.tsx`

Mudanças previstas:
- não bloquear só porque `user` está momentaneamente nulo durante restauração;
- separar melhor “app bloqueado” de “sessão expirada”;
- evitar `signOut()` automático em casos ambíguos de restore;
- usar o estado já fornecido por `useAuth()` sempre que possível, reduzindo chamadas paralelas de `getSession()`.

### Etapa 3 — Endurecer navegação e logout automático
Vou revisar:

- `src/components/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`
- `src/hooks/useInactivityLogout.tsx`
- `src/App.tsx`

Para garantir que:
- o app só redirecione para `/login` quando a sessão realmente estiver inválida;
- a página de login só navegue depois que a sessão estiver estável;
- o logout por inatividade não dispare em momentos errados do boot;
- restauração de rota (`RouteRestorer`) não brigue com o fluxo de autenticação.

### Etapa 4 — Fixar o botão Admin no header sem flicker
Vou ajustar `AppHeader.tsx` e o contrato do `useAuth()` para que o botão Admin:

- não desapareça durante checagem de role;
- respeite um estado de carregamento/estabilização antes de decidir esconder o botão;
- use cache apenas como apoio visual, nunca como decisão final de permissão.

Se necessário, o header passa a tratar explicitamente um estado “role carregando” em vez de assumir `isAdmin=false` cedo demais.

### Etapa 5 — Suporte real a fórmulas matemáticas nas apostilas
Vou adicionar renderização de matemática no fluxo das apostilas, mantendo compatibilidade com o que já existe.

Implementação prevista:
- suporte a `$...$` e `$$...$$` nas apostilas;
- renderização inline e em bloco para cálculos, frações, potências, raiz, somatório, integral etc.;
- fallback seguro quando a fórmula vier inválida;
- integração no preview do aluno e no preview do admin, já que ambos usam o mesmo renderer.

Arquivos principais:
- `src/components/ApostilaContentRenderer.tsx`
- `src/components/editor/StudentPreview.tsx`
- `src/lib/markdown-html.ts`
- possivelmente um novo utilitário de render de matemática
- `package.json` para a dependência de fórmulas

## Resultado esperado
Após a implementação:

- o usuário entra e continua logado normalmente;
- o app não “desloga sozinho” no restore;
- o bloqueio biométrico não será confundido com logout;
- o botão Admin ficará consistente para a conta administradora;
- apostilas com cálculos e expressões matemáticas serão exibidas corretamente para o aluno.

## Detalhes técnicos
Arquivos com maior chance de mudança:

- `src/hooks/useAuth.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/AppHeader.tsx`
- `src/components/BiometricLockGate.tsx`
- `src/components/AppLock.tsx`
- `src/components/BiometricOnboarding.tsx`
- `src/components/BiometricToggle.tsx`
- `src/hooks/useInactivityLogout.tsx`
- `src/components/ApostilaContentRenderer.tsx`
- `src/lib/markdown-html.ts`
- `package.json`

Não vou remover funcionalidades já criadas; a correção será focada em estabilidade, consistência visual e compatibilidade com o conteúdo existente.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>
<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>