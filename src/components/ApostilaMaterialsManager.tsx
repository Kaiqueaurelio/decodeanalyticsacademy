import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, FileText, Image, Video, Music, Presentation, File, Link as LinkIcon, FileSpreadsheet, Search, Paperclip, Wand2, Loader2, Headphones, Upload
} from 'lucide-react';
import { autoLinkApostila } from '@/lib/auto-link-materials';
import { ManualLinkMaterialsDialog } from '@/components/ManualLinkMaterialsDialog';
import { toast } from 'sonner';

interface Props {
  apostilaId: string;
  apostilaTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
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

export function ApostilaMaterialsManager({ apostilaId, apostilaTitle, open: openProp, onOpenChange, hideTrigger }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v); };
  const [linked, setLinked] = useState<LinkedMaterial[]>([]);
  const [allMaterials, setAllMaterials] = useState<{ id: string; title: string; type: string; file_url: string | null; description: string | null }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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
        toast.info('Nenhum match automático. Abrindo seleção manual...');
        setManualOpen(true);
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

  /**
   * Upload rápido de áudio: cria material 'audio' + vincula à apostila em 1 clique.
   * Útil para o admin subir as gravações das aulas direto pelo modal da apostila.
   */
  const handleAudioUpload = async (file: File) => {
    if (!user) { toast.error('Sessão expirada'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('Áudio acima de 100MB.'); return; }

    setUploadingAudio(true);
    const tId = toast.loading(`Subindo ${file.name}...`);
    try {
      const ext = file.name.split('.').pop() || 'mp3';
      const path = `audios/${apostilaId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('materials').upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const title = file.name.replace(/\.[^.]+$/, '');
      const { data: mat, error: insErr } = await supabase.from('materials').insert({
        title, type: 'audio', file_path: path, created_by: user.id,
      } as any).select().single();
      if (insErr) throw insErr;

      const maxOrder = linked.length > 0 ? Math.max(...linked.map((l) => l.sort_order)) + 1 : 0;
      const { error: linkErr } = await supabase.from('apostila_materials').insert({
        apostila_id: apostilaId, material_id: (mat as any).id, sort_order: maxOrder,
      });
      if (linkErr) throw linkErr;

      toast.success(`Áudio "${title}" vinculado à apostila!`, { id: tId });
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao subir áudio', { id: tId });
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  return (
    <>
      {!hideTrigger && (
        <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setOpen(true)}>
          <Paperclip className="h-3 w-3" /> Materiais ({linked.length})
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base truncate">
              <Paperclip className="inline h-4 w-4 mr-1.5 text-primary" />
              Materiais: {apostilaTitle}
            </DialogTitle>
          </DialogHeader>

          {/* Upload rápido de áudio — destaque */}
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={uploadingAudio}
            className="w-full mb-2 flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              {uploadingAudio ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Headphones className="h-4 w-4 text-primary" />}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Subir áudio da aula</p>
              <p className="text-[10px] text-muted-foreground">MP3, WAV, M4A — vincula automaticamente</p>
            </div>
            <Upload className="h-3.5 w-3.5 text-primary shrink-0" />
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioUpload(f); }}
          />

          {/* Auto-link buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleAutoLink} disabled={autoLinking}>
              {autoLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              Auto-vincular
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setManualOpen(true)}>
              <Search className="h-3 w-3" /> Escolher
            </Button>
          </div>

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

      <ManualLinkMaterialsDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        apostilaId={apostilaId}
        onLinked={load}
      />
    </>
  );
}
