/**
 * EditorTopbar — barra superior estilo Word/Docs.
 * Mostra status de salvamento, contagem e zoom.
 */
import { Check, Cloud, Focus, Maximize2, Minus, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SaveStatus = 'saved' | 'idle' | 'unsaved';

interface Props {
  words: number;
  zoom: number;
  setZoom: (z: number) => void;
  status?: SaveStatus;
  onToggleFocus?: () => void;
  focusMode?: boolean;
}

const ZOOMS = [0.75, 1, 1.25, 1.5];

export function EditorTopbar({ words, zoom, setZoom, status = 'idle', onToggleFocus, focusMode }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full border',
            status === 'saved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
            status === 'unsaved' && 'border-amber-500/30 bg-amber-500/10 text-amber-500',
            status === 'idle' && 'border-border bg-background',
          )}
        >
          {status === 'saved' ? (
            <>
              <Check className="h-3 w-3" /> Salvo
            </>
          ) : status === 'unsaved' ? (
            <>
              <Cloud className="h-3 w-3" /> Não salvo
            </>
          ) : (
            <>
              <Cloud className="h-3 w-3" /> Editando
            </>
          )}
        </div>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline truncate">{words.toLocaleString('pt-BR')} palavras</span>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden sm:flex items-center rounded-md border border-border bg-background">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => {
              const idx = ZOOMS.indexOf(zoom);
              if (idx > 0) setZoom(ZOOMS[idx - 1]);
              else setZoom(Math.max(0.5, zoom - 0.1));
            }}
            title="Diminuir zoom"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-[10px] font-mono w-9 text-center select-none">{Math.round(zoom * 100)}%</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => {
              const idx = ZOOMS.indexOf(zoom);
              if (idx >= 0 && idx < ZOOMS.length - 1) setZoom(ZOOMS[idx + 1]);
              else setZoom(Math.min(2, zoom + 0.1));
            }}
            title="Aumentar zoom"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {onToggleFocus && (
          <Button
            type="button"
            size="icon"
            variant={focusMode ? 'secondary' : 'ghost'}
            className="h-6 w-6"
            onClick={onToggleFocus}
            title={focusMode ? 'Sair do modo foco' : 'Modo foco'}
          >
            {focusMode ? <Maximize2 className="h-3 w-3" /> : <Focus className="h-3 w-3" />}
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="hidden sm:inline-flex h-6 w-6"
          onClick={() => window.print()}
          title="Imprimir"
        >
          <Printer className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
