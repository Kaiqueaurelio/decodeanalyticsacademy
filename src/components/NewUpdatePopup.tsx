import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHANGELOG, CHANGE_KIND_LABEL } from '@/data/changelog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

export function NewUpdatePopup() {
  const [open, setOpen] = useState(false);
  const latestVersion = CHANGELOG[0];

  useEffect(() => {
    const lastSeen = localStorage.getItem('decode:last-seen-version');
    if (lastSeen !== latestVersion.version) {
      // Delay para não brigar com outros popups (onboarding)
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    }
  }, [latestVersion.version]);

  const handleClose = () => {
    localStorage.setItem('decode:last-seen-version', latestVersion.version);
    
    // Efeito de celebração ao fechar
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    setOpen(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="relative w-full max-w-md overflow-hidden border-primary/25 bg-card/95 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Glow background */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative p-6">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 shadow-inner">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5">
                VERSÃO {latestVersion.version}
              </Badge>
            </div>
            <h2 className="text-xl font-black tracking-tight">{latestVersion.title}</h2>
            <div className="flex flex-col gap-0.5 mt-1">
              <p className="text-xs text-muted-foreground">Veja o que preparamos de novo para você hoje.</p>
              <p className="text-[10px] text-primary/70 font-medium">Novidades da DECODE ANALYTICS ACADEMY</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {latestVersion.changes.slice(0, 8).map((change, i) => (
              <div key={i} className="flex gap-3 group items-start">
                <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground leading-tight">
                    {CHANGE_KIND_LABEL[change.kind]}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground group-hover:text-foreground/90 transition-colors">
                    {change.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleClose}
              className="flex-1 gradient-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
            >
              Entendi, obrigado!
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
}
