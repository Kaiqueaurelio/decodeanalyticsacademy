import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { safeRefreshSession, setCurrentSession } from '@/lib/auth-session';

const ROLE_CACHE_KEY = 'decode_role_cache';

type RoleCache = { userId: string; isAdmin: boolean };
export type AuthStatus = 'loading' | 'hydrating' | 'authenticated' | 'unauthenticated';

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  status: AuthStatus;
  isSessionHydrated: boolean;
  roleChecked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

function readRoleCache(): RoleCache | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.isAdmin === 'boolean') {
      return parsed;
    }
  } catch {}
  return null;
}

function writeRoleCache(userId: string | null, isAdmin: boolean) {
  try {
    if (!userId) {
      localStorage.removeItem(ROLE_CACHE_KEY);
      return;
    }
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, isAdmin }));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  const mountedRef = useRef(true);
  const bootstrappedRef = useRef(false);
  const lastRoleUserIdRef = useRef<string | null>(null);

  const loading = status === 'loading' || status === 'hydrating';

  const logAuthFlow = (event: string, extra: Record<string, unknown> = {}) => {
    if (!import.meta.env.DEV) return;
    console.log('[AUTH FLOW]', {
      event,
      timestamp: Date.now(),
      ...extra,
    });
  };

  const checkRoles = async (userId: string, attempt = 0): Promise<boolean> => {
    try {
      const [adminRes, profileRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
        supabase.from('profiles').select('is_blocked').eq('user_id', userId).maybeSingle(),
      ]);

      if ((adminRes.error || profileRes.error) && attempt < 1) {
        return await new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(checkRoles(userId, attempt + 1)), 500);
        });
      }

      if (!mountedRef.current) return false;

      const adminValue = Boolean(adminRes.data);
      const blockedValue = Boolean((profileRes.data as { is_blocked?: boolean } | null)?.is_blocked);

      setIsAdmin(adminValue);
      setIsBlocked(blockedValue);
      setRoleChecked(true);
      writeRoleCache(userId, adminValue);

      logAuthFlow('role_resolved', {
        userId,
        isAdmin: adminValue,
        isBlocked: blockedValue,
      });

      return adminValue;
    } catch (error) {
      if (!mountedRef.current) return false;
      setRoleChecked(true);
      logAuthFlow('role_resolution_error', {
        userId,
        message: error instanceof Error ? error.message : 'unknown error',
      });
      return false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    logAuthFlow('provider_init');
    setStatus('hydrating');

    // CORREÇÃO: Removido o removeItem do session_cache que causava logout no PC
    // try {
    //   localStorage.removeItem('decode_session_cache');
    // } catch {}

    const applySession = (nextSession: Session | null, source: 'bootstrap' | 'listener', authEvent?: string) => {
      if (!mountedRef.current) return;

      const nextUser = nextSession?.user ?? null;
      const nextStatus: AuthStatus = nextUser
        ? 'authenticated'
        : bootstrappedRef.current
          ? 'unauthenticated'
          : 'hydrating';

      setCurrentSession(nextSession);
      setSession(nextSession);
      setUser(nextUser);
      setStatus(nextStatus);
      // BUGFIX: quando source === 'bootstrap', bootstrappedRef.current já foi setado
      // para true ANTES de chamar applySession. Para o listener disparado antes do
      // bootstrap (ex: SIGNED_IN imediato), usamos bootstrappedRef.current que ainda
      // pode ser false — nesse caso forçamos true pois o listener só chega após init.
      setIsSessionHydrated(source === 'bootstrap' ? true : bootstrappedRef.current);

      if (nextUser) {
        const cachedRole = readRoleCache();
        if (cachedRole?.userId === nextUser.id) {
          setIsAdmin(cachedRole.isAdmin);
          setRoleChecked(true);
        } else {
          setIsAdmin(false);
          setIsBlocked(false);
          setRoleChecked(false);
        }

        if (lastRoleUserIdRef.current !== nextUser.id || authEvent === 'SIGNED_IN') {
          lastRoleUserIdRef.current = nextUser.id;
          queueMicrotask(() => {
            void checkRoles(nextUser.id);
          });
        }
      } else {
        lastRoleUserIdRef.current = null;
        setIsAdmin(false);
        setIsBlocked(false);
        setRoleChecked(true);
        writeRoleCache(null, false);
      }

      logAuthFlow('state_change', {
        source,
        authEvent: authEvent ?? null,
        status: nextStatus,
        hasSession: Boolean(nextSession),
        userId: nextUser?.id ?? null,
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((authEvent, nextSession) => {
      applySession(nextSession, 'listener', authEvent);
    });

    void supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (!mountedRef.current) return;
        bootstrappedRef.current = true;

        if (error) {
          setCurrentSession(null);
          setSession(null);
          setUser(null);
          setStatus('unauthenticated');
          setRoleChecked(true);
          setIsSessionHydrated(true);
          logAuthFlow('bootstrap_error', { message: error.message });
          return;
        }

        // Boot refresh: se a sessão guardada está expirada ou prestes a expirar
        // (<5min), tenta renovar imediatamente usando o refresh_token persistido.
        // Isso mantém o usuário logado mesmo após dias/semanas sem abrir o app,
        // contanto que o refresh_token ainda esteja dentro da janela do servidor.
        let boot = data.session ?? null;
        if (boot?.refresh_token) {
          const expiresAt = boot.expires_at ? boot.expires_at * 1000 : 0;
          const msLeft = expiresAt - Date.now();
          if (msLeft < 5 * 60 * 1000) {
            try {
              const refreshed = await safeRefreshSession(boot.refresh_token);
              if (refreshed) boot = refreshed;
            } catch (err) {
              logAuthFlow('bootstrap_refresh_error', {
                message: err instanceof Error ? err.message : 'unknown',
              });
            }
          }
        }

        applySession(boot, 'bootstrap', 'INITIAL_SESSION');
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        bootstrappedRef.current = true;
        setCurrentSession(null);
        setSession(null);
        setUser(null);
        setStatus('unauthenticated');
        setRoleChecked(true);
        setIsSessionHydrated(true);
        logAuthFlow('bootstrap_exception', {
          message: error instanceof Error ? error.message : 'unknown error',
        });
      });

    // Cross-tab sync: quando outra aba faz login/logout, o supabase-js grava
    // no localStorage. Reagimos aqui para refletir imediatamente nesta aba
    // sem precisar de F5.
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith('sb-') || !e.key.endsWith('-auth-token')) return;
      supabase.auth.getSession().then(({ data }) => {
        if (!mountedRef.current) return;
        applySession(data.session ?? null, 'storage_sync', 'TOKEN_REFRESHED');
      }).catch(() => {});
    };
    window.addEventListener('storage', onStorage);


    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      logAuthFlow('provider_cleanup');
    };
  }, []);

  // Keepalive: renova o token proativamente para manter o usuário logado
  // mesmo após dias sem abrir o app. Dispara no retorno de visibilidade,
  // foco da janela e a cada 10 min. Só refresca se o token está perto de expirar.
  useEffect(() => {
    if (!session?.refresh_token) return;

    const maybeRefresh = async () => {
      try {
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const msLeft = expiresAt - Date.now();
        if (msLeft > 10 * 60 * 1000) return;
        await safeRefreshSession(session.refresh_token);
      } catch (err) {
        logAuthFlow('keepalive_refresh_error', {
          message: err instanceof Error ? err.message : 'unknown',
        });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void maybeRefresh();
    };
    const onFocus = () => void maybeRefresh();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    const heartbeat = window.setInterval(() => void maybeRefresh(), 10 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(heartbeat);
    };
  }, [session?.refresh_token, session?.expires_at]);

  const signIn = async (email: string, password: string) => {
    logAuthFlow('sign_in_attempt', { email });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    logAuthFlow(error ? 'sign_in_error' : 'sign_in_success', {
      email,
      message: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    logAuthFlow('sign_up_attempt', { email });
    const { error } = await supabase.auth.signUp({ email, password });
    logAuthFlow(error ? 'sign_up_error' : 'sign_up_success', {
      email,
      message: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    logAuthFlow('explicit_sign_out_start');
    writeRoleCache(null, false);
    lastRoleUserIdRef.current = null;
    await supabase.auth.signOut();
    logAuthFlow('explicit_sign_out_done');
  };

  const refreshSession = async () => {
    logAuthFlow('refresh_requested', {
      currentStatus: status,
      hasSession: Boolean(session),
    });
    return safeRefreshSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isBlocked,
        loading,
        status,
        isSessionHydrated,
        roleChecked,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
