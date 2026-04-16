import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isBiometricEnabled } from '@/hooks/useBiometricAuth';
import { AppLock } from '@/components/AppLock';

const LOCK_AFTER_MS = 5 * 60 * 1000; // 5 min hidden = lock
const STORAGE_KEY = 'decode_app_locked';

/**
 * Locks the app behind biometry when:
 *  - Cold start (page reload) + biometric enabled + no active supabase session yet
 *  - Tab hidden for 5+ minutes
 */
export function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(() => {
    return isBiometricEnabled() && sessionStorage.getItem(STORAGE_KEY) !== 'unlocked';
  });

  // On cold start: if biometric enabled but supabase has no session after auth check, lock.
  useEffect(() => {
    if (loading) return;
    if (!isBiometricEnabled()) {
      setLocked(false);
      return;
    }
    if (!user) {
      // No active session AND biometry enabled → require unlock
      setLocked(true);
    }
  }, [loading, user]);

  // Lock again on prolonged hide
  useEffect(() => {
    if (!isBiometricEnabled()) return;
    let hiddenAt: number | null = null;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt) {
        if (Date.now() - hiddenAt >= LOCK_AFTER_MS) {
          sessionStorage.removeItem(STORAGE_KEY);
          setLocked(true);
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem(STORAGE_KEY, 'unlocked');
    setLocked(false);
  };

  if (locked && isBiometricEnabled()) {
    return <AppLock onUnlock={handleUnlock} />;
  }

  return <>{children}</>;
}
