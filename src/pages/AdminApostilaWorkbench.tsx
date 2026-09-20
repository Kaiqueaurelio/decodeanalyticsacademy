/**
 * AdminApostilaWorkbench — tela única de edição de uma apostila (Notion Pro Style).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { guessSemesterFromCategory, SEMESTER_OPTIONS, type CourseCode } from '@/lib/subject-semester-map';
import { ensureApostilaExists } from '@/lib/create-placeholder-apostila';
import { Badge } from '@/components/ui/badge';
import { getSubjectColor } from '@/lib/subject-colors';
import { parseApostilaContent } from '@/lib/apostila-parser';
import { createApostilaPage, type ApostilaPage, upsertApostilaPage, validateApostilaChronology, splitApostilaByDate, extractChronologyDates, getApostilaPageSavedDate, getLocalDateIso, isMissingApostilaPageSavedDateColumn, sortApostilaPagesChronologically } from '@/lib/apostila-pages';
import { saveApostilaWithRevision, saveApostilaPageWithRevision } from '@/lib/apostila-persistence';
import { recordApostilaOperation, runApostilaChronologyValidation } from '@/lib/apostila-diagnostics';
import { ApostilaSplitPreview } from '@/components/admin/ApostilaSplitPreview';


import { NewApostilaPageButton } from '@/components/NewApostilaPageButton';

import {
  ArrowLeft, Search, Save, Eye, PenTool, Wand2, Loader2, Menu, FileText,
  ListChecks, PanelRightClose, ExternalLink, GraduationCap, ImageIcon, PanelRightOpen, X, Maximize2, Minimize2,
  FilePlus2, Plus, Scissors, Clock
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
const PAGE_LOAD_RETRY_LIMIT = 3;
const WORKBENCH_SIDEBAR_STORAGE_KEY = 'admin_workbench_sidebar_collapsed_v1';

interface WorkbenchProps {
  overrideId?: string;
  onBack?: () => void;
}

export default function AdminApostilaWorkbench({ overrideId, onBack }: WorkbenchProps = {}) {
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const id = overrideId || routeId;
  const selectedPageId = searchParams.get('page');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estado da lista lateral
  const [apostilas, setApostilas] = useState<ApostilaLite[]>([]);
  const [search, setSearch] = useState('');

  // Estado da apostila atual
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [semester, setSemester] = useState<number | null>(null);
  const [course, setCourse] = useState<CourseCode[]>([]);
  const splitRequestHandledRef = useRef<string | null>(null);

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
  const [creatingPage, setCreatingPage] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [manualLinkOpen, setManualLinkOpen] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [splitPreviewOpen, setSplitPreviewOpen] = useState(false);
  const [splitPreviewData, setSplitPreviewData] = useState<{ pages: any[]; totalDates: number }>({ pages: [], totalDates: 0 });


  const [reviewOpen, setReviewOpen] = useState(false);
  const [rightTab, setRightTab] = useState<'materials' | 'preview' | 'exercises'>('materials');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(WORKBENCH_SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [rightOpen, setRightOpen] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [suggestedSectionTitle, setSuggestedSectionTitle] = useState('');
  const [pages, setPages] = useState<ApostilaPage[]>([]);
  const [savedDate, setSavedDate] = useState<string>(getLocalDateIso());
  const [contentRevision, setContentRevision] = useState(0);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    if (searchParams.get('expanded') === '1') setEditorExpanded(true);
  }, [searchParams]);

  const dirtyRef = useRef(false);
  // Monotonic draft revision: an older response must never mark a newer edit as saved.
  const draftVersionRef = useRef(0);
  const initialLoadRef = useRef(true);
  const loadRequestRef = useRef(0);
  const pageLoadRetryRef = useRef(0);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const creatingPageRef = useRef(false);
  const createPersistedPageRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Filter logic for sidebar
  const filteredApostilas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apostilas;
    return apostilas.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [apostilas, search]);

  // === Carregar lista lateral ===
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('apostilas')
        .select('id, title, category, published, updated_at, semester, course')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) {
        console.error('[Workbench] Falha ao carregar lista de apostilas:', error);
        toast.error('Não foi possível carregar a lista de apostilas. Tente novamente.');
        return;
      }
      setApostilas((data as ApostilaLite[]) || []);
    })();
  }, []);

  // === Carregar apostila atual ===
  const loadApostila = async (apostilaId: string) => {
    const requestId = ++loadRequestRef.current;
    const isCurrentRequest = () => loadRequestRef.current === requestId;

    setLoading(true);
    setLoadError(null);
    initialLoadRef.current = true;
    const results = await Promise.allSettled([
      supabase.from('apostilas').select('*').eq('id', apostilaId).maybeSingle(),
      supabase.from('apostila_materials').select('id, sort_order, material_id').eq('apostila_id', apostilaId).order('sort_order'),
      supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('apostila_id', apostilaId),
      supabase.from('apostila_pages').select('*').eq('apostila_id', apostilaId).order('position'),
    ]);

    const apRes = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: new Error('Network error') };
    const linksRes = results[1].status === 'fulfilled' ? results[1].value : { data: null, error: new Error('Falha ao carregar materiais da apostila.') } as any;
    const countRes = results[2].status === 'fulfilled' ? results[2].value : { count: 0, error: new Error('Falha ao carregar exercícios da apostila.') } as any;

    if (!isCurrentRequest()) return;

    const pageResult = results[3].status === 'fulfilled'
      ? results[3].value
      : { data: null, error: new Error('Network error') };
    const loadErrors = [apRes.error, linksRes.error, countRes.error, pageResult.error].filter(Boolean);
    if (loadErrors.length > 0) {
      console.error('[Workbench] Falha ao carregar dados da apostila:', loadErrors);
      setLoadError('Não foi possível carregar a apostila e suas páginas. Isso não significa que o conteúdo foi apagado. Verifique sua conexão e tente novamente.');
      setLoading(false);
      return;
    }

    const ap = apRes.data;
    const links = linksRes.data;
    const count = countRes.count;

    if (!ap) {
      if (apostilaId && apostilaId.startsWith('placeholder')) {
        try {
          const realId = await ensureApostilaExists({ id: apostilaId, title: '' });
          // Redireciona para o ID real e limpa o parâmetro 'page' para carregar a nova estrutura
          navigate(`/admin/apostilas/${realId}`, { replace: true });
          return;
        } catch (err: any) {
          console.error('Erro ao resolver placeholder:', err);
          toast.error('Erro ao criar disciplina a partir da grade.');
          if (onBack) onBack(); else navigate('/admin');
          return;
        }
      }
      
      // Se não for placeholder mas não encontrou, talvez seja um erro de carregamento
      toast.error('Apostila não encontrada');
      if (onBack) onBack();
      else navigate('/admin');
      return;
    }

    // Backups são isolados por escopo: a apostila principal nunca reutiliza o
    // backup de uma página filha, e uma página filha nunca reutiliza outra.
    const backupScope = selectedPageId || 'main';
    const backupKey = `apostila_backup_${apostilaId}_${backupScope}`;
    const localBackupRaw = localStorage.getItem(backupKey);
    let localBackup: { title?: string; category?: string; content?: string; semester?: number | null; course?: CourseCode[]; saved_date?: string | null; timestamp?: string; scope?: string } | null = null;
    try {
      if (localBackupRaw) localBackup = JSON.parse(localBackupRaw);
    } catch (e) {
      console.error('Erro ao ler backup local:', e);
    }

    const applyMainState = (source: { title?: string; category?: string; content?: string; semester?: number | null; course?: CourseCode[]; saved_date?: string | null; updated_at?: string | null; created_at?: string | null }) => {
      setTitle(source.title || '');
      setCategory(source.category || '');
      setContent(source.content || '');
      setSemester(source.semester ?? null);
      setCourse(source.course ?? []);
      // A data precisa ser carregada junto com a apostila; antes ela ficava
      // apenas no estado inicial e o campo do topo aparentava não salvar.
      setSavedDate(source.saved_date || getApostilaPageSavedDate(source) || getLocalDateIso());
    };

    const mainState = {
      title: ap.title || '',
      category: ap.category || '',
      content: ap.content || (ap as any).content_backup || '',
      semester: (ap as any).semester ?? null,
      course: ((ap as any).course as CourseCode[] | null) ?? [],
      saved_date: (ap as any).saved_date ?? null,
      updated_at: ap.updated_at,
      created_at: ap.created_at,
    };

    if (!selectedPageId && localBackup?.scope === 'main' && localBackup.timestamp && new Date(localBackup.timestamp) > new Date(ap.updated_at)) {
      toast.info('Recuperamos uma versão não salva localmente.', {
        description: `Última alteração local em ${new Date(localBackup.timestamp).toLocaleTimeString()}`,
        action: {
          label: 'Descartar',
          onClick: () => localStorage.removeItem(backupKey)
        }
      });
      applyMainState(localBackup);
    } else {
      applyMainState(mainState);
    }

    setPublished(!!ap.published);
    setCoverUrl(((ap as any).cover_url as string | null) ?? null);
    setContentRevision(Number((ap as any).content_revision ?? 0));
    setExerciseCount(count || 0);

    const loadedPages = (pageResult.data || []) as ApostilaPage[];
    setPages(sortApostilaPagesChronologically(loadedPages));
    
    // Uma página filha só é selecionada quando o registro retornado pertence à
    // apostila atual. Não apagamos o parâmetro silenciosamente: isso fazia uma
    // criação bem-sucedida parecer que continuava na página anterior.
    const selectedPage = loadedPages.find((page) => page.id === selectedPageId && page.apostila_id === apostilaId);
    if (selectedPage) {
      pageLoadRetryRef.current = 0;
      const pageScope = selectedPage.id;
      const pageBackupKey = `apostila_backup_${apostilaId}_${pageScope}`;
      const pageBackupRaw = localStorage.getItem(pageBackupKey);
      let pageBackup: { title?: string; content?: string; saved_date?: string | null; timestamp?: string; scope?: string } | null = null;
      try {
        if (pageBackupRaw) pageBackup = JSON.parse(pageBackupRaw);
      } catch (e) {
        console.error('Erro ao ler backup local da página:', e);
      }

      setContent(selectedPage.content || '');
      setTitle(selectedPage.title || '');
      setSavedDate(getApostilaPageSavedDate(selectedPage) || getLocalDateIso());
      setContentRevision(Number((selectedPage as any).content_revision ?? 0));
      if (pageBackup?.scope === pageScope && pageBackup.timestamp && new Date(pageBackup.timestamp) > new Date(selectedPage.updated_at)) {
        toast.info('Recuperamos uma edição não salva desta página.', {
          description: `Última alteração local em ${new Date(pageBackup.timestamp).toLocaleTimeString()}`,
          action: { label: 'Descartar', onClick: () => localStorage.removeItem(pageBackupKey) }
        });
        setContent(pageBackup.content || '');
        setTitle(pageBackup.title || selectedPage.title || '');
        setSavedDate(pageBackup.saved_date || getApostilaPageSavedDate(selectedPage) || getLocalDateIso());
      }
    } else if (selectedPageId) {
      pageLoadRetryRef.current += 1;
      if (pageLoadRetryRef.current <= PAGE_LOAD_RETRY_LIMIT) {
        toast.error('A nova página ainda não foi sincronizada. Tentando carregar novamente.');
        setLoading(false);
        window.setTimeout(() => {
          if (loadRequestRef.current === requestId) void loadApostila(apostilaId);
        }, 300);
      } else {
        setLoadError('A página criada ainda não apareceu no servidor. Nenhum conteúdo foi apagado. Use “Tentar novamente” após confirmar sua conexão.');
        setLoading(false);
      }
      return;
    }

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
    window.setTimeout(() => {
      if (isCurrentRequest()) initialLoadRef.current = false;
    }, 100);
  };

  useEffect(() => {
    pageLoadRetryRef.current = 0;
    if (id) void loadApostila(id);
  }, [id, selectedPageId]);

  useEffect(() => {
    const handleKeyAdd = () => {
      void createPersistedPageRef.current();
    };

    window.addEventListener('open-quick-add-section' as any, handleKeyAdd);
    return () => window.removeEventListener('open-quick-add-section' as any, handleKeyAdd);
  }, []);

  const toggleSidebar = () => {
    const isDesktop = typeof window === 'undefined'
      || typeof window.matchMedia !== 'function'
      || window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      setSidebarCollapsed((current) => !current);
      setSidebarOpen(false);
      return;
    }

    setSidebarOpen((current) => !current);
  };

  const collapseSidebar = () => {
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  };

  const expandSidebar = () => {
    setSidebarCollapsed(false);
    setSidebarOpen(true);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(WORKBENCH_SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // O editor continua funcional quando o navegador bloqueia armazenamento local.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    (window as any).triggerSplitByDate = (apostilaId: string, contentOverride?: string) => {
      void handleSplitByDate(contentOverride);
    };
    
    // Inject ID for the header to use in preview link
    if (id) {
      (window as any).__apostila_id = id;
    }

    return () => { 
      delete (window as any).triggerSplitByDate;
      delete (window as any).__apostila_id;
    };
  }, [id]);


  // === Autosave & Diagnostics ===
  useEffect(() => {
    if (initialLoadRef.current || !id) return;
    draftVersionRef.current += 1;
    dirtyRef.current = true;
    setHasPendingChanges(true);
    const t = window.setTimeout(() => {
      // All saves, including autosave, must use the single-flight queue below.
      void doSave();
    }, AUTOSAVE_MS);

    
    // Backup local com escopo
    const backupScope = selectedPageId || 'main';
    const backupKey = `apostila_backup_${id}_${backupScope}`;
    localStorage.setItem(backupKey, JSON.stringify({
      scope: backupScope,
      title,
      category,
      content,
      semester,
      course,
      saved_date: savedDate,
      timestamp: new Date().toISOString()
    }));

    return () => window.clearTimeout(t);
  }, [id, selectedPageId, title, category, content, semester, course, savedDate]);

  const persistChanges = async (isManual = false): Promise<boolean> => {
    if (!id) return false;
    if (!dirtyRef.current) {
      if (isManual) toast.info('Nenhuma alteração pendente para salvar.');
      return true;
    }
    setSaving(true);
    const saveDraftVersion = draftVersionRef.current;

    const operationId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `save-${Date.now()}`;
    const operationType = selectedPageId ? 'page_update' : 'apostila_update';
    const snapshots = selectedPageId
      ? pages.map((page) => page.id === selectedPageId ? { ...page, title, content, saved_date: savedDate } : page)
      : pages;
    const chronology = validateApostilaChronology({ title, content, pages: snapshots, saved_date: selectedPageId ? undefined : savedDate });

    void recordApostilaOperation({
      operationId,
      apostilaId: id,
      pageId: selectedPageId,
      operationType,
      phase: 'save',
      status: 'started',
      metadata: {
        isManual,
        title,
        position: selectedPageId ? snapshots.find((page) => page.id === selectedPageId)?.position ?? null : null,
        chronologyStatus: chronology.status,
        chronologyIssueCodes: chronology.issues.map((issue) => issue.code),
      },
    });

    console.log(`[Workbench] Persisting ${operationType}`, {
      operationId,
      apostilaId: id,
      pageId: selectedPageId || null,
      chronology,
    });

    const visibleChronologyIssues = chronology.issues.filter((issue) => (
      issue.code !== 'page_dates_out_of_order' && issue.code !== 'page_content_dates_out_of_order'
    ));
    if (visibleChronologyIssues.length > 0) {
      console.warn('[Workbench] Inconsistência cronológica detectada:', chronology);
      toast.warning(
        visibleChronologyIssues[0].message + ' A operação será registrada para revisão administrativa.',
        { duration: 6000 },
      );
    }

    if (selectedPageId) {
      if (selectedPageId.startsWith('placeholder')) {
        console.error('[Workbench] Cannot save to placeholder page ID', { operationId, selectedPageId });
        void recordApostilaOperation({
          operationId,
          apostilaId: id,
          pageId: selectedPageId,
          operationType,
          phase: 'save',
          status: 'blocked',
          errorCode: 'placeholder_page_id',
          errorMessage: 'Uma página placeholder não pode receber autosave.',
          metadata: { selectedPageId },
        });
        setSaving(false);
        return false;
      }

      const pageUpdate = {
        content,
        title: title.trim() || 'Nova Página',
        saved_date: savedDate || getLocalDateIso(),
      };
      const { data: savedPageRows, error } = await saveApostilaPageWithRevision({
        pageId: selectedPageId,
        apostilaId: id,
        expectedRevision: contentRevision,
        title: pageUpdate.title,
        content: pageUpdate.content,
        savedDate: pageUpdate.saved_date,
      });
      const savedPage = Array.isArray(savedPageRows) ? savedPageRows[0] : savedPageRows;
      
      setSaving(false);
      if (error) {
        console.error('[Workbench] Error saving page:', error);
        void recordApostilaOperation({
          operationId,
          apostilaId: id,
          pageId: selectedPageId,
          operationType,
          phase: 'save',
          status: 'failed',
          errorCode: error.code || 'page_update_failed',
          errorMessage: error.message,
          metadata: { chronologyStatus: chronology.status },
        });
        toast.error('Não foi possível salvar esta página.');
        return false;
      }
      
      console.log('[Workbench] Page saved successfully:', savedPage.id);
      setContentRevision(Number((savedPage as any).content_revision ?? contentRevision + 1));
      const savedAt = new Date().toISOString();
      const pageToDisplay = (savedPage as ApostilaPage | null) ?? {
        id: selectedPageId,
        apostila_id: id,
        title: title.trim() || 'Nova Página',
        content,
        position: pages.length,
        created_at: savedAt,
        updated_at: savedAt,
        // Keep the date selected by the editor when an older database does not
        // return the saved row. Using today's date here reordered the sidebar
        // until the next reload and made a correctly saved page look missing.
        saved_date: pageUpdate.saved_date,
      };
      setPages((current) => upsertApostilaPage(current, pageToDisplay));

      if (content.trim().length > 0) {
        const hasBlockingChronologyIssue = chronology.issues.some((issue) => (
          issue.severity === 'error'
          && issue.code !== 'page_dates_out_of_order'
          && issue.code !== 'page_content_dates_out_of_order'
        ));
        const shouldPublish = published || !hasBlockingChronologyIssue;
        const { error: publishError } = await supabase
          .from('apostilas')
          .update({
            // Um alerta editorial não pode retirar do aluno uma apostila já
            // publicada, nem sobrescrever sua visibilidade com estado local antigo.
            ...(!hasBlockingChronologyIssue ? { published: true } : {}),
            updated_at: savedAt,
          })
          .eq('id', id)
          .select('id')
          .single();

        if (publishError) {
          toast.warning('Página salva, mas não foi possível confirmar sua visibilidade para os alunos. Verifique a publicação do caderno.');
          console.error('[Workbench] Failed to update parent apostila visibility:', publishError);
          void recordApostilaOperation({
            operationId,
            apostilaId: id,
            pageId: selectedPageId,
            operationType,
            phase: 'publish_guard',
            status: 'failed',
            errorCode: publishError.code || 'parent_visibility_update_failed',
            errorMessage: publishError.message,
            affectedRecordIds: [savedPage.id],
            metadata: { chronologyStatus: chronology.status },
          });
        } else {
          setPublished(shouldPublish);
          setApostilas((current) => current.map((apostila) =>
            apostila.id === id ? { ...apostila, published: shouldPublish, updated_at: savedAt } : apostila
          ));
          if (hasBlockingChronologyIssue) {
            toast.warning('Página salva. Revise as datas; a visibilidade da apostila foi preservada.');
          }
        }
      }

      void recordApostilaOperation({
        operationId,
        apostilaId: id,
        pageId: selectedPageId,
        operationType,
        phase: 'save',
        status: 'succeeded',
        affectedRecordIds: [savedPage.id, id],
        metadata: {
          chronologyStatus: chronology.status,
          chronologyIssueCodes: chronology.issues.map((issue) => issue.code),
          position: savedPage.position,
        },
      });

      if (draftVersionRef.current === saveDraftVersion) {
        dirtyRef.current = false;
        setHasPendingChanges(false);
        localStorage.removeItem(`apostila_backup_${id}_${selectedPageId}`);
      }
      setLastSavedAt(new Date(savedAt));
      if (isManual) toast.success('Página salva com sucesso.');
      return true;
    }


    const { data: currentApostila, error: currentApostilaError } = await supabase
      .from('apostilas')
      .select('title, content, content_revision')
      .eq('id', id)
      .single();

    if (currentApostilaError || !currentApostila) {
      console.error('[Workbench] Falha ao ler a revisão atual antes do salvamento:', currentApostilaError);
      setSaving(false);
      toast.error('Não foi possível confirmar a versão atual da apostila. A edição foi mantida localmente.');
      return false;
    }

    if (currentApostila?.content?.trim() && !content.trim()) {
      setContent(currentApostila.content);
      dirtyRef.current = false;
      setHasPendingChanges(false);
      setSaving(false);
      void recordApostilaOperation({
        operationId,
        apostilaId: id,
        operationType,
        phase: 'save',
        status: 'blocked',
        errorCode: 'content_wipe_prevented',
        errorMessage: 'O conteúdo carregado seria substituído por vazio; a operação foi bloqueada.',
        metadata: { currentContentLength: currentApostila.content.length },
      });
      toast.error('Conteúdo preservado para evitar perda.');
      return false;
    }

    if (currentApostila && (currentApostila.content !== content || currentApostila.title !== title)) {
      await supabase.from('apostila_versions').insert({
        apostila_id: id,
        title: currentApostila.title,
        content: currentApostila.content,
        created_by: user?.id
      });
    }

    const apostilaUpdate = {
      title: title.trim() || 'Sem título',
      category,
      content,
      published: content.trim().length > 0 && chronology.status !== 'error' ? true : published,
      semester,
      course: course.length ? course : null,
      saved_date: savedDate || getLocalDateIso(),
    };
    const { data: savedApostilaRows, error } = await saveApostilaWithRevision({
      apostilaId: id,
      expectedRevision: contentRevision,
      title: apostilaUpdate.title,
      category: apostilaUpdate.category,
      content: apostilaUpdate.content,
      published: apostilaUpdate.published,
      semester: apostilaUpdate.semester,
      course: apostilaUpdate.course,
      savedDate: apostilaUpdate.saved_date,
    });
    const savedApostila = Array.isArray(savedApostilaRows) ? savedApostilaRows[0] : savedApostilaRows;

    setSaving(false);
    if (error) {
      console.error('Erro ao salvar:', error);
      if (error.code === '40001') {
        toast.error('Esta apostila foi alterada por outra sessão. Sua edição foi preservada; copie o texto antes de recarregar para comparar as versões.');
      }
      void recordApostilaOperation({
        operationId,
        apostilaId: id,
        operationType,
        phase: 'save',
        status: 'failed',
        errorCode: error.code || 'apostila_update_failed',
        errorMessage: error.message,
        metadata: { chronologyStatus: chronology.status },
      });
      toast.error('Falha na sincronização. Edição mantida localmente.', {
        description: 'Sua edição continua aberta. Verifique a conexão e tente salvar novamente.',
        action: isManual ? {
          label: 'Tentar Agora',
          onClick: () => { void doSave(true); }
        } : undefined,
        duration: 5000,
      });
      return false;
    }
    
          // Only acknowledge the exact draft sent to the server. If the editor changed
    // while this request was in flight, keep the newer draft dirty and backed up.

    void recordApostilaOperation({
      operationId,
      apostilaId: id,
      operationType,
      phase: 'save',
      status: 'succeeded',
      affectedRecordIds: [id],
      metadata: {
        chronologyStatus: chronology.status,
        chronologyIssueCodes: chronology.issues.map((issue) => issue.code),
      },
    });

    if (draftVersionRef.current === saveDraftVersion) {
      dirtyRef.current = false;
      setHasPendingChanges(false);
      localStorage.removeItem(`apostila_backup_${id}_main`);
    }
    setContentRevision(Number((savedApostila as any)?.content_revision ?? contentRevision + 1));
    if (content.trim().length > 0 && chronology.status !== 'error') setPublished(true);
    setLastSavedAt(new Date());
    setApostilas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: title.trim() || 'Sem título', category, semester, course: course.length ? course : null, updated_at: new Date().toISOString() } : p))
    );
    if (isManual) toast.success('Apostila salva com sucesso.');
    
    // Create snapshot after successful save
    if (content.trim().length > 10) {
      void supabase.rpc('snapshot_apostila_version', { _apostila_id: id });
    }
    
    return true;
  };

  const doSave = async (isManual = false): Promise<boolean> => {
    if (saveInFlightRef.current) {
      await saveInFlightRef.current;
      if (!dirtyRef.current) return true;
    }

    const savePromise = persistChanges(isManual);
    saveInFlightRef.current = savePromise;
    try {
      return await savePromise;
    } finally {
      if (saveInFlightRef.current === savePromise) saveInFlightRef.current = null;
    }
  };

  // O autosave e o backup local preservam o rascunho; estes eventos evitam que
  // uma troca de aba, reconexão ou fechamento esconda uma alteração pendente.
  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const saveAfterReconnect = () => {
      if (dirtyRef.current) void doSave(false);
    };

    const saveWhenVisible = () => {
      if (document.visibilityState === 'visible' && dirtyRef.current) void doSave(false);
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    window.addEventListener('online', saveAfterReconnect);
    document.addEventListener('visibilitychange', saveWhenVisible);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      window.removeEventListener('online', saveAfterReconnect);
      document.removeEventListener('visibilitychange', saveWhenVisible);
    };
  }, [id, selectedPageId, title, category, content, semester, course, savedDate]);

  const navigateAfterSave = async (url: string, options?: { replace?: boolean }) => {
    const saved = await doSave(false);
    if (saved) navigate(url, options);
  };

  const handleBack = async () => {
    const saved = await doSave(false);
    if (!saved) return;
    if (onBack) onBack();
    else navigate('/admin');
  };

  const verifyPersistedContent = async (): Promise<boolean> => {
    if (!id) return false;

    const expectedTitle = title.trim() || (selectedPageId ? 'Nova Página' : 'Sem título');
    const query = selectedPageId
      ? supabase.from('apostila_pages').select('title, content').eq('id', selectedPageId).eq('apostila_id', id).maybeSingle()
      : supabase.from('apostilas').select('title, content').eq('id', id).maybeSingle();
    const { data, error } = await query;

    if (error || !data) {
      console.error('[Workbench] Falha ao verificar conteúdo persistido:', error);
      toast.error('Não consegui confirmar o salvamento no banco. A página continuará aberta para você não perder o conteúdo.');
      return false;
    }

    if (data.title !== expectedTitle || data.content !== content) {
      console.error('[Workbench] Conteúdo persistido diferente do editor:', {
        expectedTitle,
        persistedTitle: data.title,
        expectedLength: content.length,
        persistedLength: data.content?.length ?? 0,
      });
      toast.error('O banco ainda não confirmou todo o conteúdo. A página continuará aberta para proteger sua edição.');
      return false;
    }

    return true;
  };

  const saveAndOpenApostilaManagement = async () => {
    const saved = await doSave(true);
    if (!saved) return false;

    const verified = await verifyPersistedContent();
    if (!verified) {
      toast.error('O salvamento falhou na validação final. Verifique se há erros no console.', {
        description: 'Tente salvar novamente ou verifique sua conexão.'
      });
      return false;
    }

    toast.success('Apostila salva e confirmada no banco de dados.');
    navigate('/admin?tab=apostilas', { replace: true });
    return true;
  };

  const handleRestoreVersion = (version: { title: string; content: string }) => {
    setTitle(version.title);
    setContent(version.content);
    dirtyRef.current = true;
    setHasPendingChanges(true);
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
    if (!id) return;
    const operationId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `publish-${Date.now()}`;

    void recordApostilaOperation({
      operationId,
      apostilaId: id,
      operationType: 'publish_toggle',
      phase: 'validation',
      status: 'started',
      metadata: { requestedPublished: next },
    });

    if (next) {
      const validation = await runApostilaChronologyValidation(id, 'publish_gate');
      if (validation?.status === 'error') {
        void recordApostilaOperation({
          operationId,
          apostilaId: id,
          operationType: 'publish_toggle',
          phase: 'validation',
          status: 'blocked',
          errorCode: 'chronology_validation_failed',
          errorMessage: 'A publicação foi bloqueada por inconsistências cronológicas.',
          metadata: {
            validationStatus: validation.status,
            alertCount: validation.alert_count,
            issues: validation.issues,
          },
        });
        toast.error('Publicação bloqueada: corrija as inconsistências cronológicas no Diagnóstico Acadêmico.');
        return;
      }
      if (!validation) {
        toast.warning('Validação server-side indisponível; a publicação seguirá com registro local.');
      } else if (validation.status === 'warning') {
        toast.warning('Apostila publicada com avisos cronológicos. Revise o Diagnóstico Acadêmico.');
      }
    }

    const { error } = await supabase.from('apostilas')
      .update({ published: next, status: next ? 'liberada' : 'bloqueada' })
      .eq('id', id)
      .select('id')
      .single();
    if (error) {
      setPublished(!next);
      void recordApostilaOperation({
        operationId,
        apostilaId: id,
        operationType: 'publish_toggle',
        phase: 'update',
        status: 'failed',
        errorCode: error.code || 'publish_update_failed',
        errorMessage: error.message,
        metadata: { requestedPublished: next },
      });
      toast.error('Falha ao alterar status');
    } else {
      setPublished(next);
      void recordApostilaOperation({
        operationId,
        apostilaId: id,
        operationType: 'publish_toggle',
        phase: 'update',
        status: 'succeeded',
        affectedRecordIds: [id],
        metadata: { published: next },
      });
      toast.success(next ? 'Publicada' : 'Rascunho');
      setApostilas((prev) => prev.map((p) => (p.id === id ? { ...p, published: next } : p)));
    }
  };

  const reloadMaterials = async () => {
    if (!id) return;
    const { data: links, error: linksError } = await supabase
      .from('apostila_materials').select('id, sort_order, material_id')
      .eq('apostila_id', id).order('sort_order');
    if (linksError) {
      console.error('[Workbench] Falha ao recarregar materiais:', linksError);
      toast.error('Não foi possível atualizar os materiais.');
      return;
    }
    if (!links?.length) { setLinkedMaterials([]); return; }
    const ids = links.map((l: any) => l.material_id);
    const { data: mats, error: matsError } = await supabase.from('materials').select('id, title, type').in('id', ids);
    if (matsError) {
      console.error('[Workbench] Falha ao carregar detalhes dos materiais:', matsError);
      toast.error('Não foi possível carregar os detalhes dos materiais.');
      return;
    }
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
    if (mode === 'append' && content.trim()) {
      // Formatação no estilo continuação se já houver texto
      setContent((prev) => `${prev}\n\n${text}`);
    } else {
      setContent(text);
    }
    toast.success(mode === 'append' ? 'Conteúdo adicionado.' : 'Conteúdo substituído.');
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
          <Button size="sm" variant="ghost" className="h-7 px-2 -ml-2 gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground" onClick={() => { void handleBack(); }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Admin
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={collapseSidebar}
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
                void navigateAfterSave(`/admin/apostilas/${a.id}`);
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
    toast.success(`✓ Seção "${sectionTitle}" adicionada ao conteúdo`);
    
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

  const handleSplitByDate = async (contentOverride?: string, forceExecute = false) => {
    if (!id || splitting) return;
    
    // Se for Smart Paste ou Manual e não for execução forçada, mostra prévia
    if (!forceExecute) {
      if (contentOverride) {
        const dates = extractChronologyDates(contentOverride);
        if (dates.length <= 1) return; 
      }
      
      setSplitting(true);
      try {
        const result = await splitApostilaByDate(id, { dryRun: true, contentOverride });
        if (result.success && result.preview) {
          setSplitPreviewData({ 
            pages: result.preview, 
            totalDates: result.dates.length 
          });
          setSplitPreviewOpen(true);
          return;
        }
      } catch (err: any) {
        console.error('Erro na prévia:', err);
      } finally {
        setSplitting(false);
      }
    }

    setSplitting(true);
    const loadingToast = toast.loading('Separando aulas por data...');
    try {
      const result = await splitApostilaByDate(id, { contentOverride });
      if (result.success) {
        toast.dismiss(loadingToast);
        toast.success(`Sucesso! ${result.pages_created} páginas criadas.`, {
          description: `Datas encontradas: ${result.dates.join(', ')}`
        });
        setSplitPreviewOpen(false);
        void loadApostila(id);
      } else {
        toast.dismiss(loadingToast);
        toast.error('Não foi possível separar:', { description: (result as any).message });
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error('Erro técnico ao processar separação.', { description: err.message });
    } finally {
      setSplitting(false);
    }
  };


  useEffect(() => {
    if (!id || loading || searchParams.get('separate') !== '1') return;
    const requestKey = `${id}:${selectedPageId || 'main'}`;
    if (splitRequestHandledRef.current === requestKey) return;
    splitRequestHandledRef.current = requestKey;
    void handleSplitByDate(undefined, false);
  }, [id, loading, searchParams, selectedPageId]);

  const baseSortOrder = linkedMaterials.length > 0

    ? Math.max(...linkedMaterials.map((m) => m.sort_order)) + 1
    : 0;

  const RightPanel = (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <Tabs value={rightTab} onValueChange={(v: any) => setRightTab(v)} className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-3">
          <TabsList className="w-full grid grid-cols-4 h-8 bg-muted/50 p-1">
            <TabsTrigger value="materials" className="text-[10px] font-bold">Arquivos</TabsTrigger>
            <TabsTrigger value="preview" className="text-[10px] font-bold">Preview</TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] font-bold">Histórico</TabsTrigger>
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
        <div className="flex-1 overflow-hidden relative">
          <TabsContent value="materials" className="absolute inset-0 m-0 flex flex-col">
            <div className="p-4 border-b border-border/40 bg-muted/20">
              <MaterialsDropZone 
                apostilaId={id as string} 
                baseSortOrder={linkedMaterials.length} 
                onUploaded={reloadMaterials} 
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <SortableMaterialsList 
                  items={linkedMaterials} 
                  onReorder={setLinkedMaterials}
                  onRemove={async (lid) => {
                    await supabase.from('apostila_materials').delete().eq('id', lid);
                    setLinkedMaterials(prev => prev.filter(m => m.id !== lid));
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="preview" className="absolute inset-0 m-0 bg-background/50 overflow-auto">
            <div className="p-6 bg-white dark:bg-[#1a1c1e] min-h-full shadow-inner">
              <div className="max-w-[800px] mx-auto bg-card shadow-2xl p-12 min-h-[1056px] border border-border/40">
                <ApostilaContentRenderer content={content} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history" className="absolute inset-0 m-0 p-0 overflow-hidden flex flex-col">
            <ApostilaVersionHistory 
              apostilaId={id as string} 
              onRestore={handleRestoreVersion}
            />
          </TabsContent>
          <TabsContent value="exercises" className="absolute inset-0 m-0 p-4 overflow-auto">
             <div className="space-y-4">
               <div className="p-4 rounded-xl border border-dashed border-border/50 text-center space-y-2">
                 <p className="text-xs text-muted-foreground">Gestão de exercícios em breve integrada aqui.</p>
               </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  const handleCreatePersistedPage = async () => {
    if (creatingPageRef.current) return;
    if (!id || !user) {
      toast.error('Faça login novamente para criar uma página.');
      return;
    }

    const operationId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `page-create-${Date.now()}`;
    creatingPageRef.current = true;
    setCreatingPage(true);
    await recordApostilaOperation({
      operationId,
      apostilaId: id,
      operationType: 'page_create',
      phase: 'insert',
      status: 'started',
      metadata: { selectedPageId, dirtyBeforeCreate: dirtyRef.current },
    });

    try {
      // Aguarda qualquer autosave já iniciado antes de trocar de página.
      if (saveInFlightRef.current) await saveInFlightRef.current;

      // Não deixe alterações da página atual serem perdidas ao trocar para a nova.
      if (dirtyRef.current) {
        await doSave(true);
        if (dirtyRef.current) {
          const message = 'Não foi possível salvar a página atual. A nova página não foi criada.';
          void recordApostilaOperation({
            operationId,
            apostilaId: id,
            pageId: selectedPageId,
            operationType: 'page_create',
            phase: 'precondition',
            status: 'blocked',
            errorCode: 'current_page_save_failed',
            errorMessage: message,
            metadata: { selectedPageId, dirtyBeforeCreate: true },
          });
          toast.error(message);
          return;
        }
      }

      const newPage = await createApostilaPage(id, user.id);
      
      // Update local state immediately
      setPages((current) => upsertApostilaPage(current, newPage));
      
      // Pre-set content to avoid flicker or old content showing
      setTitle(newPage.title || 'Nova Página');
      setContent('');
      dirtyRef.current = false;
      
      initialLoadRef.current = false;
      
      // Navigate to the new page
      const nextUrl = `/admin/apostilas/${id}?page=${newPage.id}&expanded=1`;
      navigate(nextUrl, { replace: true });
      
      const validation = await runApostilaChronologyValidation(id, 'page_create');
      await recordApostilaOperation({
        operationId,
        apostilaId: id,
        pageId: newPage.id,
        operationType: 'page_create',
        phase: 'insert',
        status: 'succeeded',
        affectedRecordIds: [newPage.id, id],
        metadata: {
          position: newPage.position,
          nextUrl,
          validationStatus: validation?.status || 'not_available',
          alertCount: validation?.alert_count || 0,
        },
      });
      const hasBlockingServerIssue = validation?.issues?.some((issue) => (
        issue.severity === 'error'
        && issue.code !== 'page_dates_out_of_order'
        && issue.code !== 'page_content_dates_out_of_order'
      ));
      if (hasBlockingServerIssue) {
        toast.warning('A página foi criada, mas o diagnóstico encontrou uma inconsistência cronológica.');
      }
      
      toast.success('Nova página criada e carregada no editor.');
    } catch (error: any) {
      console.error('Erro ao criar página da apostila:', {
        operationId,
        apostilaId: id,
        pageId: selectedPageId,
        errorCode: error?.code || 'page_create_failed',
        errorMessage: error?.message || 'Erro desconhecido',
      });
      const message = String(error?.message || '');
      await recordApostilaOperation({
        operationId,
        apostilaId: id,
        pageId: selectedPageId,
        operationType: 'page_create',
        phase: 'insert',
        status: 'failed',
        errorCode: error?.code || 'page_create_failed',
        errorMessage: message || 'Erro desconhecido',
        metadata: { selectedPageId, dirtyBeforeCreate: dirtyRef.current },
      });
      if (/apostila_pages|schema cache|does not exist|PGRST205/i.test(message)) {
        toast.error('A criação de páginas não está habilitada no banco de produção.');
      } else if (/row-level security|permission denied|42501/i.test(message)) {
        toast.error('Seu usuário não tem permissão para criar páginas nesta apostila.');
      } else {
        toast.error(error?.message || 'Não foi possível criar a nova página.');
      }
    } finally {
      creatingPageRef.current = false;
      setCreatingPage(false);
    }
  };

  createPersistedPageRef.current = handleCreatePersistedPage;

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { words };
  }, [content]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div role="alert" className="w-full max-w-lg space-y-4 rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Falha ao carregar o conteúdo</h1>
        <p className="text-muted-foreground">{loadError}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { if (id) void loadApostila(id); }}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => { if (onBack) onBack(); else navigate('/admin'); }}>Voltar ao painel</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      <ApostilaHealthBar
        title={title}
        published={published}
        saving={saving}
        hasPendingChanges={hasPendingChanges}
        splitting={splitting}
        lastSavedAt={lastSavedAt}
        onSave={() => { void saveAndOpenApostilaManagement(); }}
        onTogglePublish={togglePublish}
        onPreview={() => {
          if (!id) return;
          void navigateAfterSave(`/apostila/${id}`);
        }}
        onOpenPanel={() => { setRightTab('materials'); setRightOpen(true); }}
        onSplitByDate={handleSplitByDate}
        wordCount={content.trim() ? content.trim().split(/\s+/).length : 0}
        exerciseCount={exerciseCount}
        materialCount={linkedMaterials.length}
        course={course}
        onCourseChange={setCourse}
        onPasteOpen={() => setPasteOpen(true)}
        onAddPage={handleCreatePersistedPage}
        creatingPage={creatingPage}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      



      
      <div className="flex flex-1 min-h-0 overflow-hidden relative">


        {/* Sidebar Desktop/Mobile */}
        <div id="workbench-apostila-sidebar" className={cn(
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
          {/* BOTÃO FLUTUANTE DE NOVA PÁGINA (Removido para evitar sobreposição estilo Notion) */}

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-3 top-3 z-50 h-9 w-9 bg-background/95 shadow-sm",
              !sidebarCollapsed && "hidden lg:hidden",
            )}
            onClick={expandSidebar}
            title="Abrir lista de apostilas"
            aria-label="Abrir lista de apostilas"
            aria-controls="workbench-apostila-sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="absolute right-3 top-3 z-[60] hidden sm:block">
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

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>Data da Aula</span>
                        </div>
                        <input
                          type="date"
                          value={savedDate || ''}
                          aria-label="Data da aula"
                          title="Escolha a data da aula"
                          onChange={(e) => {
                            setSavedDate(e.target.value);
                            // A data é uma edição independente do título e do conteúdo.
                            // Marcamos explicitamente como pendente para que ela seja salva
                            // mesmo quando o aluno altera somente este campo.
                            dirtyRef.current = true;
                          }}
                          onBlur={() => {
                            if (dirtyRef.current) void doSave(true);
                          }}
                          className="h-9 w-[150px] rounded-lg border border-border/70 bg-background/70 px-3 text-sm font-semibold tabular-nums text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 flex-col px-0 sm:px-16 sm:pb-32">
              {editorExpanded && (
                <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-y border-border bg-card px-3 py-2">
                  <Button size="sm" variant={!selectedPageId ? 'secondary' : 'ghost'} className="h-8 shrink-0 text-xs" onClick={() => { void navigateAfterSave(`/admin/apostilas/${id}`); }}>
                    Página principal
                  </Button>
                  {pages.map((page) => (
                    <Button key={page.id} size="sm" variant={selectedPageId === page.id ? 'secondary' : 'ghost'}
                      className="h-8 shrink-0 text-xs" onClick={() => { void navigateAfterSave(`/admin/apostilas/${id}?page=${page.id}&expanded=1`); }}>
                      {new Date(page.created_at).toLocaleDateString('pt-BR')} · {page.title}
                    </Button>
                  ))}
                  {id && <NewApostilaPageButton apostilaId={id} beforeCreate={() => doSave(false)} />}
                </div>
              )}
              <MarkdownEditor
                value={content}
                onChange={setContent}
                onSave={() => saveAndOpenApostilaManagement()}
                apostilaId={id}
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

      <ApostilaSplitPreview
        isOpen={splitPreviewOpen}
        onClose={() => setSplitPreviewOpen(false)}
        onConfirm={() => handleSplitByDate(undefined, true)}

        loading={splitting}
        previewData={splitPreviewData}
      />


      {/* FAB Mobile Removido para evitar sobreposição */}

    </div>
  );
}
