import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isBiometricEnabled, refreshBiometricToken } from '@/hooks/useBiometricAuth';
import { setCurrentSession } from '@/lib/auth-session';

/**
 * IMPORTANTE — Política de sessão
 *
 * Aprendemos na prática que NUNCA devemos restaurar `user`/`session` a partir
 * de um cache local arbitrário (ex: localStorage 'decode_session_cache').
 * Isso causava o bug "entra e desloga": o app fingia estar logado, hooks
 * disparavam queries em paralelo (cada um chamando getSession), o lock interno
 * do gotrue-js saturava e os refresh_token vinham com 429. Ao primeiro
 * SIGNED_OUT vindo do servidor, a UI empurrava o usuário de volta ao /login.
 *
 * A única fonte de verdade aqui é `supabase.auth`:
 *   1. Registramos `onAuthStateChange` ANTES de qualquer outra coisa.
 *   2. Em seguida chamamos `getSession()` uma única vez para hidratar o estado.
 *   3. `loading` só vira false depois desse bootstrap terminar.
 *
 * O cache local ainda é usado APENAS para lembrar o `isAdmin` e evitar um
 * "flicker" no header — nunca para autenticar o usuário.
 */

const ROLE_CACHE_KEY = 'decode_role_cache';

type RoleCache = { userId: string; isAdmin: boolean };

function readRoleCache(): RoleCache | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.isAdmin === 'boolean') {
      return parsed;
    }
    return null;
  } catch { return null; }
}

function writeRoleCache(userId: string | null, isAdmin: boolean) {
  try {
    if (!userId) localStorage.removeItem(ROLE_CACHE_KEY);
    else localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, isAdmin }));
  } catch { /* storage cheio? ignorar */ }
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isSessionHydrated: boolean;
  roleChecked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  // Evita rechecagem de role para o mesmo usuário em cada TOKEN_REFRESHED.
  const lastRoleUserId = useRef<string | null>(null);
  const bootstrapped = useRef(false);

  const checkRoles = async (userId: string, attempt = 0): Promise<boolean> => {
    try {
      const [adminRes, profileRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
        supabase.from('profiles').select('is_blocked').eq('user_id', userId).maybeSingle(),
      ]);
      // Erro de rede/RLS → não rebaixa privilégio. Tenta de novo (1x) com backoff curto.
      if ((adminRes.error || profileRes.error) && attempt < 1) {
        return await new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(checkRoles(userId, attempt + 1)), 600);
        });
      }
      const adminVal = !!adminRes.data;
      setIsAdmin(adminVal);
      setIsBlocked(!!(profileRes.data as any)?.is_blocked);
      setRoleChecked(true);
      writeRoleCache(userId, adminVal);
      return adminVal;
    } catch {
      // Em caso de erro inesperado, mantemos o cache visual (não derrubamos o botão Admin).
      setRoleChecked(true);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const applySession = (sess: Session | null, source: string, event?: string) => {
      if (!mounted) return;

      setCurrentSession(sess);
      setSession(sess);
      setUser(sess?.user ?? null);

      const nextStatus = sess?.user ? 'authenticated' : 'unauthenticated';
      setStatus(nextStatus);

      console.log('[AUTH]', {
        event: 'session_update',
        source,
        authEvent: event ?? null,
        timestamp: Date.now(),
        status: nextStatus,
        hasSession: Boolean(sess),
        userId: sess?.user?.id ?? null,
      });

      if (sess?.user) {
        const cached = readRoleCache();
        if (cached?.userId === sess.user.id) {
          setIsAdmin(cached.isAdmin);
          setRoleChecked(true);
        } else {
          setRoleChecked(false);
        }

        if (lastRoleUserId.current !== sess.user.id || event === 'SIGNED_IN') {
          lastRoleUserId.current = sess.user.id;
          setTimeout(() => { void checkRoles(sess.user.id); }, 0);
        }

        if (isBiometricEnabled() && sess.refresh_token) {
          setTimeout(() => { refreshBiometricToken(sess.refresh_token!).catch(() => {}); }, 0);
        }
      } else {
        lastRoleUserId.current = null;
        setIsAdmin(false);
        setIsBlocked(false);
        setRoleChecked(true);
        writeRoleCache(null, false);
      }

      if (bootstrapped.current) {
        setIsSessionHydrated(true);
        setLoading(false);
      }
    };

    // Limpa cache legado que decidia auth no client (causava "entra e desloga").
    try { localStorage.removeItem('decode_session_cache'); } catch {}

    // 1) Listener PRIMEIRO — recomendação oficial Supabase para evitar perda de eventos.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;

      console.log('[AUTH]', {
        event: 'auth_state_change',
        authEvent: event,
        timestamp: Date.now(),
        hasSession: Boolean(sess),
        userId: sess?.user?.id ?? null,
      });

      applySession(sess, 'listener', event);
    });

    // 2) DEPOIS hidratamos a sessão atual (uma única vez).
    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => {
        if (!mounted) return;
        bootstrapped.current = true;
        setIsSessionHydrated(true);
        applySession(sess, 'bootstrap', 'INITIAL_SESSION');
      })
      .catch(() => {
        if (!mounted) return;
        bootstrapped.current = true;
        setStatus('unauthenticated');
        setCurrentSession(null);
        setSession(null);
        setUser(null);
        setRoleChecked(true);
        setIsSessionHydrated(true);
        setLoading(false);
        console.log('[AUTH]', {
          event: 'bootstrap_error',
          timestamp: Date.now(),
        });
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[AUTH]', { event: 'sign_in_attempt', timestamp: Date.now() });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[AUTH]', {
      event: error ? 'sign_in_error' : 'sign_in_success',
      timestamp: Date.now(),
      message: error?.message ?? null,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    console.log('[AUTH]', { event: 'sign_out_start', timestamp: Date.now() });
    writeRoleCache(null, false);
    lastRoleUserId.current = null;
    setCurrentSession(null);
    setStatus('unauthenticated');
    await supabase.auth.signOut();
    console.log('[AUTH]', { event: 'sign_out_done', timestamp: Date.now() });
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isBlocked, loading, status, isSessionHydrated, roleChecked, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
