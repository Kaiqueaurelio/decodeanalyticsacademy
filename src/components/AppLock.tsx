import { useState } from 'react';
import { Fingerprint, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { verifyBiometric, disableBiometric, getBiometricEmail, refreshBiometricToken } from '@/hooks/useBiometricAuth';
import { getCurrentSession } from '@/lib/auth-session';
import { toast } from 'sonner';
import logoDark from '@/assets/owl-icon.png';

interface AppLockProps {
  onUnlock: () => void;
}

export function AppLock({ onUnlock }: AppLockProps) {
  const [verifying, setVerifying] = useState(false);
  const { signOut } = useAuth();
  const email = getBiometricEmail();

  const handleUnlock = async () => {
    if (verifying) return; // evita duplo clique → duplo refresh
    setVerifying(true);
    try {
      await verifyBiometric();
      const currentSession = getCurrentSession();
      if (currentSession?.user) {
        if (currentSession.refresh_token) {
          await refreshBiometricToken(currentSession.refresh_token).catch(() => {});
        }
        toast.success('Desbloqueado!');
        onUnlock();
        return;
      }
      toast.error('Sua sessão expirou ou biometria falhou. Faça login novamente.');
      // window.location.href = '/login'; // Removido para evitar loop de redirecionamento
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('refresh token') || msg.includes('not found') || msg.includes('expired') || msg.includes('invalid')) {
        disableBiometric();
        // await signOut().catch(() => {}); // Não força signOut automático
        toast.error('Sua sessão expirou. Por favor, faça login manualmente.');
        // window.location.href = '/login';
        return;
      }
      toast.error(err?.message || 'Falha na verificação biométrica');
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    disableBiometric();
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6">
      <div className="absolute inset-0 grid-lines-bg opacity-50" />
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <img src={logoDark} alt="Decode" className="h-24 w-24 object-contain drop-shadow-[0_0_24px_rgba(0,240,255,0.55)]" />
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
