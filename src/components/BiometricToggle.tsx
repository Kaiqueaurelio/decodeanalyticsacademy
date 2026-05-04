import { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  enableBiometric,
  disableBiometric,
  useBiometricStatus,
} from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

export function BiometricToggle() {
  const { user } = useAuth();
  const { supported, available, enabled, refresh } = useBiometricStatus();
  const [busy, setBusy] = useState(false);

  const handleToggle = async (next: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      if (next) {
        const { getCurrentSession } = await import('@/lib/auth-session');
        const session = getCurrentSession();
        if (!session?.refresh_token) {
          toast.error('Faça login novamente para ativar a biometria.');
          return;
        }
        await enableBiometric({
          userId: user.id,
          email: user.email || '',
          refreshToken: session.refresh_token,
        });
        toast.success('Biometria ativada! Use Face ID / Touch ID ao reabrir o app.');
      } else {
        disableBiometric();
        toast.success('Biometria desativada.');
      }
      refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível configurar a biometria');
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
        <Fingerprint className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          Biometria não suportada neste navegador.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
        <Fingerprint className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Desbloqueio biométrico</p>
            <p className="text-[11px] text-muted-foreground">
              Use Face ID / Touch ID ao reabrir o app
            </p>
          </div>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={!available || busy}
            />
          )}
        </div>
        {!available && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Sensor biométrico indisponível neste dispositivo.
          </p>
        )}
      </div>
    </div>
  );
}
