import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isBiometricEnabled, refreshBiometricToken } from '@/hooks/useBiometricAuth';

const SESSION_CACHE_KEY = 'decode_session_cache';

function getCachedSession(): { user: User; isAdmin: boolean } | null {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setCachedSession(user: User | null, isAdmin: boolean) {
  if (user) {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user, isAdmin }));
  } else {
    localStorage.removeItem(SESSION_CACHE_KEY);
  }
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  roleChecked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = getCachedSession();
  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(cached?.isAdmin ?? false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(!cached);
  const [roleChecked, setRoleChecked] = useState(!!cached);

  const checkRoles = async (userId: string) => {
    try {
      const [adminRes, profileRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
        supabase.from('profiles').select('is_blocked').eq('user_id', userId).maybeSingle(),
      ]);
      const adminVal = !!adminRes.data;
      setIsAdmin(adminVal);
      setIsBlocked(!!(profileRes.data as any)?.is_blocked);
      setRoleChecked(true);
      return adminVal;
    } catch {
      setIsAdmin(false);
      setIsBlocked(false);
      setRoleChecked(true);
      return false;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setUser(sess.user);
        // Only re-check roles if user changed or on initial sign-in
        if (!user || user.id !== sess.user.id || _event === 'SIGNED_IN') {
          setTimeout(() => {
            checkRoles(sess.user.id).then((adminVal) => {
              setCachedSession(sess.user, adminVal);
            });
          }, 0);
        } else {
          // Same user, just token refresh — update cache silently
          setCachedSession(sess.user, isAdmin);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsBlocked(false);
        setRoleChecked(true);
        setCachedSession(null, false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        checkRoles(sess.user.id).then((adminVal) => {
          setCachedSession(sess.user, adminVal);
          setLoading(false);
        });
      } else {
        setRoleChecked(true);
        setCachedSession(null, false);
        setLoading(false);
      }
    }).catch(() => {
      setCachedSession(null, false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setCachedSession(null, false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isBlocked, loading, roleChecked, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
