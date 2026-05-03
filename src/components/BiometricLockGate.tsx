import { useEffect, useRef, useState } from 'react';
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
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(() => {
    // Só bloqueia no cold start se biometria está ativa E o usuário não
    // marcou a sessão como "destrancada" neste tab.
    return isBiometricEnabled() && sessionStorage.getItem(STORAGE_KEY) !== 'unlocked';
  });
  const stabilizeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Marca como destrancado assim que aparecer um usuário válido — isso evita
  // o "loop de lock" se a sessão restaurar normalmente após o cold start.
  useEffect(() => {
    if (loading) return;
    if (!isBiometricEnabled()) {
      setLocked(false);
      return;
    }
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, 'unlocked');
      setLocked(false);
      if (stabilizeRef.current) clearTimeout(stabilizeRef.current);
      stabilizeRef.current = null;
    }
    // Se !user, NÃO bloqueamos imediatamente. ProtectedRoute já redireciona
    // para /login quando o backend confirma "sem sessão".
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
