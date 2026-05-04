import { useState } from 'react';
import { Fingerprint, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { verifyBiometric, disableBiometric, getBiometricEmail, refreshBiometricToken } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.jpeg';

interface AppLockProps {
  onUnlock: () => void;
}

export function AppLock({ onUnlock }: AppLockProps) {
  const [verifying, setVerifying] = useState(false);
  const email = getBiometricEmail();

  const handleUnlock = async () => {
    if (verifying) return; // evita duplo clique → duplo refresh
    setVerifying(true);
    try {
      // 1) Confirma biometria primeiro (sem usar o refresh token ainda)
      const storedRefreshToken = await verifyBiometric();

      // 2) Se já existe sessão válida em memória (auto-refresh do supabase-js
      //    já restaurou), basta desbloquear — NÃO chamar refreshSession aqui,
      //    isso causava cascata de /token e estouro de rate limit.
      const { getCurrentSession } = await import('@/lib/auth-session');
      const currentSession = getCurrentSession();
      if (currentSession?.user) {
        if (currentSession.refresh_token) {
          await refreshBiometricToken(currentSession.refresh_token).catch(() => {});
        }
        toast.success('Desbloqueado!');
        onUnlock();
        return;
      }

      // 3) Sem sessão ativa em memória → último recurso: tenta restaurar com
      //    o refresh token criptografado guardado na biometria.
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: storedRefreshToken });
      if (error) throw error;

      if (data.session?.refresh_token) {
        await refreshBiometricToken(data.session.refresh_token).catch(() => {});
      }

      toast.success('Desbloqueado!');
      onUnlock();
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('refresh token') || msg.includes('not found') || msg.includes('expired') || msg.includes('invalid')) {
        disableBiometric();
        await supabase.auth.signOut().catch(() => {});
        toast.error('Sua sessão expirou. Faça login e reative a biometria nas configurações.');
        window.location.href = '/login';
        return;
      }
      toast.error(err?.message || 'Falha na verificação biométrica');
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    disableBiometric();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6">
      <div className="absolute inset-0 grid-lines-bg opacity-50" />
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <img src={logoDark} alt="Decode" className="h-16 w-16 rounded-2xl object-cover shadow-[0_0_40px_hsl(var(--primary)/0.4)]" />
        <div className="space-y-1">
          <h1 className="font-display text-2xl">App bloqueado</h1>
          {email && <p className="text-xs text-muted-foreground font-mono-label">{email}</p>}
          <p className="text-sm text-muted-foreground mt-2">
            Use sua biometria para continuar
          </p>
        </div>

        <button
          onClick={handleUnlock}
          disabled={verifying}
          className="group relative h-28 w-28 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center transition-all hover:bg-primary/20 hover:border-primary/60 active:scale-95 disabled:opacity-50"
        >
          {verifying ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : (
            <Fingerprint className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
          )}
          <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
        </button>

        <Button onClick={handleUnlock} disabled={verifying} className="w-full">
          {verifying ? 'Verificando...' : 'Desbloquear com biometria'}
        </Button>

        <button
          onClick={handleSignOut}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mt-2"
        >
          <LogOut className="h-3 w-3" /> Sair e usar outra conta
        </button>
      </div>
    </div>
  );
}
