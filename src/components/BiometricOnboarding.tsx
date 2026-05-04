import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { enableBiometric, useBiometricStatus } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

const SEEN_KEY_PREFIX = 'decode_bio_onboarding_seen_';

/**
 * Mostra um diálogo de onboarding sugerindo ativar biometria
 * logo após o primeiro login do usuário (uma vez por conta).
 */
export function BiometricOnboarding() {
  const { user } = useAuth();
  const { supported, available, enabled, refresh } = useBiometricStatus();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Decide se deve abrir — só depois do tour de boas-vindas terminar,
  // para não empilhar dois modais (que travava o app no mobile).
  useEffect(() => {
    if (!user) return;
    if (!supported || !available) return;
    if (enabled) return;

    const key = SEEN_KEY_PREFIX + user.id;
    if (localStorage.getItem(key)) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tryOpen = () => {
      if (cancelled) return;
      // Aguarda o tour de boas-vindas concluir antes de aparecer
      const tourDone = localStorage.getItem('decode_onboarding_done');
      if (!tourDone) {
        timeoutId = setTimeout(tryOpen, 800);
        return;
      }
      // Pequeno respiro depois do tour fechar
      timeoutId = setTimeout(() => {
        if (!cancelled) setOpen(true);
      }, 600);
    };

    timeoutId = setTimeout(tryOpen, 1200);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, supported, available, enabled]);

  const markSeen = () => {
    if (user) localStorage.setItem(SEEN_KEY_PREFIX + user.id, '1');
  };

  const handleActivate = async () => {
    if (!user) return;
    setBusy(true);
    try {
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
      toast.success('Biometria ativada! 🎉');
      refresh();
      markSeen();
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível ativar a biometria');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    markSeen();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20">
        {/* Header com glow */}
        <div className="relative p-6 pb-4 text-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(circle at center top, hsl(var(--primary) / 0.25), transparent 70%)',
            }}
          />
          <div className="relative">
            <div
              className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))',
                border: '1px solid hsl(var(--primary) / 0.3)',
                boxShadow: '0 0 30px hsl(var(--primary) / 0.25)',
              }}
            >
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl mb-1">
              Entre mais rápido com <span className="text-primary">biometria</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Use Face ID ou Touch ID para reabrir o app sem digitar senha.
            </p>
          </div>
        </div>

        {/* Benefícios */}
        <div className="px-6 pb-2 space-y-2.5">
          {[
            { icon: Zap, title: 'Acesso instantâneo', desc: 'Reabra o app em 1 segundo' },
            { icon: ShieldCheck, title: 'Mais seguro', desc: 'Ninguém entra sem ser você' },
            { icon: Lock, title: 'Senha protegida', desc: 'Salva criptografada neste dispositivo' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
              <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{title}</p>
                <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="p-6 pt-4 space-y-2">
          <Button onClick={handleActivate} disabled={busy} className="w-full gap-2">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="h-4 w-4" />
            )}
            Ativar biometria
          </Button>
          <Button onClick={handleSkip} variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground" disabled={busy}>
            Agora não
          </Button>
          <p className="text-[10px] text-center text-muted-foreground/70 pt-1">
            Você pode ativar/desativar a qualquer momento no Perfil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
