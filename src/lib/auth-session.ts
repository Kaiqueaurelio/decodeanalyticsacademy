/**
 * Cache em memória do access_token / sessão atual.
 *
 * Por que existe: o supabase-js JÁ faz auto-refresh em background. Quando vários
 * componentes chamam `supabase.auth.getSession()` ao mesmo tempo (header, chat,
 * upload, biometric toggle, edge invoke), o LockManager interno acaba serializando
 * tudo e — em alguns navegadores desktop — dispara uma cascata de refresh que
 * estoura o rate limit (`429`). Isso fazia o app "logar e cair" repetidamente.
 *
 * Solução: o `useAuth` registra UM listener `onAuthStateChange` e publica aqui
 * a sessão mais recente. Quem precisar do token (edge functions, fetch direto)
 * lê deste cache — sem nunca tocar em `getSession()` de novo.
 */
import type { Session } from '@supabase/supabase-js';

let current: Session | null = null;

export function setCurrentSession(sess: Session | null) {
  current = sess;
}

export function getCurrentSession(): Session | null {
  return current;
}

export function getCurrentAccessToken(): string | null {
  return current?.access_token ?? null;
}
