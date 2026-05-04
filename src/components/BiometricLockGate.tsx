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

  // Decide o lock SOMENTE depois do bootstrap do auth terminar.
  // Isso evita o "lock fantasma" no PC quando a sessão ainda está hidratando.
  useEffect(() => {
    if (!isSessionHydrated || status === 'loading') return;
    
    // DESATIVADO: A biometria está causando logouts falsos no PC após reloads.
    // Forçamos o desbloqueio para estabilizar a plataforma.
    setLocked(false);
    sessionStorage.setItem(STORAGE_KEY, 'unlocked');

    /*
    if (!isBiometricEnabled()) {
      setLocked(false);
      return;
    }
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, 'unlocked');
      setLocked(false);
    }
    */
  }, [isSessionHydrated, status, user]);

  // DESATIVADO: A trava de inatividade estava causando frustração no PC.
  /*
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
  */

  const handleUnlock = () => {
    sessionStorage.setItem(STORAGE_KEY, 'unlocked');
    setLocked(false);
  };

  // Nunca travamos o app via biometria por enquanto para estabilizar a plataforma.
  if (false && locked && isBiometricEnabled()) {
    return <AppLock onUnlock={handleUnlock} />;
  }

  return <>{children}</>;
}
