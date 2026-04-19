import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppendLinkDialogProps {
  apostilaId: string;
  apostilaTitle: string;
  currentContent: string;
  trigger?: React.ReactNode;
  onDone?: () => void;
}

type RowResult = { url: string; title: string; status: 'ok' | 'error'; error?: string; exercises?: number };

export function AppendLinkDialog({ apostilaId, apostilaTitle, currentContent, trigger, onDone }: AppendLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<RowResult[]>([]);

  const reset = () => {
    setUrls('');
    setResults([]);
    setProgress({ current: 0, total: 0 });
  };

  const handleAppend = async () => {
    const list = urls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (list.length === 0) {
      toast.error('Cole pelo menos uma URL válida');
      return;
    }

    setRunning(true);
    setResults([]);
    setProgress({ current: 0, total: list.length });

    // Buscamos sempre o conteúdo mais recente para não sobrescrever edições paralelas
    let { data: latest } = await supabase
      .from('apostilas')
      .select('content')
      .eq('id', apostilaId)
      .maybeSingle();
    let mergedContent = latest?.content || currentContent || '';
    let totalNewExercises = 0;
    const localResults: RowResult[] = [];

    for (let i = 0; i < list.length; i++) {
      const url = list[i];
      setProgress({ current: i + 1, total: list.length });
      try {
        const { data, error } = await supabase.functions.invoke('extract-content', { body: { url } });
        if (error) throw error;

        const newTitle = (data?.title as string) || 'Conteúdo anexado';
        const newContent = (data?.content as string) || '';
        const newExercises = (data?.exercises as any[]) || [];

        if (!newContent.trim()) throw new Error('Conteúdo vazio retornado');

        // Anexa como continuação, sem apagar nada
        mergedContent = `${mergedContent}\n\n---\n\n## ${newTitle}\n\n_Fonte: ${url}_\n\n${newContent}`.trim();

        if (newExercises.length > 0) {
          const { error: exErr } = await supabase.from('exercises').insert(
            newExercises.map((ex: any) => ({
              apostila_id: apostilaId,
              question: ex.question,
              options: ex.options,
              correct_answer: ex.correct_answer,
              explanation: ex.explanation || null,
            }))
          );
          if (exErr) console.warn('[AppendLink] erro ao salvar exercícios:', exErr);
          else totalNewExercises += newExercises.length;
        }

        localResults.push({ url, title: newTitle, status: 'ok', exercises: newExercises.length });
      } catch (err: any) {
        console.error('[AppendLink] erro em', url, err);
        localResults.push({ url, title: url, status: 'error', error: err?.message || 'Falhou' });
      }
      setResults([...localResults]);
    }

    // Atualiza a apostila com tudo que conseguimos extrair
    const { error: updErr } = await supabase
      .from('apostilas')
      .update({ content: mergedContent })
      .eq('id', apostilaId);

    if (updErr) {
      toast.error('Erro ao salvar: ' + updErr.message);
    } else {
      const okCount = localResults.filter(r => r.status === 'ok').length;
      toast.success(
        `${okCount}/${list.length} link(s) anexado(s)` +
        (totalNewExercises > 0 ? ` · +${totalNewExercises} exercícios` : '')
      );
      onDone?.();
    }

    setRunning(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && !running) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Anexar link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Anexar conteúdo a "{apostilaTitle}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cole um ou mais links (um por linha). O conteúdo extraído será adicionado <strong>como continuação</strong> da apostila atual — nada é apagado. Exercícios encontrados são somados aos existentes.
          </p>
          <div>
            <Label className="text-xs">URLs (uma por linha)</Label>
            <Textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={'https://exemplo.com/artigo-1\nhttps://notion.site/topico-2'}
              rows={5}
              disabled={running}
              className="font-mono text-xs"
            />
          </div>

          {running && (
            <div className="text-xs text-muted-foreground">
              Processando {progress.current}/{progress.total}...
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1.5 border border-border/50 rounded-lg p-2 max-h-48 overflow-y-auto">
              {results.map((r, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  {r.status === 'ok' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.title}</div>
                    <div className="truncate text-muted-foreground">{r.url}</div>
                    {r.status === 'ok' && r.exercises ? (
                      <div className="text-[10px] text-primary">+{r.exercises} exercícios</div>
                    ) : null}
                    {r.status === 'error' && (
                      <div className="text-[10px] text-destructive">{r.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setOpen(false); reset(); }}
              disabled={running}
            >
              Fechar
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground gap-1.5"
              onClick={handleAppend}
              disabled={running || !urls.trim()}
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              {running ? 'Anexando...' : 'Anexar à apostila'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
