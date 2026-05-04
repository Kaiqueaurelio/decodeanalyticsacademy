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
import { supabase } from '@/integrations/supabase/client';

let current: Session | null = null;
let refreshPromise: Promise<Session | null> | null = null;

export function setCurrentSession(sess: Session | null) {
  current = sess;
}

export function getCurrentSession(): Session | null {
  return current;
}

export function getCurrentAccessToken(): string | null {
  return current?.access_token ?? null;
}

export async function safeRefreshSession(refreshToken?: string | null): Promise<Session | null> {
  if (refreshPromise) {
    console.log('[AUTH]', { event: 'refresh_join', timestamp: Date.now() });
    return refreshPromise;
  }

  console.log('[AUTH]', {
    event: 'refresh_start',
    timestamp: Date.now(),
    hasRefreshToken: Boolean(refreshToken),
  });

  refreshPromise = (async () => {
    const { data, error } = refreshToken
      ? await supabase.auth.refreshSession({ refresh_token: refreshToken })
      : await supabase.auth.refreshSession();

    if (error) {
      console.log('[AUTH]', {
        event: 'refresh_error',
        timestamp: Date.now(),
        message: error.message,
      });
      throw error;
    }

    const nextSession = data.session ?? null;
    setCurrentSession(nextSession);
    console.log('[AUTH]', {
      event: 'refresh_success',
      timestamp: Date.now(),
      hasSession: Boolean(nextSession),
      userId: nextSession?.user?.id ?? null,
    });
    return nextSession;
  })().finally(() => {
    console.log('[AUTH]', { event: 'refresh_settled', timestamp: Date.now() });
    refreshPromise = null;
  });

  return refreshPromise;
}
