import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeMode } from '@/hooks/useSafeMode';

/**
 * Banner discreto exibido enquanto o Modo Seguro está ativo.
 * Permite ao usuário desativar manualmente.
 */
export function SafeModeBanner() {
  const { enabled, manual, disable } = useSafeMode();
  if (!enabled) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[110] max-w-[92vw]">
      <div className="flex items-center gap-3 rounded-full border border-amber-500/40 bg-amber-500/10 backdrop-blur-md px-4 py-2 shadow-lg">
        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
        <div className="text-xs text-foreground/90">
          <span className="font-semibold">Modo Seguro ativo.</span>{' '}
          <span className="text-muted-foreground hidden sm:inline">
            {manual ? 'Ativado por você.' : 'Recursos pesados desativados após falhas.'}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[11px] text-foreground hover:bg-amber-500/20"
          onClick={disable}
        >
          Desativar <X className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
