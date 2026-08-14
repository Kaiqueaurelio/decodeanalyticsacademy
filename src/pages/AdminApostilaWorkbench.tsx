/**
 * AdminApostilaWorkbench — tela única de edição de uma apostila (Notion Pro Style).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { ApostilaHealthBar } from '@/components/admin/AdminNotionEditorHeader';
import { ApostilaVersionHistory } from '@/components/admin/ApostilaVersionHistory';
import { MaterialsDropZone } from '@/components/admin/MaterialsDropZone';
import { SortableMaterialsList, type LinkedMaterialItem } from '@/components/admin/SortableMaterialsList';
import { SmartPasteDialog } from '@/components/admin/SmartPasteDialog';
import { FinalReviewDialog } from '@/components/admin/FinalReviewDialog';
import { ManualLinkMaterialsDialog } from '@/components/ManualLinkMaterialsDialog';
import { QuickAddSectionDialog } from '@/components/admin/QuickAddSectionDialog';
import { autoLinkApostila } from '@/lib/auto-link-materials';
import { ApostilaContentRenderer } from '@/components/ApostilaContentRenderer';
import { guessSemesterFromCategory, SEMESTER_OPTIONS, COURSE_OPTIONS, type CourseCode } from '@/lib/subject-semester-map';
import { ensureApostilaExists } from '@/lib/create-placeholder-apostila';
import { Badge } from '@/components/ui/badge';
import { getSubjectColor } from '@/lib/subject-colors';

import {
  ArrowLeft, Search, Save, Eye, PenTool, Wand2, Loader2, Menu, FileText,
  ListChecks, PanelRightClose, ExternalLink, GraduationCap, ImageIcon, PanelRightOpen, X, Maximize2, Minimize2,
  FilePlus2, Plus
} from 'lucide-react';
import { invokeFunction } from '@/lib/invoke-function';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApostilaLite {
  id: string;
  title: string;
  category: string;
  published: boolean;
  updated_at: string;
  semester: number | null;
  course: CourseCode[] | null;
}

const AUTOSAVE_MS = 1000;

interface WorkbenchProps {
  overrideId?: string;
  onBack?: () => void;
}

export default function AdminApostilaWorkbench({ overrideId, onBack }: WorkbenchProps = {}) {
  const { id: routeId } = useParams<{ id: string }>();
  const id = overrideId || routeId;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estado da lista lateral
  const [apostilas, setApostilas] = useState<ApostilaLite[]>([]);
  const [search, setSearch] = useState('');

  // Estado da apostila atual
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [semester, setSemester] = useState<number | null>(null);
  const [course, setCourse] = useState<CourseCode[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const indicator = document.getElementById('scroll-indicator');
      if (!indicator) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      const thumbHeight = (clientHeight / scrollHeight) ? (clientHeight / scrollHeight) * 100 : 0;
      
      indicator.style.height = `${Math.max(thumbHeight, 10)}%`;
      indicator.style.marginTop = `${(scrollPercent * (100 - Math.max(thumbHeight, 10))) / 100}%`;
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial update
    setTimeout(handleScroll, 500);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [loading, content]);



  // Materiais e exercícios
  const [linkedMaterials, setLinkedMaterials] = useState<LinkedMaterialItem[]>([]);

  const [exerciseCount, setExerciseCount] = useState(0);

  // UI
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [manualLinkOpen, setManualLinkOpen] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rightTab, setRightTab] = useState<'materials' | 'preview' | 'exercises'>('materials');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [suggestedSectionTitle, setSuggestedSectionTitle] = useState('');

  const dirtyRef = useRef(false);
  const initialLoadRef = useRef(true);

  // Filter logic for sidebar
  const filteredApostilas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apostilas;
    return apostilas.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [apostilas, search]);

  // === Carregar lista lateral ===
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('apostilas')
        .select('id, title, category, published, updated_at, semester, course')
        .order('updated_at', { ascending: false })
        .limit(200);
      setApostilas((data as ApostilaLite[]) || []);
    })();
  }, []);

  // === Carregar apostila atual ===
  const loadApostila = async (apostilaId: string) => {
    setLoading(true);
    initialLoadRef.current = true;
    const results = await Promise.allSettled([
      supabase.from('apostilas').select('*').eq('id', apostilaId).maybeSingle(),
      supabase.from('apostila_materials').select('id, sort_order, material_id').eq('apostila_id', apostilaId).order('sort_order'),
      supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('apostila_id', apostilaId),
    ]);

    const apRes = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: new Error('Network error') };
    const linksRes = results[1].status === 'fulfilled' ? results[1].value : { data: [], error: null };
    const countRes = results[2].status === 'fulfilled' ? results[2].value : { count: 0 };

    const ap = apRes.data;
    const links = linksRes.data;
    const count = countRes.count;

    if (!ap) {
      if (apostilaId && (apostilaId.startsWith('placeholder') || (apostilas && apostilas.some(a => a.id === apostilaId)))) {
        try {
          const matched = apostilas.find(a => a.id === apostilaId);
          const realId = await ensureApostilaExists(matched || { id: apostilaId, title: '' });
          navigate(`/admin/apostilas/${realId}`, { replace: true });
          await loadApostila(realId);
          return;
        } catch (err: any) {
          console.error('Erro ao resolver placeholder:', err);
        }
      }
      toast.error('Apostila não encontrada');
      if (onBack) onBack();
      else navigate('/admin');
      return;
    }

    // Verificar backup local antes de carregar do banco
    const backupKey = `apostila_backup_${apostilaId}`;
    const localBackupRaw = localStorage.getItem(backupKey);
    let localBackup = null;
    try {
      if (localBackupRaw) localBackup = JSON.parse(localBackupRaw);
    } catch (e) {
      console.error('Erro ao ler backup local:', e);
    }

    if (localBackup && ap && new Date(localBackup.timestamp) > new Date(ap.updated_at)) {
      toast.info('Recuperamos uma versão não salva localmente.', {
        description: `Última alteração local em ${new Date(localBackup.timestamp).toLocaleTimeString()}`,
        action: {
          label: 'Descartar',
          onClick: () => localStorage.removeItem(backupKey)
        }
      });
      setTitle(localBackup.title || '');
      setCategory(localBackup.category || '');
      setContent(localBackup.content || '');
      setSemester(localBackup.semester ?? null);
      setCourse(localBackup.course ?? []);
    } else {
      setTitle(ap.title || '');
      setCategory(ap.category || '');
      const restoredContent = ap.content || (ap as any).content_backup || '';
      setContent(restoredContent);
      setSemester((ap as any).semester ?? null);
      setCourse(((ap as any).course as CourseCode[] | null) ?? []);
    }

    setPublished(!!ap.published);
    setCoverUrl(((ap as any).cover_url as string | null) ?? null);
    setExerciseCount(count || 0);

    if (links && links.length) {
      const ids = links.map((l: any) => l.material_id);
      const { data: mats } = await supabase.from('materials').select('id, title, type').in('id', ids);
      const map = new Map((mats || []).map((m) => [m.id, m]));
      setLinkedMaterials(
        (links as any[])
          .map((l) => {
            const m = map.get(l.material_id);
            if (!m) return null;
            return { id: l.id, sort_order: l.sort_order, material: m as any };
          })
          .filter(Boolean) as LinkedMaterialItem[]
      );
    } else {
      setLinkedMaterials([]);
    }

    setLoading(false);
    setTimeout(() => { initialLoadRef.current = false; }, 100);
  };

  useEffect(() => { if (id) loadApostila(id); }, [id]);

  useEffect(() => {
    const handleKeyAdd = () => {
      // Tenta sugerir um número baseado no conteúdo atual
      // Regex para encontrar headings H1 style que começam com números (ex: "# 1.1 Introdução")
      const matches = content.match(/^#\s+(\d+(?:\.\d+)*)/gm);
      let suggested = '';
      if (matches && matches.length > 0) {
        const lastHeading = matches[matches.length - 1];
        const lastNumStr = lastHeading.replace(/^#\s+/, '');
        const parts = lastNumStr.split('.');
        
        if (parts.length > 0) {
          const lastPart = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastPart)) {
            parts[parts.length - 1] = (lastPart + 1).toString();
            suggested = parts.join('.');
          }
        }
      } else {
        suggested = '1.1';
      }
      
      setSuggestedSectionTitle(suggested);
      setAddSectionOpen(true);
    };
    
    window.addEventListener('open-quick-add-section' as any, handleKeyAdd);
    return () => window.removeEventListener('open-quick-add-section' as any, handleKeyAdd);
  }, [content]);

  // Global toggle for components
  useEffect(() => {
    (window as any).toggleAdminSidebar = () => setSidebarOpen(prev => !prev);
    return () => { delete (window as any).toggleAdminSidebar; };
  }, []);

  // === Autosave ===
  useEffect(() => {
    if (initialLoadRef.current || !id) return;
    dirtyRef.current = true;
    const t = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    
    // Backup local em caso de falha no mobile
    const backupKey = `apostila_backup_${id}`;
    localStorage.setItem(backupKey, JSON.stringify({
      title,
      category,
      content,
      semester,
      course,
      timestamp: new Date().toISOString()
    }));

    return () => window.clearTimeout(t);
  }, [title, category, content, semester, course]);

  const doSave = async (isManual = false) => {
    if (!id || !dirtyRef.current) return;
    setSaving(true);

    const { data: currentApostila } = await supabase
      .from('apostilas')
      .select('title, content')
      .eq('id', id)
      .single();

    if (currentApostila?.content?.trim() && !content.trim()) {
      setContent(currentApostila.content);
      dirtyRef.current = false;
      setSaving(false);
      toast.error('Conteúdo preservado para evitar perda.');
      return;
    }

    if (currentApostila && (currentApostila.content !== content || currentApostila.title !== title)) {
      await supabase.from('apostila_versions').insert({
        apostila_id: id,
        title: currentApostila.title,
        content: currentApostila.content,
        created_by: user?.id
      });
    }

    const { error } = await supabase
      .from('apostilas')
      .update({
        title: title.trim() || 'Sem título',
        category,
        content,
        published: content.trim().length > 0 ? true : published,
        semester,
        course: course.length ? course : null,
      })
      .eq('id', id);

    setSaving(false);
    if (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Falha na sincronização. Edição mantida localmente.', {
        description: 'Verifique sua conexão. Tentaremos salvar novamente em instantes.',
        action: isManual ? {
          label: 'Tentar Agora',
          onClick: () => doSave(true)
        } : undefined,
        duration: 5000,
      });
      return;
    }
    
    // Limpar backup se salvou com sucesso
    localStorage.removeItem(`apostila_backup_${id}`);
    dirtyRef.current = false;
    if (content.trim().length > 0) setPublished(true);
    setLastSavedAt(new Date());
    setApostilas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: title.trim() || 'Sem título', category, semester, course: course.length ? course : null, updated_at: new Date().toISOString() } : p))
    );
  };

  const handleRestoreVersion = (version: { title: string; content: string }) => {
    setTitle(version.title);
    setContent(version.content);
    dirtyRef.current = true;
    toast.success('Versão restaurada!');
  };

  const togglePublish = async () => {
    if (!id) return;
    if (!published) {
      setReviewOpen(true);
      return;
    }
    await executeTogglePublish(false);
  };

  const executeTogglePublish = async (next: boolean) => {
    setPublished(next);
    const { error } = await supabase.from('apostilas').update({ published: next }).eq('id', id);
    if (error) {
      setPublished(!next);
      toast.error('Falha ao alterar status');
    } else {
      toast.success(next ? 'Publicada' : 'Rascunho');
      setApostilas((prev) => prev.map((p) => (p.id === id ? { ...p, published: next } : p)));
    }
  };

  const reloadMaterials = async () => {
    if (!id) return;
    const { data: links } = await supabase
      .from('apostila_materials').select('id, sort_order, material_id')
      .eq('apostila_id', id).order('sort_order');
    if (!links?.length) { setLinkedMaterials([]); return; }
    const ids = links.map((l: any) => l.material_id);
    const { data: mats } = await supabase.from('materials').select('id, title, type').in('id', ids);
    const map = new Map((mats || []).map((m) => [m.id, m]));
    setLinkedMaterials(
      (links as any[])
        .map((l) => {
          const m = map.get(l.material_id);
          if (!m) return null;
          return { id: l.id, sort_order: l.sort_order, material: m as any };
        })
        .filter(Boolean) as LinkedMaterialItem[]
    );
  };

  const handlePasteApply = (text: string, mode: 'append' | 'replace') => {
    setContent((prev) => mode === 'append' ? (prev ? prev + '\n\n' + text : text) : text);
    toast.success('Texto inserido!');
  };

  const handleGenerateCover = async () => {
    if (!id) return;
    if (dirtyRef.current) await doSave();
    setGeneratingCover(true);
    const { data, error } = await invokeFunction<{ cover_url: string }>('generate-apostila-cover', {
      body: { apostilaId: id },
    });
    setGeneratingCover(false);
    if (error || !data?.cover_url) return;
    setCoverUrl(data.cover_url);
    toast.success('Capa gerada!');
  };

  const SidebarList = (
    <div className="flex flex-col h-full bg-card border-r border-border shadow-inner">
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" className="h-7 px-2 -ml-2 gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground" onClick={() => onBack ? onBack() : navigate('/admin')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Admin
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setSidebarOpen(false); setSidebarCollapsed(true); }}
            title="Recolher lista de apostilas"
            aria-label="Recolher lista de apostilas"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredApostilas.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                navigate(`/admin/apostilas/${a.id}`);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between group",
                id === a.id ? "bg-primary text-primary-foreground font-black shadow-md shadow-primary/20" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="truncate flex-1 capitalize">{a.title.replace(/_/g, ' ').toLowerCase()}</span>
              {!a.published && <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1 ml-2", id === a.id ? "border-primary-foreground/40 text-primary-foreground" : "opacity-50")}>Draft</Badge>}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const handleQuickAddSection = (sectionTitle: string, type: string) => {
    let prefix = '# ';
    if (type === 'subsection') prefix = '## ';
    
    let newContent = `\n\n${prefix}${sectionTitle}\n\n`;
    if (type === 'template') {
      newContent += `**Introdução:** ...\n\n**Desenvolvimento:** ...\n\n**Conclusão/Exercícios:** ...\n`;
    }
    
    setContent(prev => prev + newContent);
    toast.success(`✓ Página "${sectionTitle}" criada com sucesso`);
    
    // Rola para o final do editor após um pequeno delay para o state atualizar
    setTimeout(() => {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        // Tenta focar no editor para que o usuário possa digitar imediatamente
        (editorElement as HTMLElement).focus();
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 150);
  };

  const baseSortOrder = linkedMaterials.length > 0
    ? Math.max(...linkedMaterials.map((m) => m.sort_order)) + 1
    : 0;

  const RightPanel = (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <Tabs value={rightTab} onValueChange={(v: any) => setRightTab(v)} className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-3">
          <TabsList className="w-full grid grid-cols-3 h-8 bg-muted/50 p-1">
            <TabsTrigger value="materials" className="text-[10px] font-bold">Arquivos</TabsTrigger>
            <TabsTrigger value="preview" className="text-[10px] font-bold">Preview</TabsTrigger>
            <TabsTrigger value="exercises" className="text-[10px] font-bold">Questões</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setRightOpen(false)}
            title="Recolher painel"
            aria-label="Recolher painel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <TabsContent value="materials" className="m-0 p-4 space-y-4">
            <MaterialsDropZone apostilaId={id as string} baseSortOrder={baseSortOrder} onUploaded={reloadMaterials} />
            <SortableMaterialsList 
              items={linkedMaterials} 
              onReorder={setLinkedMaterials}
              onRemove={async (lid) => {
                await supabase.from('apostila_materials').delete().eq('id', lid);
                setLinkedMaterials(prev => prev.filter(m => m.id !== lid));
              }} 
            />
          </TabsContent>
          <TabsContent value="preview" className="m-0 bg-background/50">
            <div className="p-6 bg-white dark:bg-[#1a1c1e] min-h-[800px] shadow-inner">
              <div className="max-w-[800px] mx-auto bg-card shadow-2xl p-12 min-h-[1056px] border border-border/40">
                <ApostilaContentRenderer content={content} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="exercises" className="m-0 p-4">
             <div className="space-y-4">
               <div className="p-4 rounded-xl border border-dashed border-border/50 text-center space-y-2">
                 <p className="text-xs text-muted-foreground">Gestão de exercícios em breve integrada aqui.</p>
               </div>
             </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { words };
  }, [content]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      <ApostilaHealthBar
        title={title}
        published={published}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={() => doSave(true)}
        onTogglePublish={togglePublish}
        onPreview={() => { setRightTab('preview'); setRightOpen(true); }}
        onOpenPanel={() => { setRightTab('materials'); setRightOpen(true); }}
        wordCount={content.trim() ? content.trim().split(/\s+/).length : 0}
        exerciseCount={exerciseCount}
        materialCount={linkedMaterials.length}
        onPasteOpen={() => setPasteOpen(true)}
        onAddPage={() => {
          // Tenta sugerir um número baseado no conteúdo atual
          const matches = content.match(/#\s+(\d+\.?\d*)/g);
          if (matches) {
            const lastNum = parseFloat(matches[matches.length - 1].replace('# ', ''));
            if (!isNaN(lastNum)) {
              setSuggestedSectionTitle(`${(lastNum + 0.1).toFixed(1)} `);
            }
          }
          setAddSectionOpen(true);
        }}
      />
      
      {/* BARRA DE ADIÇÃO RÁPIDA (Removido o botão duplicado central) */}

      
      <div className="flex flex-1 min-h-0 overflow-hidden relative">


        {/* Sidebar Desktop/Mobile */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 overflow-hidden transform transition-all duration-300 ease-in-out bg-background lg:relative shrink-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-0 lg:-translate-x-full" : "lg:translate-x-0"
        )}>
          {SidebarList}
        </div>

        {/* Overlay para mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Notion Canvas Editor */}
        <main className={cn(
          "flex-1 min-w-0 bg-background relative flex flex-col h-full overflow-hidden group/editor",
          editorExpanded && "fixed inset-0 z-[70] h-[100dvh]"
        )}>
          {/* BOTÃO FLUTUANTE DE NOVA PÁGINA (ESTILO NOTION) */}
          <button
            onClick={() => setAddSectionOpen(true)}
            className="absolute right-8 bottom-8 z-[80] flex items-center justify-center h-14 w-14 rounded-full bg-emerald-600 text-white shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all duration-300 group/float border-4 border-background"
            title="Adicionar Nova Página (Ctrl+Shift+P)"
          >
            <Plus className="h-6 w-6 group-hover/float:rotate-90 transition-transform duration-300" />
            <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/float:opacity-100 transition-opacity pointer-events-none shadow-xl whitespace-nowrap border border-emerald-500/30">
              Nova Página
            </div>
          </button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-3 top-3 z-50 h-9 w-9 bg-background/95 shadow-sm",
              !sidebarCollapsed && "hidden lg:hidden",
            )}
            onClick={() => { setSidebarCollapsed(false); setSidebarOpen(true); }}
            title="Abrir lista de apostilas"
            aria-label="Abrir lista de apostilas"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="absolute right-3 top-3 z-50 hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 bg-background/95 shadow-sm"
              onClick={() => setEditorExpanded((current) => !current)}
              aria-label={editorExpanded ? 'Sair da edição expandida' : 'Expandir área de edição'}
            >
              {editorExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{editorExpanded ? 'Sair da expansão' : 'Expandir'}</span>
            </Button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 relative bg-background overflow-hidden">



            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar group/workbench scroll-smooth pb-20">
            {/* Indicador de Rolagem Lateral (Desktop e Mobile) */}
            <div className="fixed right-1 sm:right-2 top-24 bottom-24 w-1.5 sm:w-2.5 z-[100] pointer-events-none opacity-80 sm:opacity-100">
              <div className="w-full h-full bg-primary/10 rounded-full overflow-hidden border border-primary/20 backdrop-blur-[2px]">
                <div 
                  id="scroll-indicator"
                  className="w-full bg-primary rounded-full transition-all duration-200 shadow-[0_0_15px_rgba(var(--primary),0.8)] border border-white/20"
                  style={{ height: '0%', marginTop: '0%' }}
                />
              </div>
            </div>


            <div className="w-full max-w-[900px] mx-auto flex flex-col shrink-0">
              <div className="relative px-3 py-3 sm:pt-12 sm:pb-8 sm:px-16">
                <div 
                  className="absolute top-0 left-0 right-0 h-48 opacity-10 blur-3xl -z-10"
                  style={{ background: `linear-gradient(to bottom, ${getSubjectColor(category)}, transparent)` }}
                />
                
                <div className="space-y-4">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-accent/30 text-2xl group-hover:bg-accent/50 transition-colors cursor-pointer">📚</div>

                  <div className="space-y-2">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título da Página"
                      className="w-full bg-transparent border-none text-xl sm:text-4xl font-black focus:ring-0 placeholder:text-muted-foreground/20 p-0"
                    />
                    
                    <div className="hidden sm:flex flex-wrap items-center gap-x-8 gap-y-2 py-3 border-y border-border/10">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest shrink-0">
                          <ListChecks className="h-3 w-3" />
                          <span>Status</span>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-1.5 py-0 rounded-md",
                          published ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {published ? 'PUBLICADA' : 'RASCUNHO'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest shrink-0">
                          <GraduationCap className="h-3 w-3" />
                          <span>Semestre</span>
                        </div>
                        <select
                          value={semester || ''}
                          onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : null)}
                          className="bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <option value="">Não definido</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>{s}º semestre</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest shrink-0">
                          <FileText className="h-3 w-3" />
                          <span>Matéria</span>
                        </div>
                        <input
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Nome da disciplina"
                          className="bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 min-w-[150px] text-muted-foreground hover:text-foreground transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 flex-col px-0 sm:px-16 sm:pb-32">
              <MarkdownEditor
                value={content}
                onChange={setContent}
                onSave={doSave}
                placeholder="Comece a escrever ou digite '/' para comandos..."
                className="flex-1 min-h-0 border-none shadow-none bg-transparent"
              />
            </div>
          </div>
        </div>

          <Button
            variant="outline"
            size="icon"
            className={cn("hidden sm:inline-flex fixed right-6 bottom-6 z-40 h-10 w-10 rounded-full bg-background shadow-lg", rightOpen && "rotate-180")}
            onClick={() => setRightOpen(!rightOpen)}
          >
            <PanelRightClose className="h-5 w-5" />
          </Button>
        </main>


        {/* Right Panel Desktop/Mobile Drawer */}
        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetContent side="right" className="p-0 w-full sm:w-[400px] border-l-0 sm:border-l border-border">
            {RightPanel}
          </SheetContent>
        </Sheet>
      </div>

      <SmartPasteDialog open={pasteOpen} onOpenChange={setPasteOpen} onApply={handlePasteApply} />
      <ManualLinkMaterialsDialog open={manualLinkOpen} onOpenChange={setManualLinkOpen} apostilaId={id as string} onLinked={reloadMaterials} />
      <FinalReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} onConfirm={() => executeTogglePublish(true)} title={title} content={content} exerciseCount={exerciseCount} materialCount={linkedMaterials.length} />

      <QuickAddSectionDialog 
        open={addSectionOpen} 
        onOpenChange={setAddSectionOpen} 
        onConfirm={handleQuickAddSection}
        suggestedTitle={suggestedSectionTitle}
      />

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Button 
          onClick={() => setAddSectionOpen(true)}
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 group active:scale-95"
        >
          <FilePlus2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
