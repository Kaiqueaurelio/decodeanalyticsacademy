import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login', { replace: true });
    toast.warning('Sua sessão foi encerrada por inatividade. Faça login novamente para continuar.', {
      duration: 8000,
    });
  }, [signOut, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [handleLogout]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);
}
