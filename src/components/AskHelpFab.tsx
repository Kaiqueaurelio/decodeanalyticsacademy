/**
 * AskHelpFab — FAB que mostra um menu com 3 opções de ajuda dentro da apostila.
 *  • Chat IA da apostila (abre o sheet existente)
 *  • Tira-dúvida (foto) — leva para /tira-duvida
 *  • Postar na Comunidade — leva para /comunidade
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Camera, Wand2, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onOpenChat: () => void;
}

export function AskHelpFab({ onOpenChat }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const Item = ({
    icon: Icon, label, color, onClick, delay,
  }: {
    icon: typeof Camera;
    label: string;
    color: string;
    onClick: () => void;
    delay: number;
  }) => (
    <button
      onClick={() => { setOpen(false); onClick(); }}
      style={{ transitionDelay: open ? `${delay}ms` : '0ms' }}
      className={cn(
        'flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full bg-card border border-border shadow-lg hover-lift transition-all duration-300',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
      )}
    >
      <span className={cn('h-7 w-7 rounded-full flex items-center justify-center', color)}>
        <Icon className="h-3.5 w-3.5 text-primary-foreground" />
      </span>
      <span className="text-xs font-medium whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <>
      {/* Backdrop quando aberto */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
        {/* Sub-itens */}
        <div className="flex flex-col items-start gap-2 mb-1">
          <Item
            icon={Wand2}
            label="Chat com a IA"
            color="bg-primary"
            onClick={onOpenChat}
            delay={0}
          />
          <Item
            icon={Camera}
            label="Tira-dúvida (foto)"
            color="bg-accent"
            onClick={() => navigate('/tira-duvida')}
            delay={60}
          />
          <Item
            icon={Users}
            label="Postar na Comunidade"
            color="bg-[hsl(var(--primary)/0.85)]"
            onClick={() => navigate('/comunidade')}
            delay={120}
          />
        </div>

        {/* Botão principal */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fechar ajuda' : 'Pedir ajuda'}
          className="h-14 px-5 rounded-full gradient-primary text-primary-foreground flex items-center gap-2.5 shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover-lift transition-all ring-2 ring-primary/30"
        >
          <div className="relative">
            {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
            {!open && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-semibold">{open ? 'Fechar' : 'Pedir ajuda'}</span>
        </button>
      </div>
    </>
  );
}
