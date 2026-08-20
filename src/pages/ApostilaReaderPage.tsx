import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  CircleDot,
  Bookmark,
  BookmarkCheck,
  NotebookPen,
  Search as SearchIcon,
  Menu,
  X,
  Loader2,
  Clock,
  GraduationCap,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ShieldAlert,
  Calendar
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import logoOwl from "@/assets/owl-icon.png";
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuth } from "@/hooks/useAuth";
import { isPlaceholderPageContent, normalizeContentForComparison } from '@/lib/content-formatting';
import { Badge } from "@/components/ui/badge";
import { extractChronologyDates } from "@/lib/apostila-pages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";






interface Lesson {
  id: string;
  title: string;
  order_index: number;
  estimated_minutes: number | null;
  difficulty: string | null;
  content_status: string;
  progress_status: "in_progress" | "completed" | null;
  bookmarked: boolean;
  // Conteúdo local usado quando a página vem de apostila_pages, sem lição estruturada.
  content_md?: string;
}
interface Chapter {
  id: string;
  title: string;
  summary: string | null;
  order_index: number;
  estimated_minutes: number | null;
  lessons: Lesson[];
}
interface ModuleT {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  estimated_minutes: number | null;
  chapters: Chapter[];
}
interface Tree {
  apostila_id: string;
  modules: ModuleT[];
}

type FlatLesson = Lesson & { moduleTitle: string; chapterTitle: string; date?: string | null };

type ApostilaPageRow = {
  id: string;
  title: string;
  content: string;
  position: number;
};

function buildPagesModule(apostilaId: string, pages: ApostilaPageRow[]): ModuleT | null {
  if (pages.length === 0) return null;

  return {
    id: `pages-module-${apostilaId}`,
    title: 'Páginas da apostila',
    description: 'Conteúdo criado no editor de páginas',
    order_index: Number.MAX_SAFE_INTEGER,
    estimated_minutes: null,
    chapters: [{
      id: `pages-chapter-${apostilaId}`,
      title: 'Conteúdo adicional',
      summary: null,
      order_index: Number.MAX_SAFE_INTEGER,
      estimated_minutes: null,
      lessons: pages.map((page, index) => ({
        id: `page:${page.id}`,
        title: page.title || `Página ${index + 1}`,
        order_index: page.position ?? index,
        estimated_minutes: null,
        difficulty: null,
        content_status: 'ready',
        progress_status: null,
        bookmarked: false,
        content_md: page.content || '',
      })),
    }],
  };
}

function buildTreeFromPages(apostilaId: string, pages: ApostilaPageRow[]): Tree {
  const pagesModule = buildPagesModule(apostilaId, pages);
  return {
    apostila_id: apostilaId,
    modules: pagesModule ? [pagesModule] : [],
  };
}

function mergePagesIntoTree(tree: Tree, apostilaId: string, pages: ApostilaPageRow[]): Tree {
  const existingKeys = new Set(
    tree.modules.flatMap((module) => module.chapters.flatMap((chapter) => chapter.lessons))
      .map((lesson) => normalizeContentForComparison(lesson.content_md || ''))
      .filter(Boolean),
  );

  const distinctPages = pages.filter((page) => {
    if (isPlaceholderPageContent(page.content || '')) return false;
    const key = normalizeContentForComparison(page.content || '');
    if (!key) return false;
    if (existingKeys.has(key)) return false;
    
    // Verificação adicional: evita que a página seja uma subseção ou repetição do que já está na árvore
    // (Pode ocorrer se o RPC retornar partes do conteúdo que o editor também salvou)
    for (const existing of existingKeys) {
      if (existing.includes(key) || key.includes(existing)) return false;
    }
    
    existingKeys.add(key);
    return true;
  });
  const pagesModule = buildPagesModule(apostilaId, distinctPages);
  if (!pagesModule) return tree;

  // O RPC pode retornar módulos estruturados e também existir conteúdo criado
  // pelo editor em apostila_pages. Só anexamos páginas que ainda não estão na árvore.
  const alreadyIncluded = tree.modules.some((module) => module.id === pagesModule.id);
  if (alreadyIncluded) return tree;

  return {
    ...tree,
    modules: [...tree.modules, pagesModule],
  };
}

