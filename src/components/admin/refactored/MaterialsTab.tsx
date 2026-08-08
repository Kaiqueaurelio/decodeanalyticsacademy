import React from 'react';
import { 
  Upload, 
  Loader2, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Presentation, 
  FileSpreadsheet, 
  File, 
  Link as LinkIcon, 
  Plus, 
  FolderOpen, 
  Edit, 
  Download, 
  MoreHorizontal 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CategorySelect } from '@/components/admin/CategorySelect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  file_url: string | null;
  file_path: string | null;
  created_at: string;
  category_id?: string | null;
}

interface MaterialsTabProps {
  user: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileDrop: (file: File) => void;
  handleMultiUpload: (files: File[]) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  matUploading: boolean;
  setMatUploading: (uploading: boolean) => void;
  uploadQueue: any[];
  uploadProgress: { current: number; total: number };
  matFile: File | null;
  setMatFile: (file: File | null) => void;
  matType: string;
  setMatType: (type: string) => void;
  matTitle: string;
  setMatTitle: (title: string) => void;
  matDesc: string;
  setMatDesc: (desc: string) => void;
  matCategoryId: string;
  setMatCategoryId: (id: string) => void;
  dbCategories: any[];
  matUrl: string;
  setMatUrl: (url: string) => void;
  filteredMaterials: Material[];
  loadAll: () => void;
  editingMaterial: Material | null;
  setEditingMaterial: (m: any | null) => void;
  editMatTitle: string;
  setEditMatTitle: (title: string) => void;
  editMatDesc: string;
  setEditMatDesc: (desc: string) => void;
  handleEditMaterial: () => Promise<void>;
  searchQuery: string;
}

