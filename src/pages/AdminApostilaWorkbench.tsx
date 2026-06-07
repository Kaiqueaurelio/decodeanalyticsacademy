/**
 * AdminApostilaWorkbench — tela única de edição de uma apostila.
 *
 * Layout (desktop ≥ lg):
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ HealthBar (status, palavras, exercícios, materiais, publicar) │
 *   ├──────────────┬──────────────────────────────┬──────────────────┤
 *   │ Apostilas    │  Editor (MarkdownEditor)     │ Painel direito   │
 *   │ (lista +     │                              │ (Materiais /     │
 *   │  busca)      │                              │  Preview /       │
 *   │              │                              │  Exercícios /    │
 *   │              │                              │  Validação)      │
 *   └──────────────┴──────────────────────────────┴──────────────────┘
 *
 * Mobile: lista vira drawer, painel direito vira sheet inferior.
 *
 * Não substitui o AdminPage atual — é uma rota nova (/admin/apostilas/:id)
 * acessível pelo botão "Workbench" em cada card. Toda lógica de salvar é
 * autosave com debounce + Ctrl+S manual.
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
import { ApostilaHealthBar } from '@/components/admin/ApostilaHealthBar';
import { MaterialsDropZone } from '@/components/admin/MaterialsDropZone';
import { SortableMaterialsList, type LinkedMaterialItem } from '@/components/admin/SortableMaterialsList';
import { SmartPasteDialog } from '@/components/admin/SmartPasteDialog';
import { ManualLinkMaterialsDialog } from '@/components/ManualLinkMaterialsDialog';
import { autoLinkApostila } from '@/lib/auto-link-materials';
import { ApostilaContentRenderer } from '@/components/ApostilaContentRenderer';
import { guessSemesterFromCategory, SEMESTER_OPTIONS, COURSE_OPTIONS, type CourseCode } from '@/lib/subject-semester-map';
import {
  ArrowLeft, Search, Save, Eye, Sparkles, Wand2, Loader2, Menu, FileText,
  ListChecks, PanelRightClose, ExternalLink, GraduationCap, ImageIcon,
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

const AUTOSAVE_MS = 1500;

export default function AdminApostilaWorkbench() {
  const { id } = useParams<{ id: string }>();
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

  // Materiais e exercícios (apenas contagem na health bar; full no painel direito)
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
  const [rightTab, setRightTab] = useState<'materials' | 'preview' | 'exercises'>('materials');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const dirtyRef = useRef(false);
  const initialLoadRef = useRef(true);

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

  // === Carregar apostila atual + materiais + count exercícios ===
  const loadApostila = async (apostilaId: string) => {
    setLoading(true);
    initialLoadRef.current = true;
    const [{ data: ap }, { data: links, error: linksErr }, { count }] = await Promise.all([
      supabase.from('apostilas').select('id, title, category, content, published, semester, course, cover_url').eq('id', apostilaId).maybeSingle(),
      supabase.from('apostila_materials').select('id, sort_order, material_id').eq('apostila_id', apostilaId).order('sort_order'),
      supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('apostila_id', apostilaId),
    ]);

    if (!ap) {
      toast.error('Apostila não encontrada');
      navigate('/admin');
      return;
    }
    setTitle(ap.title || '');
    setCategory(ap.category || '');
    setContent(ap.content || '');
    setPublished(!!ap.published);
    setSemester((ap as any).semester ?? null);
    setCourse(((ap as any).course as CourseCode[] | null) ?? []);
    setCoverUrl(((ap as any).cover_url as string | null) ?? null);
    setExerciseCount(count || 0);

    // Hidrata títulos dos materiais
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

  // === Autosave (debounced) ===
  useEffect(() => {
    if (initialLoadRef.current || !id) return;
    dirtyRef.current = true;
    const t = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, category, content, semester, course]);

  const doSave = async () => {
    if (!id || !dirtyRef.current) return;
    setSaving(true);
    const { error } = await supabase
      .from('apostilas')
      .update({
        title: title.trim() || 'Sem título',
        category,
        content,
        semester,
        course: course.length ? course : null,
      })
      .eq('id', id);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar');
      return;
    }
    dirtyRef.current = false;
    setLastSavedAt(new Date());
    setApostilas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: title.trim() || 'Sem título', category, semester, course: course.length ? course : null, updated_at: new Date().toISOString() } : p))
    );
  };

  // Sugere semestre automaticamente quando a categoria muda e ainda não há semestre
  useEffect(() => {
    if (!category || semester) return;
    const guess = guessSemesterFromCategory(category);
    if (guess) setSemester(guess);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Ctrl+S manual
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        doSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, category, content, semester, course, id]);

  // === Publicar / despublicar ===
  const togglePublish = async () => {
    if (!id) return;
    const next = !published;
    setPublished(next);
    const { error } = await supabase.from('apostilas').update({ published: next }).eq('id', id);
    if (error) {
      setPublished(!next);
      toast.error('Falha ao alterar status');
    } else {
      toast.success(next ? 'Apostila publicada' : 'Voltou para rascunho');
      setApostilas((prev) => prev.map((p) => (p.id === id ? { ...p, published: next } : p)));
    }
  };

  // === Materiais — recarrega após mudanças ===
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

  const removeLink = async (linkId: string) => {
    await supabase.from('apostila_materials').delete().eq('id', linkId);
    setLinkedMaterials((prev) => prev.filter((m) => m.id !== linkId));
    toast.success('Material removido');
  };

  const handleAutoLink = async () => {
    if (!id) return;
    setAutoLinking(true);
    try {
      const r = await autoLinkApostila(id);
      if (r.linked > 0) {
        toast.success(`${r.linked} material(is) vinculado(s)!`);
        reloadMaterials();
      } else {
        toast.info('Nenhum match automático. Abrindo seleção manual...');
        setManualLinkOpen(true);
      }
    } catch {
      toast.error('Erro ao auto-vincular');
    } finally {
      setAutoLinking(false);
    }
  };

  // === Smart paste handler ===
  const handlePasteApply = (text: string, mode: 'append' | 'replace') => {
    setContent((prev) => mode === 'append' ? (prev ? prev + '\n\n' + text : text) : text);
    toast.success(mode === 'append' ? 'Conteúdo inserido' : 'Conteúdo substituído');
  };

  // === Gerar capa com IA ===
  const handleGenerateCover = async () => {
    if (!id) return;
    if (dirtyRef.current) await doSave();
    setGeneratingCover(true);
    const tId = toast.loading('Gerando capa com IA…');
    const { data, error } = await invokeFunction<{ cover_url: string }>('generate-apostila-cover', {
      body: { apostilaId: id },
      errorTitle: 'Falha ao gerar capa',
    });
    setGeneratingCover(false);
    toast.dismiss(tId);
    if (error || !data?.cover_url) return;
    setCoverUrl(data.cover_url);
    toast.success('Capa gerada e salva!');
  };


  // === Filtro lista ===
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apostilas;
    return apostilas.filter((a) =>
      a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [apostilas, search]);

  const baseSortOrder = linkedMaterials.length > 0
    ? Math.max(...linkedMaterials.map((m) => m.sort_order)) + 1
    : 0;

  if (!id) return null;

  // === Sidebar (lista) ===
  const SidebarList = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border space-y-2">
        <Button size="sm" variant="ghost" className="h-7 px-2 -ml-2 gap-1.5 text-xs" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Admin
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar apostilas…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-0.5">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => { navigate(`/admin/apostilas/${a.id}`); setSidebarOpen(false); }}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors',
                  a.id === id ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-muted/60',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', a.published ? 'bg-emerald-500' : 'bg-amber-500')} />
                  <span className="truncate">{a.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground ml-3.5 line-clamp-1">{a.category}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma apostila</p>
          )}
        </ul>
      </ScrollArea>
    </div>
  );

  // === Painel direito ===
  const RightPanel = (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)} className="flex flex-col h-full">
        <TabsList className="grid grid-cols-3 m-2">
          <TabsTrigger value="materials" className="text-xs gap-1"><FileText className="h-3 w-3" /> Materiais</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs gap-1"><Eye className="h-3 w-3" /> Preview</TabsTrigger>
          <TabsTrigger value="exercises" className="text-xs gap-1"><ListChecks className="h-3 w-3" /> Exerc.</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="flex-1 overflow-hidden p-3 pt-0 m-0">
          <div className="space-y-2">
            <MaterialsDropZone
              apostilaId={id}
              baseSortOrder={baseSortOrder}
              onUploaded={reloadMaterials}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleAutoLink} disabled={autoLinking}>
                {autoLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                Auto-vincular
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => setManualLinkOpen(true)}>
                <Search className="h-3 w-3" /> Da biblioteca
              </Button>
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              Vinculados ({linkedMaterials.length}) — arraste para reordenar
            </p>
            <ScrollArea className="h-[calc(100vh-380px)]">
              <SortableMaterialsList
                items={linkedMaterials}
                onReorder={setLinkedMaterials}
                onRemove={removeLink}
              />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-1">{title || 'Sem título'}</h2>
              <p className="text-xs text-muted-foreground mb-4">{category}</p>
              <ApostilaContentRenderer content={content} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="exercises" className="flex-1 overflow-hidden m-0 p-3">
          <div className="text-xs space-y-2">
            <p className="text-muted-foreground">
              Esta apostila tem <strong>{exerciseCount}</strong> exercício(s) cadastrado(s).
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => navigate('/admin?tab=apostilas')}
            >
              <ExternalLink className="h-3 w-3" />
              Gerenciar no Admin clássico
            </Button>
            <p className="text-[10px] text-muted-foreground">
              A criação/edição de exercícios continua no Admin clássico por enquanto.
              Em breve será integrada aqui.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <ApostilaHealthBar
        content={content}
        exerciseCount={exerciseCount}
        materialCount={linkedMaterials.length}
        published={published}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onTogglePublish={togglePublish}
        onFocusExercises={() => { setRightTab('exercises'); setRightOpen(true); }}
        onFocusMaterials={() => { setRightTab('materials'); setRightOpen(true); }}
      />

      {/* Toolbar do Workbench */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/50">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="ghost" className="lg:hidden h-7 gap-1.5 text-xs">
              <Menu className="h-3.5 w-3.5" /> Apostilas
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">{SidebarList}</SheetContent>
        </Sheet>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da apostila"
          className="h-7 text-sm font-semibold border-0 bg-transparent focus-visible:ring-0 px-1 max-w-md"
        />
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Disciplina"
          className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 px-1 max-w-[180px] text-muted-foreground"
        />

        {/* Semestre */}
        <Select
          value={semester ? String(semester) : 'none'}
          onValueChange={(v) => setSemester(v === 'none' ? null : Number(v))}
        >
          <SelectTrigger className="h-7 text-[11px] w-[110px] gap-1">
            <GraduationCap className="h-3 w-3 text-primary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Todos sem.</SelectItem>
            {SEMESTER_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>{s}º semestre</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cursos (chips multi-select) */}
        <div className="hidden md:flex items-center gap-0.5 rounded-md border border-border/60 p-0.5">
          {COURSE_OPTIONS.map((c) => {
            const active = course.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCourse((prev) => active ? prev.filter((x) => x !== c) : [...prev, c])}
                title={active ? `Remover ${c}` : `Incluir ${c}`}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {coverUrl && (
            <a
              href={coverUrl}
              target="_blank"
              rel="noreferrer"
              title="Ver capa atual"
              className="h-7 w-10 rounded border border-border overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/40 transition"
            >
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={handleGenerateCover}
            disabled={generatingCover}
            title="Gerar capa com IA baseada no tema da apostila"
          >
            {generatingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3 text-primary" />}
            {coverUrl ? 'Regerar capa' : 'Gerar capa IA'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setPasteOpen(true)}>
            <Sparkles className="h-3 w-3 text-primary" /> Colar inteligente
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => window.open(`/apostila/${id}`, '_blank')}>
            <Eye className="h-3 w-3" /> Ver como aluno
          </Button>
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={doSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar
          </Button>
          <Sheet open={rightOpen} onOpenChange={setRightOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="lg:hidden h-7 gap-1.5 text-xs">
                <PanelRightClose className="h-3.5 w-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">{RightPanel}</SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Conteúdo principal: 3 colunas (≥lg) ou apenas editor (mobile) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_360px] overflow-hidden">
        <div className="hidden lg:block overflow-hidden">{SidebarList}</div>

        <div className="overflow-auto bg-muted/10">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Comece a escrever a apostila ou use o botão 'Colar inteligente'…"
              onSave={doSave}
              showWordCount
            />
          )}
        </div>

        <div className="hidden lg:block overflow-hidden">{RightPanel}</div>
      </div>

      <SmartPasteDialog open={pasteOpen} onOpenChange={setPasteOpen} onApply={handlePasteApply} />
      <ManualLinkMaterialsDialog
        open={manualLinkOpen}
        onOpenChange={setManualLinkOpen}
        apostilaId={id}
        onLinked={reloadMaterials}
      />
    </div>
  );
}
