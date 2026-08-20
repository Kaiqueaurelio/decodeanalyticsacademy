import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isBiometricEnabled } from '@/hooks/useBiometricAuth';
import { AppLock } from '@/components/AppLock';

const LOCK_AFTER_MS = 5 * 60 * 1000; // 5 min hidden = lock
const STORAGE_KEY = 'decode_app_locked';

/**
 * Locks the app behind biometry when:
 *  - Cold start (page reload) + biometric enabled + nenhuma sessão Supabase
 *    (evita travar em "logout falso" durante refresh do token).
 *  - Aba escondida por 5+ minutos.
 *
 * IMPORTANTE: nunca tratamos `user === null` momentâneo como motivo para
 * bloquear o app. Só consideramos "sem sessão" depois de uma janela de
 * estabilização — caso contrário o gate engana o usuário pensando que ele
 * foi deslogado.
 */
export function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const { user, status, isSessionHydrated } = useAuth();
  const [locked, setLocked] = useState(() => {
    return isBiometricEnabled() && sessionStorage.getItem(STORAGE_KEY) !== 'unlocked';
  });

  // Decide o lock somente depois do bootstrap do auth terminar.
  // Sessões não autenticadas nunca ficam presas no gate biométrico.
  useEffect(() => {
    if (!isSessionHydrated || status === 'loading') return;

    if (!user || !isBiometricEnabled()) {
      sessionStorage.removeItem(STORAGE_KEY);
      setLocked(false);
      return;
    }

    setLocked(sessionStorage.getItem(STORAGE_KEY) !== 'unlocked');
  }, [isSessionHydrated, status, user]);

  // Bloqueia novamente a sessão biométrica após um período prolongado fora da aba.
  useEffect(() => {
    if (!isSessionHydrated || !user || !isBiometricEnabled()) return;
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
  }, [isSessionHydrated, user]);

  const handleUnlock = () => {
    sessionStorage.setItem(STORAGE_KEY, 'unlocked');
    setLocked(false);
  };

  if (user && locked && isBiometricEnabled()) {
    return <AppLock onUnlock={handleUnlock} />;
  }

  return <>{children}</>;
}