export function MaterialsTab(props: MaterialsTabProps) {
  const {
    user, fileInputRef, handleFileDrop, handleMultiUpload, dragActive, setDragActive,
    onDragOver, onDragLeave, matUploading, setMatUploading, uploadQueue, uploadProgress,
    matFile, setMatFile, matType, setMatType, matTitle, setMatTitle, matDesc, setMatDesc,
    matCategoryId, setMatCategoryId, dbCategories, matUrl, setMatUrl, filteredMaterials,
    loadAll, editingMaterial, setEditingMaterial, editMatTitle, setEditMatTitle,
    editMatDesc, setEditMatDesc, handleEditMaterial, searchQuery
  } = props;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-1 bg-primary" />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Upload Rápido</h3>
          </div>
          <p className="text-xs text-muted-foreground">Arraste arquivos ou clique para enviar. O tipo é detectado automaticamente.</p>

          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files || []);
              if (files.length === 1) handleFileDrop(files[0]);
              else if (files.length > 1) handleMultiUpload(files);
            }} accept="*" />

          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave}
            onDrop={e => { e.preventDefault(); setDragActive(false); const files = Array.from(e.dataTransfer.files); files.length === 1 ? handleFileDrop(files[0]) : handleMultiUpload(files); }}
            onClick={() => !matFile && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-300 ${
              dragActive ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg' : matFile ? 'border-primary/40 bg-primary/5 cursor-default' : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            {matUploading ? (
              <div className="w-full space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enviando{uploadQueue.length > 1 ? ` (${uploadProgress.current}/${uploadProgress.total})` : ''}...</p>
                    <p className="text-xs text-muted-foreground truncate">{matFile?.name || 'Processando'}</p>
                  </div>
                </div>
                <Progress value={uploadQueue.length > 1 ? (uploadProgress.current / uploadProgress.total) * 100 : 50} className="h-2" />
              </div>
            ) : matFile ? (
              <div className="w-full">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    {(() => {
                      const icons: Record<string, any> = { pdf: FileText, image: Image, video: Video, audio: Music, powerpoint: Presentation, word: FileText, excel: FileSpreadsheet, gif: Image };
                      const Icon = icons[matType] || File;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{matFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(matFile.size / 1024 / 1024).toFixed(2)} MB · {matType.toUpperCase()}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" onClick={e => { e.stopPropagation(); setMatFile(null); setMatTitle(''); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  <Input value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="Título do material" onClick={e => e.stopPropagation()} />
                  <Input value={matDesc} onChange={e => setMatDesc(e.target.value)} placeholder="Descrição (opcional)" onClick={e => e.stopPropagation()} />
                  <div onClick={e => e.stopPropagation()}>
                    <CategorySelect value={matCategoryId} onValueChange={setMatCategoryId} placeholder="Categoria (opcional)" categories={dbCategories} />
                  </div>
                  <Button className="w-full gradient-primary text-primary-foreground" disabled={!matTitle.trim()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!user || !matFile) return;
                      if (matFile.size === 0) { toast.error('Arquivo vazio.'); return; }
                      setMatUploading(true);
                      try {
                        const ext = matFile.name.split('.').pop();
                        const path = `${user.id}/${Date.now()}.${ext}`;
                        const { error: uploadErr } = await supabase.storage.from('materials').upload(path, matFile, { contentType: matFile.type || undefined, upsert: false });
                        if (uploadErr) throw uploadErr;
                        const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
                        const catMatch = dbCategories.find(c => c.name === matCategoryId);
                        const { error } = await supabase.from('materials').insert({
                          title: matTitle.trim(), description: matDesc || null, type: matType as any,
                          file_url: urlData.publicUrl, file_path: path, created_by: user.id,
                          category_id: catMatch?.id || null,
                        });
                        if (error) throw error;
                        toast.success('Material adicionado!');
                        setMatTitle(''); setMatDesc(''); setMatFile(null); setMatCategoryId(''); loadAll();
                      } catch (err: any) { toast.error('Erro: ' + (err.message || 'Tente novamente')); }
                      setMatUploading(false);
                    }}>
                    <Upload className="h-4 w-4 mr-1.5" /> Enviar Material
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={`rounded-full p-4 transition-colors ${dragActive ? 'bg-primary/20' : 'bg-muted/50'}`}>
                  <Upload className={`h-8 w-8 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{dragActive ? 'Solte para enviar' : 'Arraste arquivos aqui'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ou <span className="text-primary underline underline-offset-2">clique para selecionar</span></p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {['PDF', 'IMG', 'MP4', 'MP3', 'PPTX', 'DOC', 'XLS'].map(t => (
                    <span key={t} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Link mode */}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => { setMatType('link'); setMatFile(null); }}
              className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${matType === 'link' && !matFile ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              <LinkIcon className="h-3 w-3" /> Adicionar por link
            </button>
          </div>

          {matType === 'link' && !matFile && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Input value={matUrl} onChange={e => setMatUrl(e.target.value)} placeholder="https://..." />
              <Input value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="Título do material" />
              <Button className="w-full gradient-primary text-primary-foreground" disabled={matUploading || !matTitle.trim() || !matUrl.trim()}
                onClick={async () => {
                  if (!user) return;
                  setMatUploading(true);
                  try {
                    const { error } = await supabase.from('materials').insert({
                      title: matTitle.trim(), description: matDesc || null, type: 'link' as any,
                      file_url: matUrl.trim(), created_by: user.id,
                    });
                    if (error) throw error;
                    toast.success('Link adicionado!');
                    setMatTitle(''); setMatDesc(''); setMatUrl(''); loadAll();
                  } catch (err: any) { toast.error('Erro: ' + (err.message || 'Tente novamente')); }
                  setMatUploading(false);
                }}>
                <Plus className="h-4 w-4 mr-1.5" /> Adicionar Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials List */}
      <div>
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" /> Materiais ({filteredMaterials.length})
        </h3>
        <div className="grid gap-2">
          {filteredMaterials.map(m => {
            const typeIcon = { pdf: FileText, image: Image, video: Video, audio: Music, powerpoint: Presentation, word: FileText, excel: FileSpreadsheet, link: LinkIcon, other: File, exam: FileText, gif: Image }[m.type] || File;
            const Icon = typeIcon;
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="rounded-lg bg-accent p-2.5 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm break-words leading-snug">{m.title}</h4>
                        <p className="text-[11px] text-muted-foreground break-words">
                          {m.type.toUpperCase()} · {new Date(m.created_at).toLocaleDateString('pt-BR')}
                          {m.description && ` · ${m.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 justify-end pl-12 sm:pl-0">
                      {/* Secundário: Editar (apenas desktop como botão direto) */}
                      <Button size="icon" variant="ghost" className="hidden sm:inline-flex h-8 w-8" onClick={() => { setEditingMaterial(m); setEditMatTitle(m.title); setEditMatDesc(m.description || ''); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {/* Primários: Download + Excluir */}
                      {m.file_url && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="Baixar">
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                        onClick={async () => {
                          if (!confirm('Excluir este material?')) return;
                          if (m.file_path) await supabase.storage.from('materials').remove([m.file_path]);
                          await supabase.from('materials').delete().eq('id', m.id);
                          toast.success('Material excluído'); loadAll();
                        }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {/* Kebab mobile com ações secundárias */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="sm:hidden h-8 w-8" aria-label="Mais opções">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => { setEditingMaterial(m); setEditMatTitle(m.title); setEditMatDesc(m.description || ''); }}>
                            <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Upload className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{searchQuery ? 'Nenhum material encontrado.' : 'Nenhum material adicionado.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Material Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={(v) => !v && setEditingMaterial(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-base">Editar Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título</Label><Input value={editMatTitle} onChange={e => setEditMatTitle(e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Input value={editMatDesc} onChange={e => setEditMatDesc(e.target.value)} placeholder="Descrição (opcional)" className="mt-1" /></div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={handleEditMaterial} disabled={!editMatTitle.trim()}>Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
