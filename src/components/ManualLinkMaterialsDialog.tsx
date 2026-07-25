import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSuggestedMaterials, linkMaterials } from '@/lib/auto-link-materials';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apostilaId: string;
  onLinked?: () => void;
}

export function ManualLinkMaterialsDialog({ open, onOpenChange, apostilaId, onLinked }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; reason: string }[]>([]);
  const [others, setOthers] = useState<{ id: string; title: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [apostilaTitle, setApostilaTitle] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getSuggestedMaterials(apostilaId).then(({ apostilaTitle, suggestions, others }) => {
      setApostilaTitle(apostilaTitle);
      setSuggestions(suggestions.map(s => ({ id: s.material.id, title: s.material.title, reason: s.reason })));
      setOthers(others.map(o => ({ id: o.id, title: o.title })));
      // Pre-select all suggestions
      setSelected(new Set(suggestions.map(s => s.material.id)));
      setLoading(false);
    });
  }, [open, apostilaId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const count = await linkMaterials(apostilaId, Array.from(selected));
      toast.success(`${count} material(is) vinculado(s)!`);
      onLinked?.();
      onOpenChange(false);
    } catch {
      toast.error('Erro ao vincular materiais.');
    } finally {
      setSaving(false);
    }
  };

  const filteredOthers = others.filter(o => !search.trim() || o.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base truncate">
            <Wand2 className="inline h-4 w-4 mr-1.5 text-primary" />
            Vincular materiais: {apostilaTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-2 px-2 h-[50vh] min-h-[200px]">
            {suggestions.length > 0 && (
              <div className="space-y-1.5 mb-4">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Sugeridos ({suggestions.length})
                </p>
                {suggestions.map(s => (
                  <label key={s.id} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10">
                    <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground">{s.reason}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Outros materiais ({filteredOthers.length})
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 h-8 text-xs" />
              </div>
              {filteredOthers.map(o => (
                <label key={o.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                  <p className="text-xs flex-1 truncate">{o.title}</p>
                </label>
              ))}
              {filteredOthers.length === 0 && others.length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">Nenhum resultado.</p>
              )}
              {others.length === 0 && suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum material disponível.</p>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2 pt-3 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving || selected.size === 0}>
            {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Vincular ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