function flatten(tree: Tree): FlatLesson[] {
  const out: FlatLesson[] = [];
  for (const m of tree.modules) {
    for (const c of m.chapters) {
      for (const l of c.lessons) {
        const dateMatch = extractChronologyDates(l.title)[0] || extractChronologyDates(l.content_md)[0] || null;
        out.push({ ...l, moduleTitle: m.title, chapterTitle: c.title, date: dateMatch });

      }
    }
  }
  return out;
}

export default function ApostilaReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apostilaTitle, setApostilaTitle] = useState<string>("");
  const [apostilaStatus, setApostilaStatus] = useState<string>("liberada");
  const [hasInconsistency, setHasInconsistency] = useState(false);

  const [tree, setTree] = useState<Tree | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [loadingTree, setLoadingTree] = useState(true);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const [lessonContent, setLessonContent] = useState<string>("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (soundEnabled) {
      if (focusMode) playSound('focus-enter');
      else playSound('focus-exit');
    }
  }, [focusMode, soundEnabled]);
  const contentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();


  // Load apostila + tree
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoadingTree(true);
      const [{ data: ap }, { data: rpcData }, { data: pageRows }, { data: auditLogs }] = await Promise.all([
        supabase.from("apostilas").select("title, semester, published, status").eq("id", id).maybeSingle(),
        supabase.rpc("get_apostila_reader_tree", { _apostila_id: id }),
        (supabase.from("apostila_pages" as any) as any)
          .select("id, title, content, position")
          .eq("apostila_id", id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.from("audit_logs").select("id").eq("resource_id", id).eq("event_type", "apostila_date_inconsistency").limit(1)
      ]);

      
      if (cancelled) return;

      // Anti-collision check for pages with same position
      const sanitizedPages = (pageRows || []).map((p: any, idx: number) => ({
        ...p,
        position: p.position ?? idx
      }));
      
      console.log(`[ApostilaReader] Apostila info:`, ap);
      
      setApostilaTitle((ap?.title as string) || "Apostila");
      setApostilaStatus((ap as any)?.status || (ap?.published ? 'liberada' : 'bloqueada'));
      setHasInconsistency((auditLogs?.length || 0) > 0);
      
      if (ap?.status === 'em_manutencao' && !isAdmin) {
        toast.info("Material em revisão", {
          description: "Este conteúdo está sendo re-organizado para melhor leitura.",
          duration: 5000
        });
      }


      const rpcTree = (rpcData as unknown as Tree) || { apostila_id: id, modules: [] };
      const savedPages = sanitizedPages as ApostilaPageRow[];
      const t = savedPages.length > 0
        ? mergePagesIntoTree(rpcTree, id, savedPages)
        : (rpcTree.modules?.length > 0 ? rpcTree : buildTreeFromPages(id, savedPages));

      if (rpcTree.modules?.length === 0 && savedPages.length === 0) {
        console.warn(`[ApostilaReader] No structured lessons or saved pages found for ${id}.`);
      }

      setTree(t);
      const flat = flatten(t);
      
      // Retomar de onde parou: primeira in_progress ou primeira sem progresso
      const requestedLesson = searchParams.get("lesson");
      const resume =
        flat.find((l) => l.id === requestedLesson) ||
        flat.find((l) => l.progress_status === "in_progress") ||
        flat.find((l) => !l.progress_status) ||
        flat[0];
      if (resume) {
        setSelectedLessonId(resume.id);
        // Se a lição retomada tiver data, seleciona ela no filtro
        if (resume.date) setSelectedDate(resume.date);
      }

      setLoadingTree(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, searchParams]);

  const flat = useMemo(() => (tree ? flatten(tree) : []), [tree]);
  
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    flat.forEach(l => {
      if (l.date) dates.add(l.date);
    });
    return Array.from(dates).sort();
  }, [flat]);

  const filteredFlat = useMemo(() => {
    if (selectedDate === "all") return flat;
    return flat.filter(l => l.date === selectedDate || !l.date); // Mostra o conteúdo da data ou sem data (geral)
  }, [flat, selectedDate]);

  const currentIndex = filteredFlat.findIndex((l) => l.id === selectedLessonId);
  const currentLesson = currentIndex >= 0 ? filteredFlat[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? filteredFlat[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < filteredFlat.length - 1 ? filteredFlat[currentIndex + 1] : null;


  const totalLessons = flat.length;
  const completedLessons = flat.filter((l) => l.progress_status === "completed").length;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Carregar conteúdo da lição + nota + marcar em_progresso
  useEffect(() => {
    if (!selectedLessonId) {
      setLessonContent("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLessonLoading(true);

      // Páginas criadas pelo editor ficam em apostila_pages e usam IDs sintéticos
      // no fallback do leitor; não devem ser consultadas em apostila_lessons.
      if (selectedLessonId.startsWith('page:')) {
        setLessonContent(currentLesson?.content_md || '');
        const { data: pageUserData } = await supabase.auth.getUser();
        const pageUserId = pageUserData?.user?.id;
        if (pageUserId) {
          setNoteText(localStorage.getItem(`apostila_page_note_${pageUserId}_${selectedLessonId.slice(5)}`) || '');
        }
        setLessonLoading(false);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const { data: lesson } = await supabase
        .from("apostila_lessons")
        .select("content_md")
        .eq("id", selectedLessonId)
        .maybeSingle();
      if (cancelled) return;
      setLessonContent((lesson?.content_md as string) || "");
      // Nota do aluno
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const { data: note } = await supabase
          .from("apostila_lesson_notes")
          .select("body")
          .eq("user_id", userId)
          .eq("lesson_id", selectedLessonId)
          .maybeSingle();
        if (!cancelled) setNoteText((note?.body as string) || "");
        // Marca como em progresso (upsert)
        await supabase.from("apostila_lesson_progress").upsert(
          {
            user_id: userId,
            lesson_id: selectedLessonId,
            status:
              currentLesson?.progress_status === "completed" ? "completed" : "in_progress",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" },
        );
        setTree((t) => updateLessonInTree(t, selectedLessonId, (l) => ({
          ...l,
          progress_status: l.progress_status === "completed" ? "completed" : "in_progress",
        })));
      }
      setLessonLoading(false);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLessonId]);

  // Atalhos ← →
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName || "")) return;
      if (e.key === "ArrowLeft" && prevLesson) setSelectedLessonId(prevLesson.id);
      if (e.key === "ArrowRight" && nextLesson) setSelectedLessonId(nextLesson.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevLesson, nextLesson]);

  async function toggleComplete() {
    if (!selectedLessonId || !currentLesson) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    const nextStatus = currentLesson.progress_status === "completed" ? "in_progress" : "completed";
    if (selectedLessonId.startsWith('page:')) {
      setTree((t) => updateLessonInTree(t, selectedLessonId, (l) => ({
        ...l,
        progress_status: nextStatus as "completed" | "in_progress",
      })));
      toast.success(nextStatus === "completed" ? "Página concluída" : "Página marcada como em progresso");
      return;
    }
    await supabase.from("apostila_lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: selectedLessonId,
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    setTree((t) => updateLessonInTree(t, selectedLessonId, (l) => ({
      ...l,
      progress_status: nextStatus as "completed" | "in_progress",
    })));

    // Invalida cache para atualizar progresso no dashboard
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', userId] });
    queryClient.invalidateQueries({ queryKey: ['apostilas', 'list'] });

    toast.success(nextStatus === "completed" ? "Lição concluída" : "Marcada como em progresso");

    if (nextStatus === "completed" && nextLesson) {
      setTimeout(() => setSelectedLessonId(nextLesson.id), 400);
    }
  }

  async function toggleBookmark() {
    if (!selectedLessonId || !currentLesson) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    if (selectedLessonId.startsWith('page:')) {
      setTree((t) => updateLessonInTree(t, selectedLessonId, (l) => ({
        ...l,
        bookmarked: !l.bookmarked,
      })));
      return;
    }
    if (currentLesson.bookmarked) {
      await supabase
        .from("apostila_lesson_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("lesson_id", selectedLessonId);
    } else {
      await supabase
        .from("apostila_lesson_bookmarks")
        .insert({ user_id: userId, lesson_id: selectedLessonId });
    }
    setTree((t) => updateLessonInTree(t, selectedLessonId, (l) => ({
      ...l,
      bookmarked: !l.bookmarked,
    })));
  }

  async function saveNote() {
    if (!selectedLessonId) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    setNoteSaving(true);
    if (selectedLessonId.startsWith('page:')) {
      try {
        localStorage.setItem(`apostila_page_note_${userId}_${selectedLessonId.slice(5)}`, noteText);
        setNoteSaving(false);
        toast.success("Nota salva neste dispositivo");
      } catch {
        setNoteSaving(false);
        toast.error("Não foi possível salvar a nota nesta página");
      }
      return;
    }
    const { error } = await supabase.from("apostila_lesson_notes").upsert(
      {
        user_id: userId,
        lesson_id: selectedLessonId,
        body: noteText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    setNoteSaving(false);
    if (error) toast.error("Não foi possível salvar a nota");
    else toast.success("Nota salva");
  }

  // Busca dentro da apostila
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flat
      .filter((l) =>
        l.title.toLowerCase().includes(q) ||
        l.chapterTitle.toLowerCase().includes(q) ||
        l.moduleTitle.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [searchQuery, flat]);

  if (loadingTree) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tree || !flat || flat.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-primary/40 mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Material em fase de estruturação</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Esta apostila ainda não foi organizada em módulos e lições. Peça a um administrador
          para executar a estruturação, ou continue pelo leitor clássico.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="default" size="lg" className="hover-lift" onClick={() => navigate(`/apostila/${id}`)}>
            Ir para o leitor clássico
          </Button>
          <Button variant="outline" size="lg" className="hover-lift" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden flex-col md:flex-row relative">
      {(apostilaStatus === 'em_manutencao' || hasInconsistency) && (
        <div className="absolute top-0 left-0 right-0 z-[60] bg-amber-500/90 backdrop-blur-md text-black py-2 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldAlert className="h-4 w-4 shrink-0 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider truncate">
              {apostilaStatus === 'em_manutencao' 
                ? "Este conteúdo está passando por uma revisão de qualidade."
                : "Inconsistência cronológica detectada. Aguarde a correção do instrutor."}
            </span>
          </div>
          <Badge variant="outline" className="border-black/20 text-[9px] font-bold bg-white/20 whitespace-nowrap ml-2">
            MODO DE LEITURA RESTRITO
          </Badge>
        </div>
      )}
      {/* Logo persistente — sempre visível durante a leitura (Desktop) */}

      <div className="pointer-events-none fixed bottom-4 right-4 z-30 hidden max-w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-primary/40 bg-background/90 px-4 py-3 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] backdrop-blur-xl lg:flex xl:bottom-6 xl:right-6 xl:gap-4 xl:px-5 xl:py-4">
        <img
          src={logoOwl}
          alt="Decode Analytics Academy"
          width={96}
          height={96}
          className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.7)] xl:h-20 xl:w-20 2xl:h-24 2xl:w-24"
        />
        <div className="flex flex-col">
          <span className="font-display text-base font-black leading-none tracking-normal text-foreground xl:text-lg">
            DECODE ANALYTICS
          </span>
          <span className="mt-1 font-display text-xs font-bold tracking-normal text-primary xl:text-sm">
            ACADEMY
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground/60 tabular-nums">v4.8.0</span>
        </div>
      </div>


      {/* Sidebar TOC — desktop */}

      <aside
        className={cn(
          "hidden md:flex md:w-[320px] shrink-0 border-r border-border/60 bg-card/50 flex-col transition-all duration-500",
          focusMode && "md:w-0 md:opacity-0 md:pointer-events-none border-none"
        )}
      >
        <SidebarInner
          apostilaTitle={apostilaTitle}
          tree={tree}
          selectedLessonId={selectedLessonId}
          onSelect={(lid) => setSelectedLessonId(lid)}
          progressPct={progressPct}
          completedLessons={completedLessons}
          totalLessons={totalLessons}
          onBack={() => navigate(`/apostila/${id}`)}
        />
      </aside>

      {/* Sidebar TOC — mobile drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTocOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[300px] max-w-[85%] bg-card border-r border-border shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold">Índice</span>
              <button aria-label="Fechar" onClick={() => setTocOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarInner
              apostilaTitle={apostilaTitle}
              tree={tree}
              selectedLessonId={selectedLessonId}
              onSelect={(lid) => {
                setSelectedLessonId(lid);
                setTocOpen(false);
              }}
              progressPct={progressPct}
              completedLessons={completedLessons}
              totalLessons={totalLessons}
              onBack={() => navigate(`/apostila/${id}`)}
            />
          </div>
        </div>
      )}

      {/* Top Banner Alert */}
      {(hasInconsistency || apostilaStatus === 'em_manutencao') && (
        <div className={cn(
          "shrink-0 px-4 py-2 flex items-center justify-between text-[11px] font-bold tracking-tight z-50",
          hasInconsistency ? "bg-red-500/20 text-red-400 border-b border-red-500/30" : "bg-ciano/10 text-ciano border-b border-ciano/20"
        )}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" />
            <span>
              {hasInconsistency 
                ? "CRÍTICO: Este material apresenta inconsistências cronológicas e está em revisão." 
                : "INFORMAÇÃO: Este material está sendo reorganizado pela tutoria."}
            </span>
          </div>
          {isAdmin && hasInconsistency && (
            <Button 
              variant="link" 
              className="h-auto p-0 text-[10px] text-red-400 underline"
              onClick={() => navigate(`/admin/apostilas/${id}`)}
            >
              Corrigir agora
            </Button>
          )}
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex min-w-0 flex-col">

        {/* Top bar */}
        <div className={cn(
          "sticky top-0 z-20 flex min-h-16 items-center gap-1.5 border-b border-border/60 bg-background/95 px-2 py-2 backdrop-blur sm:gap-2 sm:px-3 md:min-h-[4.5rem] md:px-5 transition-all duration-500",
          focusMode && "opacity-0 pointer-events-none -translate-y-full min-h-0 h-0 border-none"
        )}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card ring-1 ring-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.35)] sm:h-14 sm:w-14 md:h-16 md:w-16">
            <img
              src={logoOwl}
              alt="Decode Analytics Academy"
              width={128}
              height={128}
              className="h-9 w-9 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14"
            />
          </span>

          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setTocOpen(true)}
            aria-label="Abrir índice"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span>{currentLesson?.moduleTitle} · {currentLesson?.chapterTitle}</span>
              {currentLesson?.date && (
                <Badge variant="outline" className="h-3.5 text-[8px] py-0 border-primary/30 text-primary">
                  {currentLesson.date}
                </Badge>
              )}
            </div>
            <div className="truncate font-display text-base font-semibold flex items-center gap-3">
              <span className="truncate">{currentLesson?.title || "Selecione uma lição"}</span>
              
              {availableDates.length > 0 && (
                <div className="hidden sm:block ml-2 w-32 shrink-0">
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="h-7 text-[10px] bg-card/50 border-roxo/30 hover:border-roxo/50 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-roxo" />
                        <SelectValue placeholder="Filtrar data" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A15] border-white/10">
                      <SelectItem value="all" className="text-xs">Todas as aulas</SelectItem>
                      {availableDates.map(date => (
                        <SelectItem key={date} value={date} className="text-xs">{date}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}


            </div>

          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar"
          >
            <SearchIcon className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
          <button
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent",
              currentLesson?.bookmarked && "text-primary",
            )}
            onClick={toggleBookmark}
            aria-label="Favoritar lição"
          >
            {currentLesson?.bookmarked ? (
              <BookmarkCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
            ) : (
              <Bookmark className="h-4.5 w-4.5" strokeWidth={1.75} />
            )}
          </button>
          <button
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent",
              noteOpen && "bg-accent",
            )}
            onClick={() => setNoteOpen((v) => !v)}
            aria-label="Notas"
          >
            <NotebookPen className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
          <button
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent",
              marksOpen && "bg-accent",
            )}
            onClick={() => setMarksOpen((v) => !v)}
            aria-label="Marcadores e Seções"
          >
            <BookmarkCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
          <Button
            size="sm"
            variant={currentLesson?.progress_status === "completed" ? "secondary" : "default"}
            onClick={toggleComplete}
            className="ml-1 hidden sm:inline-flex"
          >
            {currentLesson?.progress_status === "completed" ? (
              <>
                <Check className="mr-1.5 h-4 w-4" /> Concluída
              </>
            ) : (
              "Marcar concluída"
            )}
          </Button>
        </div>

        {searchOpen && (
          <div className="border-b border-border/60 bg-background/95 backdrop-blur px-3 py-2 md:px-6 animate-in slide-in-from-top duration-200">
            <Input
              autoFocus
              placeholder="Buscar lição, capítulo ou módulo..."
              className="h-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-md border">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedLessonId(r.id);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left last:border-0 hover:bg-accent"
                  >
                    <div className="text-xs text-muted-foreground">
                      {r.moduleTitle} · {r.chapterTitle}
                    </div>
                    <div className="text-sm font-medium">{r.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          <div className="fixed bottom-6 left-6 z-50 flex gap-2">
            <button
              onClick={() => {
                setFocusMode(!focusMode);
                if (soundEnabled) playSound('click');
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/40 backdrop-blur-md transition-all hover:bg-primary/30",
                focusMode ? "opacity-100 scale-100 shadow-[0_0_20px_rgba(0,240,255,0.3)]" : "opacity-0 scale-90 md:opacity-40 md:scale-100 hover:opacity-100"
              )}
              title={focusMode ? "Sair do Modo Foco" : "Entrar no Modo Foco"}
            >
              {focusMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            
            {focusMode && (
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/40 backdrop-blur-md transition-all hover:bg-primary/30"
                title={soundEnabled ? "Desativar Sons" : "Ativar Sons"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}
          </div>

          <div 
            ref={contentRef} 
            className={cn(
              "h-full overflow-y-auto scroll-smooth transition-all duration-500",
              focusMode && "bg-background"
            )}
          >
            <div className={cn(
              "mx-auto w-full px-5 py-8 md:px-10 md:py-12 transition-all duration-500",
              focusMode ? "max-w-3xl py-16 md:py-24" : "max-w-[68ch]"
            )}>
              {lessonLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {currentLesson?.difficulty || "iniciante"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {currentLesson?.estimated_minutes || 12} min
                  </span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
                  {currentLesson?.title}
                </h1>
                <article className="reader-prose mt-6">
                  {lessonContent ? (
                    <ReactMarkdown>{lessonContent}</ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-border/40 bg-muted/5">
                      <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary/30" />
                      </div>
                      <div className="space-y-1.5 max-w-sm px-4">
                        <h3 className="text-lg font-bold">Sem material disponível por enquanto</h3>
                        <p className="text-sm text-muted-foreground">
                          O conteúdo detalhado desta lição está sendo finalizado. Explore outros capítulos enquanto isso!
                        </p>
                      </div>
                    </div>
                  )}

                </article>
              </>
            )}



            {/* Prev / Next */}
            <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-between">
              {prevLesson ? (
                <button
                  onClick={() => setSelectedLessonId(prevLesson.id)}
                  className="group flex flex-1 items-center gap-3 rounded-lg border border-border/60 p-4 text-left hover:bg-accent"
                >
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Anterior
                    </div>
                    <div className="truncate font-medium">{prevLesson.title}</div>
                  </div>
                </button>
              ) : (
                <div className="flex-1" />
              )}
              {nextLesson ? (
                <button
                  onClick={() => setSelectedLessonId(nextLesson.id)}
                  className="group flex flex-1 items-center justify-end gap-3 rounded-lg border border-border/60 p-4 text-right hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Próxima
                    </div>
                    <div className="truncate font-medium">{nextLesson.title}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>

      {/* Notes drawer */}
      {noteOpen && (
        <aside className="fixed right-0 top-0 z-30 flex h-[100dvh] w-full max-w-[360px] flex-col border-l border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Suas anotações</span>
            <button aria-label="Fechar" onClick={() => setNoteOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva aqui suas anotações sobre esta lição..."
              className="h-full min-h-[300px] resize-none"
            />
          </div>
          <div className="border-t px-4 py-3">
            <Button className="w-full" onClick={saveNote} disabled={noteSaving}>
              {noteSaving ? "Salvando..." : "Salvar anotação"}
            </Button>
          </div>
        </aside>
      )}

      {/* Marks drawer */}
      {marksOpen && (
        <aside className="fixed right-0 top-0 z-30 flex h-[100dvh] w-full max-w-[360px] flex-col border-l border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Marcadores e Seções</span>
            <button aria-label="Fechar" onClick={() => setMarksOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Seções da Lição</h4>
                <div className="space-y-2">
                  {/* Seções dinâmicas baseadas no markdown poderiam vir aqui */}
                  <p className="text-xs text-muted-foreground italic px-2">Navegue rapidamente entre as seções desta lição.</p>
                  <Button variant="ghost" className="w-full justify-start text-sm py-2 h-auto" onClick={() => contentRef.current?.scrollTo({top: 0, behavior: 'smooth'})}>
                    Início da lição
                  </Button>
                </div>
              </div>
              
              <Separator />

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Itens Marcados</h4>
                <div className="space-y-2">
                  {flat.filter(l => l.bookmarked).map(l => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLessonId(l.id);
                        setMarksOpen(false);
                      }}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-lg border border-border/60 p-3 text-left hover:bg-accent transition-colors",
                        selectedLessonId === l.id && "border-primary/40 bg-primary/5"
                      )}
                    >
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                        {l.moduleTitle} · {l.chapterTitle}
                      </div>
                      <div className="text-sm font-medium line-clamp-1">{l.title}</div>
                    </button>
                  ))}
                  {flat.filter(l => l.bookmarked).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-border/40 rounded-xl">
                      <Bookmark className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma lição favoritada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}

function updateLessonInTree(
  t: Tree | null,
  lessonId: string,
  fn: (l: Lesson) => Lesson,
): Tree | null {
  if (!t) return t;
  return {
    ...t,
    modules: t.modules.map((m) => ({
      ...m,
      chapters: m.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => (l.id === lessonId ? fn(l) : l)),
      })),
    })),
  };
}

function SidebarInner({
  apostilaTitle,
  tree,
  selectedLessonId,
  onSelect,
  progressPct,
  completedLessons,
  totalLessons,
  onBack,
}: {
  apostilaTitle: string;
  tree: Tree;
  selectedLessonId: string | null;
  onSelect: (id: string) => void;
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
  onBack: () => void;
}) {
  return (
    <>
      <div className="border-b border-border/60 px-4 py-4">
        <button
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <div className="font-display text-base font-semibold leading-tight">
          {apostilaTitle}
        </div>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>Progresso</span>
            <span>
              {completedLessons}/{totalLessons} · {progressPct}%
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 py-3">
          {tree.modules.map((m) => (
            <ModuleBlock
              key={m.id}
              module={m}
              selectedLessonId={selectedLessonId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

function ModuleBlock({
  module: mod,
  selectedLessonId,
  onSelect,
}: {
  module: ModuleT;
  selectedLessonId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
        />
        <span className="line-clamp-1">{mod.title}</span>
      </button>
      {open && (
        <div className="ml-2 border-l border-border/50 pl-2">
          {mod.chapters.map((c) => (
            <ChapterBlock
              key={c.id}
              chapter={c}
              selectedLessonId={selectedLessonId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterBlock({
  chapter,
  selectedLessonId,
  onSelect,
}: {
  chapter: Chapter;
  selectedLessonId: string | null;
  onSelect: (id: string) => void;
}) {
  const containsSelected = chapter.lessons.some((l) => l.id === selectedLessonId);
  const [open, setOpen] = useState(containsSelected);
  useEffect(() => {
    if (containsSelected) setOpen(true);
  }, [containsSelected]);
  return (
    <div className="my-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-1.5 py-1 text-left text-[13px] font-medium text-foreground/85 hover:text-foreground"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
        <span className="line-clamp-1">{chapter.title}</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-border/40 pl-2">
          {chapter.lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] leading-snug hover:bg-accent",
                selectedLessonId === l.id && "bg-primary/10 text-primary font-medium",
              )}
            >
              {l.progress_status === "completed" ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : l.progress_status === "in_progress" ? (
                <CircleDot className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              )}
              <span className="line-clamp-2 flex-1">{l.title}</span>
              {l.bookmarked && (
                <BookmarkCheck className="h-3 w-3 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
