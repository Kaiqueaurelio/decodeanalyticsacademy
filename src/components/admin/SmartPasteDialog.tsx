/**
 * SmartPasteDialog — "Colar de qualquer lugar" com pré-visualização do que
 * vai mudar. Usa paste-cleaner para normalizar o texto antes de inserir
 * no editor.
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, ClipboardPaste } from 'lucide-react';
import { cleanPastedContent } from '@/lib/paste-cleaner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Insere ao final do conteúdo atual (ou substitui, conforme escolha). */
  onApply: (text: string, mode: 'append' | 'replace') => void;
}

export function SmartPasteDialog({ open, onOpenChange, onApply }: Props) {
  const [raw, setRaw] = useState('');
  const [smartHeadings, setSmartHeadings] = useState(true);
  const [cleanUrls, setCleanUrls] = useState(true);
  const [mode, setMode] = useState<'append' | 'replace'>('append');

  useEffect(() => { if (!open) { setRaw(''); } }, [open]);

  const result = raw ? cleanPastedContent(raw, { smartHeadings, cleanUrls }) : { cleaned: '', changes: [] };

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setRaw(t);
    } catch {
      // sem permissão — usuário pode colar manualmente
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Colar de qualquer lugar
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <Button size="sm" variant="outline" onClick={handlePaste} className="gap-1.5 h-7">
            <ClipboardPaste className="h-3 w-3" />
            Colar do clipboard
          </Button>
          <div className="flex items-center gap-2">
            <Switch id="smart-h" checked={smartHeadings} onCheckedChange={setSmartHeadings} />
            <Label htmlFor="smart-h" className="text-xs cursor-pointer">Inferir títulos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="clean-u" checked={cleanUrls} onCheckedChange={setCleanUrls} />
            <Label htmlFor="clean-u" className="text-xs cursor-pointer">Limpar rastreadores de URL</Label>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant={mode === 'append' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setMode('append')}>
              Acrescentar ao final
            </Button>
            <Button size="sm" variant={mode === 'replace' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setMode('replace')}>
              Substituir tudo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cole aqui (de Notion, Word, site…)</Label>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Ctrl+V para colar do Notion, Word, Google Docs, sites…"
              className="flex-1 min-h-[260px] font-mono text-xs resize-none"
            />
          </div>
          <div className="flex flex-col min-h-0">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resultado limpo (markdown)</Label>
            <ScrollArea className="flex-1 min-h-[260px] rounded-md border border-border bg-muted/20">
              <pre className="text-xs p-3 whitespace-pre-wrap break-words font-mono">
                {result.cleaned || <span className="text-muted-foreground">— vazio —</span>}
              </pre>
            </ScrollArea>
            {result.changes.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {result.changes.map((c, i) => (
                  <li key={i} className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                    <span>✓</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!result.cleaned}
            onClick={() => { onApply(result.cleaned, mode); onOpenChange(false); }}
          >
            {mode === 'append' ? 'Inserir no editor' : 'Substituir conteúdo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
