import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, FileText, Image, Video, Music, Presentation, File, Link as LinkIcon, FileSpreadsheet, Search, Paperclip, Wand2, Loader2
} from 'lucide-react';
import { autoLinkApostila } from '@/lib/auto-link-materials';
import { ManualLinkMaterialsDialog } from '@/components/ManualLinkMaterialsDialog';
import { toast } from 'sonner';

interface Props {
  apostilaId: string;
  apostilaTitle: string;
}

interface LinkedMaterial {
  id: string;
  sort_order: number;
  material: {
    id: string;
    title: string;
    type: string;
    file_url: string | null;
    description: string | null;
  };
}

const TYPE_ICONS: Record<string, any> = {
  pdf: FileText, image: Image, video: Video, audio: Music,
  powerpoint: Presentation, word: FileText, excel: FileSpreadsheet,
  link: LinkIcon, gif: Image, other: File, exam: FileText,
};

export function ApostilaMaterialsManager({ apostilaId, apostilaTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [linked, setLinked] = useState<LinkedMaterial[]>([]);
  const [allMaterials, setAllMaterials] = useState<{ id: string; title: string; type: string; file_url: string | null; description: string | null }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: links }, { data: mats }] = await Promise.all([
      supabase.from('apostila_materials').select('id, sort_order, material_id').eq('apostila_id', apostilaId).order('sort_order'),
      supabase.from('materials').select('id, title, type, file_url, description').order('created_at', { ascending: false }),
    ]);

    const matMap = new Map((mats || []).map(m => [m.id, m]));
    const linkedItems: LinkedMaterial[] = (links || [])
      .map(l => {
        const mat = matMap.get((l as any).material_id);
        if (!mat) return null;
        return { id: l.id, sort_order: l.sort_order, material: mat };
      })
      .filter(Boolean) as LinkedMaterial[];

    setLinked(linkedItems);
    setAllMaterials(mats || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open, apostilaId]);

  const linkedIds = new Set(linked.map(l => l.material.id));
  const available = allMaterials.filter(m => !linkedIds.has(m.id) && (!search.trim() || m.title.toLowerCase().includes(search.toLowerCase())));

  const addMaterial = async (materialId: string) => {
    const maxOrder = linked.length > 0 ? Math.max(...linked.map(l => l.sort_order)) + 1 : 0;
    const { error } = await supabase.from('apostila_materials').insert({
      apostila_id: apostilaId, material_id: materialId, sort_order: maxOrder,
    });
    if (error) { toast.error('Erro ao vincular'); return; }
    toast.success('Material vinculado!');
    load();
  };

  const handleAutoLink = async () => {
    setAutoLinking(true);
    try {
      const result = await autoLinkApostila(apostilaId);
      if (result.linked > 0) {
        toast.success(`${result.linked} material(is) vinculado(s) automaticamente!`);
        load();
      } else {
        toast.info('Nenhum material novo encontrado para vincular.');
      }
    } catch {
      toast.error('Erro ao auto-vincular.');
    } finally {
      setAutoLinking(false);
    }
  };

  const removeMaterial = async (linkId: string) => {
    await supabase.from('apostila_materials').delete().eq('id', linkId);
    toast.success('Material removido');
    load();
  };

  return (
    <>
      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setOpen(true)}>
        <Paperclip className="h-3 w-3" /> Materiais ({linked.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base truncate">
              <Paperclip className="inline h-4 w-4 mr-1.5 text-primary" />
              Materiais: {apostilaTitle}
            </DialogTitle>
          </DialogHeader>

          {/* Auto-link button */}
          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 mb-2" onClick={handleAutoLink} disabled={autoLinking}>
            {autoLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            {autoLinking ? 'Vinculando...' : 'Auto-vincular por disciplina'}
          </Button>

          {/* Linked materials */}
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vinculados ({linked.length})</p>
            {linked.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">Nenhum material vinculado.</p>
            ) : (
              <div className="space-y-1.5">
                {linked.map(l => {
                  const Icon = TYPE_ICONS[l.material.type] || File;
                  return (
                    <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs flex-1 truncate">{l.material.title}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{l.material.type}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeMaterial(l.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add from library */}
          <div className="space-y-2 flex-1 min-h-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adicionar Material</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar materiais..." className="pl-8 h-8 text-xs" />
            </div>
            <ScrollArea className="flex-1 max-h-[40vh]">
              <div className="space-y-1">
                {available.map(m => {
                  const Icon = TYPE_ICONS[m.type] || File;
                  return (
                    <button
                      key={m.id}
                      onClick={() => addMaterial(m.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs flex-1 truncate">{m.title}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{m.type}</span>
                      <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                    </button>
                  );
                })}
                {available.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {search ? 'Nenhum material encontrado.' : 'Todos os materiais já estão vinculados.'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
