import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Combine, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { mergeApostilas } from '@/lib/auto-link-materials';

interface Apostila {
  id: string;
  title: string;
  category: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onMerged?: () => void;
}

export function MergeApostilasDialog({ open, onOpenChange, onMerged }: Props) {
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    setTargetId('');
    setNewTitle('');
    setSearch('');
    setConfirming(false);
    supabase.from('apostilas').select('id, title, category').order('category').order('title').then(({ data }) => {
      setApostilas(data || []);
      setLoading(false);
    });
  }, [open]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      if (targetId === id) setTargetId('');
    } else {
      next.add(id);
      if (!targetId) setTargetId(id);
    }
    setSelected(next);
  };

  // Lock selection to first selected apostila's category
  const lockedCategory = selected.size > 0
    ? apostilas.find(a => selected.has(a.id))?.category.trim().toLowerCase()
    : null;

  const filtered = apostilas
    .filter(a => !search.trim() || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()))
    .filter(a => !lockedCategory || a.category.trim().toLowerCase() === lockedCategory || selected.has(a.id));

  const handleMerge = async () => {
    if (selected.size < 2 || !targetId) return;
    setMerging(true);
    try {
      const sources = Array.from(selected).filter(id => id !== targetId);
      const result = await mergeApostilas(targetId, sources, newTitle);
      toast.success(
        `${result.mergedCount} apostilas mescladas! ${result.exercisesMoved} exercícios + ${result.materialsMoved} materiais movidos.`
      );
      onMerged?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao mesclar apostilas.');
    } finally {
      setMerging(false);
      setConfirming(false);
    }
  };

  const targetApostila = apostilas.find(a => a.id === targetId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base">
            <Combine className="inline h-4 w-4 mr-1.5 text-primary" />
            Mesclar apostilas
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : confirming ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-destructive mb-1">Ação irreversível</p>
                <p className="text-muted-foreground">
                  As {selected.size - 1} apostilas selecionadas serão excluídas e seu conteúdo,
                  exercícios e materiais serão movidos para <span className="font-medium text-foreground">"{targetApostila?.title}"</span>.
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs">Novo título (opcional)</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={targetApostila?.title || 'Manter título atual'}
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={merging}>Voltar</Button>
              <Button variant="destructive" className="flex-1" onClick={handleMerge} disabled={merging}>
                {merging && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Confirmar mesclagem
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Selecione 2+ apostilas. Marque a "principal" — ela receberá o conteúdo das outras.
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 h-8 text-xs" />
            </div>
            <ScrollArea className="flex-1 -mx-2 px-2 h-[45vh] min-h-[200px]">
              <RadioGroup value={targetId} onValueChange={setTargetId}>
                <div className="space-y-1">
                  {filtered.map(a => {
                    const isSelected = selected.has(a.id);
                    return (
                      <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg border ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggle(a.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{a.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{a.category}</p>
                        </div>
                        {isSelected && (
                          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-primary">
                            <RadioGroupItem value={a.id} id={`r-${a.id}`} />
                            <span>Principal</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </ScrollArea>
            <div className="flex gap-2 pt-3 border-t">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                className="flex-1"
                onClick={() => setConfirming(true)}
                disabled={selected.size < 2 || !targetId}
              >
                Continuar ({selected.size})
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
