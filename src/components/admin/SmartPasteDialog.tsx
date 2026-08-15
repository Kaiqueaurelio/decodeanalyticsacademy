/**
 * SmartPasteDialog — "Colar de qualquer lugar" com pré-visualização do que
 * vai mudar. Usa paste-cleaner para normalizar o texto antes de inserir
 * no editor.
 */
import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PenTool, ClipboardPaste, FileText, Wand2 } from 'lucide-react';
import { cleanPastedContent } from '@/lib/paste-cleaner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Insere ao final do conteúdo atual (ou substitui, conforme escolha). */
  onApply: (text: string, mode: 'append' | 'replace') => void;
}

export function SmartPasteDialog({ open, onOpenChange, onApply }: Props) {
  const [raw, setRaw] = useState('');
  const [smartHeadings, setSmartHeadings] = useState(false);
  const [cleanUrls, setCleanUrls] = useState(true);
  const [mode, setMode] = useState<'append' | 'replace'>('append');

  useEffect(() => { if (!open) { setRaw(''); setSmartHeadings(false); setMode('append'); } }, [open]);

  const result = raw ? cleanPastedContent(raw, { smartHeadings, cleanUrls }) : { cleaned: '', changes: [] };
  const stats = useMemo(() => {
    const text = result.cleaned || raw;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
  }, [raw, result.cleaned]);

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
      <DialogContent className="flex max-h-[95dvh] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-3 overflow-hidden p-3 sm:p-6 sm:max-h-[92dvh]">
        <DialogHeader className="space-y-1 pr-8 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <PenTool className="h-4 w-4 text-primary" />
            Colar e organizar
          </DialogTitle>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Cole seu texto, Markdown ou transcrições de aula. O app organizará a formatação e permitirá a continuação do seu trabalho.
          </p>
        </DialogHeader>

        <div className="grid shrink-0 gap-2 rounded-lg border border-border bg-muted/20 p-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap items-center">
            <Button size="sm" variant="outline" onClick={handlePaste} className="h-9 justify-center gap-1.5 text-xs sm:h-8">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Colar
            </Button>
            <Button
              size="sm"
              variant={mode === 'append' ? 'default' : 'outline'}
              className="h-9 justify-center text-xs sm:h-8"
              onClick={() => setMode('append')}
            >
              Acrescentar
            </Button>
            <Button
              size="sm"
              variant={mode === 'replace' ? 'default' : 'outline'}
              className="h-9 justify-center text-xs sm:h-8"
              onClick={() => setMode('replace')}
            >
              Substituir
            </Button>
            <div className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 text-[10px] text-muted-foreground sm:h-8 col-span-2 sm:col-auto">
              <FileText className="h-3 w-3" />
              {stats.words.toLocaleString('pt-BR')} palavras
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-2 w-full sm:w-auto">
              <label
                className={cn(
                  'flex flex-1 items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs sm:h-8 sm:py-0',
                  !smartHeadings ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background',
                )}
              >
                <span>Preservar</span>
                <Switch checked={!smartHeadings} onCheckedChange={(checked) => setSmartHeadings(!checked)} />
              </label>
              <label className="flex flex-1 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-xs sm:h-8 sm:py-0">
                <span className="flex items-center gap-1.5">Inferir</span>
                <Switch checked={smartHeadings} onCheckedChange={setSmartHeadings} />
              </label>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 px-1 border rounded-md p-2 sm:border-none sm:p-0">
              <Label htmlFor="clean-u" className="text-xs cursor-pointer">Limpar URLs</Label>
              <Switch id="clean-u" checked={cleanUrls} onCheckedChange={setCleanUrls} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 min-h-[40vh] grid-cols-1 gap-3 lg:grid-cols-2 overflow-y-auto pr-1 sm:overflow-visible sm:pr-0">
          <div className="flex flex-col min-h-[300px] lg:min-h-0">
            <Label className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Texto original</Label>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Cole aqui seu texto, Markdown, material do Word, PDF, Notion ou Google Docs..."
              className="min-h-[250px] flex-1 resize-none text-sm leading-relaxed sm:min-h-[360px]"
            />
          </div>
          <div className="flex flex-col min-h-[300px] lg:min-h-0">
            <Label className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Como será inserido</Label>
            <ScrollArea className="min-h-[250px] flex-1 rounded-md border border-border bg-muted/20 sm:min-h-[360px]">
              <pre className="whitespace-pre-wrap break-words p-3 text-xs leading-relaxed font-mono">
                {result.cleaned || <span className="text-muted-foreground">— vazio —</span>}
              </pre>
            </ScrollArea>
            {result.changes.length > 0 && (
              <ul className="mt-1.5 grid gap-0.5 sm:grid-cols-2">
                {result.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <span>✓</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 sm:h-9">Cancelar</Button>
          <Button
            disabled={!result.cleaned}
            className="h-10 sm:h-9"
            onClick={() => { onApply(result.cleaned, mode); onOpenChange(false); }}
          >
            {mode === 'append' ? 'Inserir' : 'Substituir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
