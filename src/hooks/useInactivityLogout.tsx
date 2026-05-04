import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 min — mais conservador, evita logouts surpresa

export function useInactivityLogout() {
  // CORREÇÃO: Desativado permanentemente para evitar logouts automáticos no PC
  const DISABLED_FOR_SESSION_HOTFIX = true;
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    if (DISABLED_FOR_SESSION_HOTFIX) return;
    await signOut();
    navigate('/login', { replace: true });
    toast.warning('Sua sessão foi encerrada por inatividade. Faça login novamente para continuar.', {
      duration: 8000,
    });
  }, [signOut, navigate]);

  const resetTimer = useCallback(() => {
    if (DISABLED_FOR_SESSION_HOTFIX) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [handleLogout]);

  useEffect(() => {
    if (DISABLED_FOR_SESSION_HOTFIX) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Só ativa o cronômetro depois que o auth bootstrapou e existe usuário.
    if (loading || !user) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, loading, resetTimer]);
}
