import React, { useEffect, useState, useCallback, useRef, useMemo, useContext, createContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminNavPanel } from '@/components/admin/AdminNavPanel';
import { AdminCreateUserDialog } from '@/components/admin/AdminCreateUserDialog';
import { ADMIN_NAV_BY_ID } from '@/config/adminNav';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { OverviewTab } from '@/components/admin/refactored/OverviewTab';
import { AdminSidebar } from '@/components/admin/refactored/AdminSidebar';
import { UsersTab } from '@/components/admin/refactored/UsersTab';
import { MaterialsTab } from '@/components/admin/refactored/MaterialsTab';
import { AnnouncementsTab } from '@/components/admin/refactored/AnnouncementsTab';
import { CategorySelect } from '@/components/admin/CategorySelect';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, Eye, EyeOff, BookOpen, FileText, PenLine, ArrowLeft,
  LayoutDashboard, CheckCircle, TrendingUp, Upload, BarChart3, Clock,
  Link as LinkIcon, Loader2, AlertCircle, Edit, Download, File, Image, Video, Music, FileSpreadsheet, Presentation,
  Users, ShieldBan, ShieldCheck, ShieldAlert, Search, Menu, X, Activity, GraduationCap, FolderOpen, Settings, RefreshCw,
  Sun, Moon, FileUp, PenTool, Wand2, Megaphone, Combine, Calendar as CalIcon, MessageSquare, MessageSquareQuote, Link2, FileDown, MoreHorizontal, Paperclip, Rss, Info, ExternalLink, ChevronRight, History, Store,
  Sparkles, Check
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ActivityChart } from '@/components/ActivityChart';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { AnnouncementsAdmin } from '@/components/AnnouncementsAdmin';
import { CalendarEventsAdmin } from '@/components/CalendarEventsAdmin';
import { ApostilaMaterialsManager } from '@/components/ApostilaMaterialsManager';
import { ensureApostilaExists } from '@/lib/create-placeholder-apostila';

import { AppendLinkDialog } from '@/components/AppendLinkDialog';
import { autoLinkAll, autoLinkApostila } from '@/lib/auto-link-materials';
import { MergeApostilasDialog } from '@/components/MergeApostilasDialog';
import { TestimonialsAdmin } from '@/components/TestimonialsAdmin';
import { AIProviderSettings } from '@/components/AIProviderSettings';
import { ShareLinkSettings } from '@/components/ShareLinkSettings';
import { SplashDownloader } from '@/components/admin/SplashDownloader';
import { CoverDesignEditor } from '@/components/admin/CoverDesignEditor';
import { exportApostilaToPDF } from '@/lib/apostila-pdf';
import { parseApostilaContent } from '@/lib/apostila-parser';
import { extractTextFromFile } from '@/lib/file-extract';
import { markdownToHtml } from '@/lib/markdown-html';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { StructureValidationDialog } from '@/components/admin/StructureValidationDialog';
import { validateApostilaStructure, type ValidationReport } from '@/lib/apostilaValidation';
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { SmokeTestsPanel } from '@/components/SmokeTestsPanel';
import { DiagnosticsPanel } from '@/components/DiagnosticsPanel';
import { VersionHistoryPanel } from '@/components/admin/VersionHistoryPanel';
import { EllaAuditPanel } from '@/components/admin/EllaAuditPanel';
import { SecurityAlertsPanel } from '@/components/admin/SecurityAlertsPanel';
import { BY_SEMESTER } from '@/lib/subject-semester-map';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { SponsorLeadsPanel } from '@/components/admin/SponsorLeadsPanel';
import { DuplicateApostilaDialog } from '@/components/DuplicateApostilaDialog';
import { findDuplicateApostila, type DuplicateMatch } from '@/lib/duplicate-detector';
import { ImportPreviewPanel } from '@/components/ImportPreviewPanel';
import { AdminAdsManager } from '@/components/AdminAdsManager';
import { AdsChatBuilder } from '@/components/AdsChatBuilder';
import { AdminDashboard } from '@/components/AdminDashboard';
import { RssFeedsManagerEnhanced } from '@/components/admin/RssFeedsManagerEnhanced';
import { FreeCoursesManager } from '@/components/admin/FreeCoursesManager';
import { AdminSponsorsManager } from '@/components/admin/AdminSponsorsManager';
import { ApostilaExportDialog } from '@/components/admin/ApostilaExportDialog';

type Apostila = Tables<'apostilas'>;
type Exercise = Tables<'exercises'>;
type Material = Tables<'materials'>;

const SEMESTER_MAP: Record<number, string> = {
  1: '1º Semestre', 2: '2º Semestre', 3: '3º Semestre', 4: '4º Semestre',
  5: '5º Semestre', 6: '6º Semestre', 7: '7º Semestre', 8: '8º Semestre',
};

const CategoriesCtx = createContext<{ categories: { id: string; name: string; sort_order: number }[] }>({ categories: [] });


type Tab = 'overview' | 'apostilas' | 'exercises' | 'materials' | 'users' | 'announcements' | 'calendar' | 'testimonials' | 'ai' | 'performance' | 'smoke' | 'diagnostics' | 'ads' | 'ads-chat' | 'social' | 'rss' | 'courses' | 'changelog' | 'leads' | 'ella-audit' | 'security-alerts' | 'sponsors' | 'edit' | 'review';

const ACCEPT_MAP: Record<string, string> = {
  pdf: '.pdf', image: 'image/*', gif: '.gif,image/gif',
  video: 'video/*,.mp4,.mov,.avi,.mkv', audio: 'audio/*,.mp3,.wav,.m4a,.ogg',
  powerpoint: '.ppt,.pptx', word: '.doc,.docx', excel: '.xls,.xlsx', other: '*',
};

const TYPE_FROM_EXT: Record<string, string> = {
  pdf: 'pdf', png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', svg: 'image',
  gif: 'gif', mp4: 'video', mov: 'video', avi: 'video', mkv: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio',
  ppt: 'powerpoint', pptx: 'powerpoint', doc: 'word', docx: 'word',
  xls: 'excel', xlsx: 'excel', epub: 'epub',
};

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {theme === 'dark' ? 'Modo Claro' : 'Modo Noturno'}
    </Button>
  );
}
function AutoLinkAllButton() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');

  const handleAutoLinkAll = async () => {
    setRunning(true);
    setProgress('Iniciando...');
    try {
      const result = await autoLinkAll((current, total, r) => {
        setProgress(`${current}/${total} — ${r.apostilaTitle.slice(0, 30)}: +${r.linked}`);
      });
      toast.success(`Concluído! ${result.totalLinked} vínculo(s) criado(s) em ${result.apostilasProcessed} apostilas.`);
    } catch {
      toast.error('Erro ao auto-vincular em lote.');
    } finally {
      setRunning(false);
      setProgress('');
    }
  };

  return (
    <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleAutoLinkAll} disabled={running}>
      {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
      {running ? progress : 'Auto-vincular Todos'}
    </Button>
  );
}

function MergeButton({ onMerged }: { onMerged: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setOpen(true)}>
        <Combine className="h-3 w-3" /> Mesclar apostilas
      </Button>
      <MergeApostilasDialog open={open} onOpenChange={setOpen} onMerged={onMerged} />
    </>
  );
}
// ─── Sidebar Navigation ────────────────────────────────────────

// ─── Main Admin Page ────────────────────────────────────────────
interface AdminPageProps {
  tab?: Tab;
  setTab?: (tab: Tab) => void;
}

export default function AdminPage({ tab: propTab, setTab: propSetTab }: AdminPageProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState<Tab>('overview');
  const tab = propTab || internalTab;
  const setTab = propSetTab || setInternalTab;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({});
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; sort_order: number }[]>([]);
  const [allAnswers, setAllAnswers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<{ id: string; user_id: string; full_name: string; email: string; is_blocked: boolean; created_at: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filtros admin avançados
  const [filterSemester, setFilterSemester] = useState<string>(() => {
    return localStorage.getItem('adminSelectedSemester') || '6';
  });
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('adminSelectedSemester', filterSemester);
  }, [filterSemester]);

  const toggleCat = useCallback((cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  // Apostila dialogs
  const [showExerciseDialog, setShowExerciseDialog] = useState<string | null>(null);
  const [showMaterialsFor, setShowMaterialsFor] = useState<string | null>(null);
  const [showAppendFor, setShowAppendFor] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedApostila, setSelectedApostila] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingApostila, setEditingApostila] = useState<Apostila | null>(null);
  const [exportingApostila, setExportingApostila] = useState<Apostila | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importTopic, setImportTopic] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importExercises, setImportExercises] = useState<any[]>([]);
  const [extractionMethod, setExtractionMethod] = useState<string>('');
  const [cloning, setCloning] = useState(false);
  // Detecção de apostila duplicada
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [pendingSave, setPendingSave] = useState<null | (() => Promise<void> | void)>(null);
  // Validação estrutural (H2/H3) antes de salvar
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validationContext, setValidationContext] = useState<{ title?: string; run: () => Promise<void> | void } | null>(null);
  const [importStep, setImportStep] = useState<'input' | 'review' | 'edit'>('input');
  const [importReadyHtml, setImportReadyHtml] = useState('');
  const [importMode, setImportMode] = useState<'url' | 'text'>('url');

  // Quick-create hint from dashboard: 'link' | 'pdf' | 'text'
  useEffect(() => {
    if (tab !== 'apostilas') return;
    const hint = sessionStorage.getItem('admin.quickCreate');
    if (!hint) return;
    sessionStorage.removeItem('admin.quickCreate');
    setBatchMode(false);
    setImportStep('input');
    setImportMode(hint === 'link' ? 'url' : 'text');
    setTimeout(() => {
      document.querySelector('[data-import-card]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [tab]);
  const [importRawText, setImportRawText] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; results: { url: string; title: string; status: 'ok' | 'error'; error?: string }[] }>({ current: 0, total: 0, results: [] });
  const [batchRunning, setBatchRunning] = useState(false);

  // Manual create
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualContent, setManualContent] = useState('');

  // Exercise form
  const [exQuestion, setExQuestion] = useState('');
  const [exOptions, setExOptions] = useState(['', '', '', '']);
  const [exCorrect, setExCorrect] = useState('A');
  const [exExplanation, setExExplanation] = useState('');
  const [bulkExerciseMode, setBulkExerciseMode] = useState(false);
  const [bulkExerciseText, setBulkExerciseText] = useState('');
  const [bulkExerciseImporting, setBulkExerciseImporting] = useState(false);
  const [exerciseDialogMode, setExerciseDialogMode] = useState<'individual' | 'bulk' | 'ai'>('individual');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiExercises, setAiExercises] = useState<{ type?: string; question: string; options: string[]; correct_answer: string; explanation: string }[]>([]);
  const [aiMcCount, setAiMcCount] = useState(8);
  const [aiEssayCount, setAiEssayCount] = useState(2);
  const [editExerciseMode, setEditExerciseMode] = useState<'individual' | 'bulk' | 'ai'>('individual');
  const [editBulkText, setEditBulkText] = useState('');
  const [editAiExercises, setEditAiExercises] = useState<{ type?: string; question: string; options: string[]; correct_answer: string; explanation: string }[]>([]);
  const [editAiMcCount, setEditAiMcCount] = useState(8);
  const [editAiEssayCount, setEditAiEssayCount] = useState(2);

  // Materials state
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matType, setMatType] = useState<string>('link');
  const [matUrl, setMatUrl] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matUploading, setMatUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [matCategoryId, setMatCategoryId] = useState<string>('');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editMatTitle, setEditMatTitle] = useState('');
  const [editMatDesc, setEditMatDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  // Modo Admin: libera seleção/cópia global enquanto o admin estiver no painel.
  // O ScreenshotGuard e o CSS global checam `html[data-admin-mode="true"]` para
  // não bloquear seleção de texto na área administrativa.
  useEffect(() => {
    document.documentElement.setAttribute('data-admin-mode', 'true');
    return () => {
      document.documentElement.removeAttribute('data-admin-mode');
    };
  }, []);

  // Realtime: notificação de novos cadastros
  useEffect(() => {
    const channel = supabase
      .channel(`admin-new-users-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const newUser = payload.new as any;
          const name = newUser.full_name || newUser.email || 'Novo usuário';
          toast.info(`Novo cadastro: ${name}`, {
            description: newUser.email || undefined,
            duration: 8000,
          });
          // Atualiza a lista de usuários automaticamente
          setUsers(prev => [
            { id: newUser.id, user_id: newUser.user_id, full_name: newUser.full_name || '', email: newUser.email || '', is_blocked: newUser.is_blocked ?? false, created_at: newUser.created_at },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadAll = async () => {
    setRefreshing(true);
    const [{ data: ap }, { data: ex }, { data: ans }, { data: mats }, { data: cats }, { data: profs }] = await Promise.all([
      supabase.from('apostilas').select('*').order('created_at', { ascending: false }),
      supabase.from('exercises').select('*'),
      supabase.from('answers').select('*'),
      supabase.from('materials').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    setApostilas(ap || []);
    const map: Record<string, Exercise[]> = {};
    ex?.forEach(e => { if (!map[e.apostila_id]) map[e.apostila_id] = []; map[e.apostila_id].push(e); });
    setExercises(map);
    setAllAnswers(ans || []);
    setMaterials(mats || []);
    setUsers((profs || []).map(p => ({ id: p.id, user_id: p.user_id, full_name: p.full_name, email: p.email, is_blocked: (p as any).is_blocked ?? false, created_at: p.created_at, content_scope: (p as any).content_scope ?? 'full', account_type: (p as any).account_type } as any)));
    setDbCategories((cats || []).map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
    setRefreshing(false);
  };

  // ─── Handlers ──────────────────────────────────
  const handleFileDrop = useCallback((file: File) => {
    if (file.size === 0) { toast.error('Arquivo vazio (0 bytes).'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setMatType(TYPE_FROM_EXT[ext] || 'other');
    setMatFile(file);
    if (!matTitle.trim()) setMatTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
  }, [matTitle]);

  const handleMultiUpload = useCallback(async (files: File[]) => {
    if (!user) return;
    setMatUploading(true);
    setUploadQueue(files);
    setUploadProgress({ current: 0, total: files.length });
    let success = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      setMatFile(file);
      if (file.size === 0) { toast.error(`"${file.name}" está vazio. Pulando.`); continue; }
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const detectedType = TYPE_FROM_EXT[ext] || 'other';
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('materials').upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
        await supabase.from('materials').insert({ title, type: detectedType as any, file_url: urlData.publicUrl, file_path: path, created_by: user.id });
        success++;
      } catch (err: any) { toast.error(`Erro em "${file.name}": ${err.message}`); }
    }
    toast.success(`${success} de ${files.length} materiais enviados!`);
    setMatFile(null); setMatTitle(''); setMatDesc('');
    setUploadQueue([]); setUploadProgress({ current: 0, total: 0 });
    setMatUploading(false);
    loadAll();
  }, [user]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(false); }, []);

  const handleExtract = async () => {
    const isTextMode = importMode === 'text';
    if (isTextMode && !importRawText.trim()) return;
    if (!isTextMode && !importUrl.trim()) return;
    setCloning(true);
    try {
      const body = isTextMode ? { rawText: importRawText.trim() } : { url: importUrl.trim() };
      const { data, error } = await supabase.functions.invoke('extract-content', { body });
      // Quando o edge function retorna 4xx/5xx, supabase-js coloca o body em `data` ainda.
      const apiError = (data as any)?.error;
      if (apiError) throw new Error(apiError);
      if (error) throw error;
      setImportTitle(data.title || '');
      setImportTopic(data.category || 'Geral');
      setImportContent(data.content || '');
      setImportExercises(data.exercises || []);
      setExtractionMethod(data.extraction_method || '');
      setImportStep('review');
      const methodLabel = data.extraction_method === 'firecrawl' ? ' (via Firecrawl)' : data.extraction_method === 'firecrawl-fallback' ? ' (Firecrawl fallback)' : '';
      toast.success(data.exercises?.length > 0 ? `Conteúdo estruturado com ${data.exercises.length} exercícios!${methodLabel}` : `Conteúdo estruturado!${methodLabel}`);
    } catch (err: any) {
      const msg = err?.message || 'Tente novamente';
      toast.error(msg, { duration: 8000 });
    }
    setCloning(false);
  };

  /** Insere efetivamente a apostila importada (extraído para permitir bypass do diálogo de duplicatas). */
  const insertImportApostila = useCallback(async () => {
    const currentUser = user;
    if (!currentUser) {
      toast.error('Sessão expirou. Faça login novamente.');
      return;
    }
    const isNotion = importUrl.includes('notion.site') || importUrl.includes('notion.so');
    const sourceType = importMode === 'text' ? 'text' : isNotion ? 'notion' : 'link';
    const { data: newApostila, error } = await supabase.from('apostilas').insert({
      title: importTitle.trim(), content: importContent,
      category: importTopic || 'Geral', source_type: sourceType,
      file_url: importMode === 'text' ? null : isNotion ? null : importUrl, created_by: currentUser.id, published: true,
    }).select().single();
    if (error) throw error;
    if (importExercises.length > 0 && newApostila) {
      const { error: exErr } = await supabase.from('exercises').insert(importExercises.map(ex => ({
        apostila_id: newApostila.id, question: ex.question, options: ex.options,
        correct_answer: ex.correct_answer, explanation: ex.explanation || null,
      })));
      if (exErr) console.warn('Falha ao salvar exercícios:', exErr);
    }
    toast.success(`Apostila salva com ${importExercises.length} exercícios!`);
    resetImportForm(); loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importUrl, importMode, importTitle, importContent, importTopic, importExercises]);

  /** Salva direto o texto já formatado, sem passar pela etapa de estruturação com IA. */
  const insertReadyTextApostila = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from('apostilas').insert({
      title: importTitle.trim(),
      content: importRawText,
      category: importTopic || 'Geral',
      source_type: 'text',
      created_by: user.id,
      published: true,
      file_url: null,
    });
    if (error) throw error;
    toast.success('Apostila formatada salva com sucesso!');
    resetImportForm();
    loadAll();
  }, [user, importTitle, importRawText, importTopic, loadAll]);

  /**
   * Verifica a estrutura H2/H3 antes de executar o salvamento real.
   * Se a apostila estiver dentro do padrão, executa direto.
   * Caso contrário, abre o diálogo e só prossegue se o admin confirmar.
   */
  const guardWithValidation = useCallback(
    async (content: string, title: string | undefined, run: () => Promise<void> | void) => {
      const report = validateApostilaStructure(content || '');
      if (report.ok) {
        await run();
        return;
      }
      setValidationReport(report);
      setValidationContext({ title, run });
    },
    [],
  );

  const handleSaveImport = async () => {
    if (!importTitle.trim()) { toast.error('Adicione um título'); return; }
    await guardWithValidation(importContent, importTitle, async () => {
      setCloning(true);
      try {
        // 1) Verifica duplicata pela similaridade do conteúdo
        const dup = await findDuplicateApostila(importContent, importTitle);
        if (dup) {
          setDuplicateMatch(dup);
          // Guarda a ação para ser executada após decisão do admin
          setPendingSave(() => async () => {
            await insertImportApostila();
          });
          setCloning(false);
          return;
        }
        await insertImportApostila();
      } catch (err: any) {
        console.error('[handleSaveImport] erro:', err);
        const msg = err?.message || err?.error_description || err?.details || 'Erro desconhecido';
        toast.error('Erro ao salvar: ' + msg);
      }
      setCloning(false);
    });
  };

  const handleSaveReadyText = async () => {
    if (!importTitle.trim()) {
      toast.error('Adicione um título antes de salvar');
      return;
    }
    if (!importRawText.trim()) {
      toast.error('Adicione o conteúdo da apostila');
      return;
    }

    await guardWithValidation(importRawText, importTitle, async () => {
      setCloning(true);
      try {
        const dup = await findDuplicateApostila(importRawText, importTitle);
        if (dup) {
          setDuplicateMatch(dup);
          setPendingSave(() => async () => {
            await insertReadyTextApostila();
          });
          setCloning(false);
          return;
        }
        await insertReadyTextApostila();
      } catch (err: any) {
        console.error('[handleSaveReadyText] erro:', err);
        const msg = err?.message || err?.error_description || err?.details || 'Erro desconhecido';
        toast.error('Erro ao salvar: ' + msg);
      }
      setCloning(false);
    });
  };

  const insertManualApostila = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from('apostilas').insert({
      title: manualTitle.trim(), content: manualContent,
      category: manualCategory || 'Geral', source_type: 'manual', created_by: user.id, published: true,
    });
    if (error) { toast.error('Erro ao criar'); return; }
    toast.success('Apostila criada!');
    setManualTitle(''); setManualContent(''); setManualCategory(''); setShowManualForm(false); loadAll();
  }, [user, manualTitle, manualContent, manualCategory]);

  const handleManualSave = async () => {
    if (!manualTitle.trim() || !user) return;
    await guardWithValidation(manualContent, manualTitle, async () => {
      // Detecta duplicata pelo conteúdo
      const dup = await findDuplicateApostila(manualContent, manualTitle);
      if (dup) {
        setDuplicateMatch(dup);
        setPendingSave(() => async () => { await insertManualApostila(); });
        return;
      }
      await insertManualApostila();
    });
  };

  /** Atualiza uma apostila existente com o melhor conteúdo (chamado a partir do diálogo). */
  const replaceExistingWithBetter = useCallback(async (newContent: string) => {
    if (!duplicateMatch) return;
    const { error } = await supabase
      .from('apostilas')
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq('id', duplicateMatch.apostila.id);
    if (error) { toast.error('Erro ao atualizar: ' + error.message); return; }
    toast.success(`"${duplicateMatch.apostila.title}" foi atualizada com a versão melhor formatada.`);
    // Limpa formulário ativo (importação ou manual)
    resetImportForm();
    setManualTitle(''); setManualContent(''); setManualCategory(''); setShowManualForm(false);
    loadAll();
  }, [duplicateMatch]);


  const resetImportForm = () => {
    setImportUrl(''); setImportTitle(''); setImportTopic('');
    setImportContent(''); setImportExercises([]); setImportStep('input');
    setImportRawText(''); setExtractionMethod('');
  };

  /**
   * "Começar" numa matéria da grade (placeholder): prepara a Central de Criação
   * e rola a tela até ela — antes o estado mudava mas nada aparecia na tela.
   */
  const startPlaceholder = (a: { title: string; category?: string | null }) => {
    setBatchMode(false);
    setImportMode('text');
    setImportUrl('');
    setImportContent('');
    setImportRawText('');
    setImportExercises([]);
    setImportTitle(a.title.replace('[GRADE] ', ''));
    setImportTopic(a.category || '');
    setImportStep('edit');
    setTab('apostilas');
    requestAnimationFrame(() => {
      document.querySelector('[data-import-card]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    toast.info('Central de Criação pronta para esta matéria.');
  };



  const handleBatchImport = async () => {
    if (!user || batchRunning) return;
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) { toast.error('Cole pelo menos uma URL válida'); return; }
    setBatchRunning(true);
    setBatchProgress({ current: 0, total: urls.length, results: [] });
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));
      try {
        const { data, error } = await supabase.functions.invoke('extract-content', { body: { url } });
        if (error) throw error;
        const isNotion = url.includes('notion.site') || url.includes('notion.so');
        const { data: newApostila, error: insertErr } = await supabase.from('apostilas').insert({
          title: data.title || 'Sem título', content: data.content || '',
          category: data.category || 'Geral', source_type: isNotion ? 'notion' : 'link',
          file_url: isNotion ? null : url, created_by: user.id, published: true,
          semester: 6 // Padrão conforme solicitado
        }).select().single();
        if (insertErr) throw insertErr;
        if (data.exercises?.length > 0 && newApostila) {
          await supabase.from('exercises').insert(data.exercises.map((ex: any) => ({
            apostila_id: newApostila.id, question: ex.question, options: ex.options,
            correct_answer: ex.correct_answer, explanation: ex.explanation || null,
          })));
        }
        setBatchProgress(prev => ({ ...prev, results: [...prev.results, { url, title: data.title || url, status: 'ok' }] }));
      } catch (err: any) {
        setBatchProgress(prev => ({ ...prev, results: [...prev.results, { url, title: url, status: 'error', error: err.message }] }));
      }
    }
    setBatchRunning(false);
    toast.success('Importação em lote concluída!');
    loadAll();
  };

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from('apostilas').update({ published: !current }).eq('id', id);
    if (error) {
      console.error('[togglePublish] erro:', error);
      toast.error('Falha ao alterar publicação: ' + error.message);
      return;
    }
    toast.success(!current ? 'Apostila publicada!' : 'Apostila ocultada!');
    loadAll();
  };

  const downloadApostilaPdf = async (a: Apostila) => {
    const t = toast.loading(`Gerando PDF de "${a.title}"…`);
    try {
      const sections = parseApostilaContent(a.content || '');
      await exportApostilaToPDF({
        title: a.title,
        category: a.category,
        sections: sections.map((s) => ({ id: s.id, title: s.title, level: s.level, content: s.content })),
      });
      toast.success('PDF gerado com sucesso', { id: t });
    } catch (e: any) {
      console.error('PDF export error', e);
      toast.error(e?.message || 'Falha ao gerar PDF', { id: t });
    }
  };


  const deleteApostila = async (id: string) => {
    // Remove dependências antes para evitar foreign-key
    const [exDel, matDel, apDel] = await Promise.all([
      supabase.from('exercises').delete().eq('apostila_id', id),
      supabase.from('apostila_materials').delete().eq('apostila_id', id),
      Promise.resolve(null),
    ]);
    if (exDel.error) console.warn('[deleteApostila] exercícios:', exDel.error);
    if (matDel.error) console.warn('[deleteApostila] vínculos materiais:', matDel.error);
    const { error } = await supabase.from('apostilas').delete().eq('id', id);
    if (error) {
      console.error('[deleteApostila] erro:', error);
      toast.error('Falha ao excluir: ' + error.message);
      return;
    }
    toast.success('Apostila excluída');
    loadAll();
  };

  const handleEditSave = async () => {
    if (!editingApostila) return;
    if (!editTitle.trim()) { toast.error('O título não pode ficar vazio'); return; }
    await guardWithValidation(editContent, editTitle, async () => {
      const { error } = await supabase
        .from('apostilas')
        .update({ title: editTitle.trim(), content: editContent, category: editCategory })
        .eq('id', editingApostila.id);
      if (error) {
        console.error('[handleEditSave] erro:', error);
        toast.error('Falha ao atualizar: ' + error.message);
        return;
      }
      toast.success('Apostila atualizada!');
      setEditingApostila(null);
      loadAll();
    });
  };

  const addExercise = async () => {
    if (!selectedApostila || !exQuestion.trim()) return;
    const { error } = await supabase.from('exercises').insert({
      apostila_id: selectedApostila, question: exQuestion,
      options: exOptions, correct_answer: exCorrect, explanation: exExplanation || null,
    });
    if (error) { toast.error('Erro ao criar exercício'); return; }
    toast.success('Exercício adicionado!');
    setExQuestion(''); setExOptions(['', '', '', '']); setExExplanation(''); loadAll();
  };

  const parseBulkExercises = (text: string) => {
    // Normaliza: remove BOM, unifica quebras, tira espaços invisíveis comuns de copy/paste
    const normalized = (text || '')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u00A0\u202F\u2007]/g, ' ') // nbsp variantes
      .replace(/[ \t]+\n/g, '\n');

    // Regex que detecta o INÍCIO de uma nova questão. Suporta:
    //   1. / 1) / 1- / 1 - / 01) / (1) / [1]
    //   Questão 1: / Questao 1 / Q1) / Q 1: / Pergunta 1 - / Exercício 1 / Ex 1:
    const QUESTION_START = /^(?:\s*)(?:[\(\[]?\d{1,3}[\)\]]?[\.\)\-:]?|(?:quest[aã]o|pergunta|exerc[ií]cio|ex|q)\s*\d{1,3}\s*[\)\.\-:]?)\s+/i;

    // Quebra em blocos: split em linhas-início-de-questão OU parágrafos vazios OU parágrafos com muitos traços
    const lines = normalized.split('\n');
    const blocks: string[] = [];
    let buf: string[] = [];
    const flush = () => { if (buf.join('\n').trim()) blocks.push(buf.join('\n')); buf = []; };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const isStart = QUESTION_START.test(line);
      const isBlank = !trimmedLine;
      const isSeparator = /^[-=_*]{3,}$/.test(trimmedLine);
      
      if ((isStart && buf.length) || (isSeparator && buf.length)) {
        flush();
      } else if (isBlank && buf.length > 5) { // Só quebra em linha em branco se o bloco já tiver conteúdo
        flush();
      }
      
      if (!isBlank && !isSeparator) buf.push(line);
    }
    flush();

    // Regex auxiliares
    const OPT_RE = /^\s*(?:[\(\[])?\s*([A-Ea-e])\s*(?:[\)\].:\-])\s*(.+?)\s*$/;
    const OPT_MARKED_CORRECT = /^\s*[*✓✔→»]\s*(?:[\(\[])?\s*([A-Ea-e])\s*(?:[\)\].:\-])\s*(.+?)\s*$/;
    const OPT_INLINE_CORRECT = /\((?:correta|certa|gabarito|resposta)\)\s*$/i;
    const GAB_RE = /^\s*(?:gabarito|resposta(?:\s+correta)?|alternativa\s+correta|alternativa|letra|answer|correct|resp)\s*[:=\-]?\s*\(?\s*([A-Ea-e])\s*\)?\s*\.?\s*$/i;
    const GAB_INLINE_BOLD = /\*\*([A-Ea-e])\*\*/i; // Suporte para **A**
    const GAB_INLINE_PAREN = /\(([A-Ea-e])\)/i; // Suporte para (A)
    const EXP_RE = /^\s*(?:explica[çc][ãa]o|justificativa|coment[áa]rio|explanation|resposta modelo|resposta esperada|coment\.?|just\.?)\s*[:=\-]\s*(.*)$/i;
    const ESSAY_RE = /^\s*(?:tipo|type)\s*[:=]\s*(?:dissertativa|essay|aberta|discursiva)/i;
    const Q_PREFIX = /^(?:\s*)(?:[\(\[]?\d{1,3}[\)\]]?[\.\)\-:]?|(?:quest[aã]o|pergunta|exerc[ií]cio|ex|q)\s*\d{1,3}\s*[\)\.\-:]?)\s+(.+)$/i;

    const parsed: { question: string; options: string[]; correct: string; explanation: string; type: 'multiple_choice' | 'essay' }[] = [];

    for (const block of blocks) {
      const bl = block.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
      if (bl.length < 1) continue;

      let question = '';
      const options: string[] = [];
      let correct = '';
      const explanationLines: string[] = [];
      let inExplanation = false;
      let isEssay = false;

      for (let i = 0; i < bl.length; i++) {
        const raw = bl[i];
        const line = raw.trim();
        if (!line) continue;

        if (ESSAY_RE.test(line)) { isEssay = true; continue; }

        const exp = line.match(EXP_RE);
        if (exp) {
          if (exp[1]?.trim()) explanationLines.push(exp[1].trim());
          inExplanation = true;
          continue;
        }

        const gab = line.match(GAB_RE);
        if (gab) {
          correct = gab[1].toUpperCase();
          inExplanation = false;
          continue;
        }

        const markedOpt = line.match(OPT_MARKED_CORRECT);
        if (markedOpt && !inExplanation) {
          options.push(markedOpt[2].replace(OPT_INLINE_CORRECT, '').trim());
          correct = markedOpt[1].toUpperCase();
          continue;
        }

        const opt = line.match(OPT_RE);
        if (opt && !inExplanation) {
          const optText = opt[2].trim();
          if (OPT_INLINE_CORRECT.test(optText)) correct = opt[1].toUpperCase();
          options.push(optText.replace(OPT_INLINE_CORRECT, '').trim());
          continue;
        }

        if (inExplanation) {
          explanationLines.push(line);
          continue;
        }

        // Caso contrário, faz parte do enunciado
        const qm = line.match(Q_PREFIX);
        const cleaned = qm ? qm[1] : line;
        
        // Tentar capturar gabarito inline via negrito ou parênteses se presente (ex: **A** ou (A))
        const boldGab = line.match(GAB_INLINE_BOLD);
        const parenGab = line.match(GAB_INLINE_PAREN);
        if (boldGab && !correct) correct = boldGab[1].toUpperCase();
        else if (parenGab && !correct) correct = parenGab[1].toUpperCase();

        question = question ? question + ' ' + cleaned : cleaned;
      }

      const explanation = explanationLines.join(' ').trim();
      const validLetters = new Set(['A', 'B', 'C', 'D', 'E']);
      if (correct && !validLetters.has(correct)) correct = '';
      // Garante que a letra apontada como correta existe nas opções
      if (correct && options.length > 0) {
        const idx = correct.charCodeAt(0) - 65;
        if (idx < 0 || idx >= options.length) correct = '';
      }

      if (isEssay || (question && options.length === 0 && explanation)) {
        if (question) parsed.push({ question, options: [], correct: 'dissertativa', explanation, type: 'essay' });
      } else if (question && options.length >= 2 && correct) {
        parsed.push({ question, options, correct, explanation, type: 'multiple_choice' });
      } else if (question && options.length >= 2 && !correct) {
        // Sem gabarito explícito: assume primeira como correta e marca para o admin revisar
        parsed.push({ question, options, correct: 'A', explanation: explanation || 'Gabarito não detectado — revise.', type: 'multiple_choice' });
      }
    }
    return parsed;
  };

  const handleBulkExerciseImport = async () => {
    if (!selectedApostila || !bulkExerciseText.trim()) return;
    const parsed = parseBulkExercises(bulkExerciseText);
    if (parsed.length === 0) { toast.error('Nenhum exercício detectado. Verifique o formato.'); return; }
    setBulkExerciseImporting(true);
    let ok = 0;
    for (const ex of parsed) {
      const { error } = await supabase.from('exercises').insert({
        apostila_id: selectedApostila, question: ex.question,
        options: ex.options, correct_answer: ex.correct, explanation: ex.explanation || null,
      });
      if (!error) ok++;
    }
    setBulkExerciseImporting(false);
    toast.success(`${ok}/${parsed.length} exercícios importados!`);
    if (ok > 0) { setBulkExerciseText(''); loadAll(); }
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      console.error('[deleteExercise] erro:', error);
      toast.error('Falha ao excluir exercício: ' + error.message);
      return;
    }
    toast.success('Exercício excluído');
    loadAll();
  };

  const handleEditMaterial = async () => {
    if (!editingMaterial) return;
    const { error } = await supabase.from('materials').update({ title: editMatTitle.trim(), description: editMatDesc || null }).eq('id', editingMaterial.id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Material atualizado!'); setEditingMaterial(null); loadAll();
  };

  // Filtered data
  const filteredApostilas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // 1. Filtragem inicial por busca e status
    let list = apostilas.filter((a) => {
      if (q && !(a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))) return false;
      if (filterStatus === 'published' && !a.published) return false;
      if (filterStatus === 'draft' && a.published) return false;
      
      if (filterSemester !== 'all') {
        if (filterSemester === 'none') { if (a.semester != null) return false; }
        else if (String(a.semester) !== filterSemester) return false;
      }
      
      if (filterCourse !== 'all') {
        const arr = (a.course || []) as string[];
        if (filterCourse === 'none') { if (arr.length) return false; }
        else if (!arr.includes(filterCourse)) return false;
      }
      return true;
    });

    // 2. Placeholder para o Admin (quando filtrado por semestre)
    const activeSemNum = filterSemester !== 'all' && filterSemester !== 'none' ? parseInt(filterSemester, 10) : null;
    
    if (activeSemNum && !q) {
      const canonicalSubjects = BY_SEMESTER[activeSemNum] || [];
      const existingCategories = new Set(list.map(a => a.category));
      
      const placeholders = canonicalSubjects
        .filter((subject: string) => !existingCategories.has(subject))
        .map((subject: string, idx: number) => ({
          id: `placeholder-admin-${activeSemNum}-${idx}`,
          title: `[GRADE] ${subject}`,
          category: subject,
          semester: activeSemNum,
          published: false,
          created_at: new Date().toISOString(),
          isPlaceholder: true,
          content: '',
          content_backup: '',
          course: [],
          cover_url: '',
          created_by: '',
          embedding: '',
          file_url: '',
          source_type: '',
          teacher: '',
          updated_at: new Date().toISOString()
        }));
        
      return [...list, ...placeholders] as any[];
    }

    return list;
  }, [apostilas, searchQuery, filterStatus, filterSemester, filterCourse]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter(m => m.title.toLowerCase().includes(q) || m.type.toLowerCase().includes(q));
  }, [materials, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const totalExercises = Object.values(exercises).flat().length;

  const tabTitles: Record<Tab, { title: string; desc: string }> = {
    ads: { title: 'Anúncios', desc: 'Gerencie banners e popups exibidos no app' },
    social: { title: 'Social', desc: 'Engajamento, curtidas e comentários' },
    overview: { title: 'Visão Geral', desc: 'Resumo completo da plataforma' },
    apostilas: { title: 'Gerenciar Apostilas', desc: `${apostilas.length} apostilas cadastradas` },
    exercises: { title: 'Gerenciar Exercícios', desc: `${totalExercises} exercícios cadastrados` },
    materials: { title: 'Gerenciar Materiais', desc: `${materials.length} materiais disponíveis` },
    users: { title: 'Gerenciar Usuários', desc: `${users.length} usuários cadastrados` },
    announcements: { title: 'Mural de Avisos', desc: 'Gerencie avisos para os alunos' },
    calendar: { title: 'Calendário Acadêmico', desc: 'Importe cronogramas e gerencie provas/trabalhos' },
    testimonials: { title: 'Depoimentos', desc: 'Aprove ou rejeite depoimentos dos alunos' },
    ai: { title: 'Provedor do Assistente', desc: 'Provedor padrão ou sua chave própria (Google)' },
    performance: { title: 'Performance', desc: 'Métricas de carregamento e erros de rede' },
    smoke: { title: 'Testes de Fumaça', desc: 'Checklist automático para validar a estabilidade do sistema' },
    diagnostics: { title: 'Diagnóstico', desc: 'Logs de runtime, falhas de carregamento e desempenho por rota' },
    'ads-chat': { title: 'Ads Chat Builder', desc: 'Gere criativos de anúncios com IA' },
    rss: { title: 'Feeds RSS de Notícias', desc: 'Gerencie as fontes de notícias exibidas em /noticias' },
    courses: { title: 'Cursos Gratuitos', desc: 'Gerencie os cursos gratuitos exibidos aos alunos' },
    'security-alerts': { title: 'Alertas de Segurança', desc: 'Tentativas recusadas pelo servidor' },
    'ella-audit': { title: 'Auditoria da Assistente', desc: 'Registro de ações e decisões do assistente' },
    changelog: { title: 'Histórico de Versões', desc: 'Tudo que foi criado, alterado e corrigido na plataforma' },
    leads: { title: 'Interessados em Patrocínio', desc: 'Briefings recebidos e histórico de contato' },
    sponsors: { title: 'Gestão de Anunciantes', desc: 'Controle marcas e logos para o Media Kit' },
    edit: { title: 'Editar Apostila', desc: 'Modo de edição manual' },
    review: { title: 'Revisar Apostila', desc: 'Revisão do conteúdo gerado' },
  };


  return (
    <CategoriesCtx.Provider value={{ categories: dbCategories }}>
      <div className="h-dvh bg-background flex overflow-hidden">
        {/* Desktop sidebar only */}
        <div className="hidden lg:block">
          <AdminSidebar
            tab={tab} setTab={setTab}
            stats={{ apostilas: apostilas.length, exercises: totalExercises, materials: materials.length, users: users.length }}
            sidebarOpen={false} setSidebarOpen={() => {}}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border h-14 flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu do painel"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 hidden lg:inline-flex" onClick={() => navigate('/dashboard')} aria-label="Voltar ao dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex-1 min-w-0 text-left lg:pointer-events-none"
              aria-label="Trocar de seção"
            >
              <h2 className="text-base font-bold text-foreground truncate">{tabTitles[tab].title}</h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block truncate">{tabTitles[tab].desc}</p>
            </button>


            {tab !== 'overview' && (
              <div className="relative max-w-xs w-full hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9 h-9 text-sm bg-muted/50 border-border/50"
                />
              </div>
            )}

            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={loadAll} disabled={refreshing} aria-label="Atualizar">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </header>

          {/* Menu deslizante (celular/tablet) — mesma organização da sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-[320px] max-w-[90vw] p-0 flex flex-col lg:hidden">
              <SheetHeader className="px-4 py-4 border-b border-border text-left">
                <SheetTitle className="text-sm">Painel Administrativo</SheetTitle>
                <p className="text-[10px] text-muted-foreground">Decode Analytics</p>
              </SheetHeader>
              <div className="min-h-0 flex-1">
                <AdminNavPanel
                  tab={tab}
                  onSelect={(id) => { setTab(id as Tab); setSidebarOpen(false); }}
                  counts={{
                    apostilas: apostilas.length,
                    exercises: totalExercises,
                    materials: materials.length,
                    users: users.length,
                  }}
                  footerSlot={
                    <div className="space-y-1">
                      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Acervos</p>
                      <button
                        onClick={() => { setSidebarOpen(false); navigate('/admin/biblioteca'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/5 text-primary border border-primary/20"
                      >
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">Biblioteca de Livros</span>
                      </button>
                    </div>
                  }
                />
              </div>
              <div className="border-t border-border p-3">
                <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={() => { setSidebarOpen(false); navigate('/dashboard'); }}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Dashboard
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Content */}
          <main className="flex-1 p-4 pb-8 sm:p-6 lg:p-8 overflow-auto min-w-0 bg-muted/30">

            {/* Mobile search */}
            {tab !== 'overview' && (
              <div className="relative mb-4 sm:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar..." className="pl-9 h-10 bg-muted/50" />
              </div>
            )}

            <div key={tab} className="animate-fade-in">
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <AdminDashboard 
                onNavigate={(newTab) => setTab(newTab as Tab)} 
                filterSemester={filterSemester}
                setFilterSemester={setFilterSemester}
              />
            )}

            {/* APOSTILAS */}
            {tab === 'apostilas' && (
              <div className="space-y-6">
                {/* Import Card */}
                <Card className="overflow-hidden bg-card/40 backdrop-blur-md border-primary/20 shadow-xl" data-import-card>
                  <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      Central de Criação
                    </CardTitle>
                    <CardDescription className="text-[11px]">Crie novas apostilas via link, arquivo ou texto estruturado.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5 pt-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Importar Apostila</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {!batchMode && importStep === 'input' && (
                          <div className="inline-flex bg-muted rounded-full p-0.5">
                            <button
                              onClick={() => setImportMode('url')}
                              className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${importMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              URL
                            </button>
                            <button
                              onClick={() => setImportMode('text')}
                              className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${importMode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              Texto
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => { setBatchMode(!batchMode); resetImportForm(); }}
                          className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${batchMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                          {batchMode ? 'Lote' : 'Modo Lote'}
                        </button>
                      </div>
                    </div>

                    {batchMode ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Cole várias URLs (uma por linha)</Label>
                          <Textarea value={batchUrls} onChange={e => setBatchUrls(e.target.value)}
                            placeholder={"https://notion.site/pagina-1\nhttps://exemplo.com/artigo"}
                            rows={5} className="mt-1 text-xs font-mono" disabled={batchRunning} />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {batchUrls.split('\n').filter(u => u.trim().startsWith('http')).length} URL(s) detectada(s)
                          </p>
                        </div>
                        {batchRunning && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Importando...</span>
                              <span className="font-medium">{batchProgress.current}/{batchProgress.total}</span>
                            </div>
                            <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
                          </div>
                        )}
                        {batchProgress.results.length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {batchProgress.results.map((r, i) => (
                              <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${r.status === 'ok' ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-destructive/10 text-destructive'}`}>
                                {r.status === 'ok' ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                                <span className="truncate">{r.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button onClick={handleBatchImport} disabled={batchRunning || !batchUrls.trim()} className="w-full gradient-primary text-primary-foreground">
                          {batchRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Importando {batchProgress.current}/{batchProgress.total}</> : 'Importar Tudo'}
                        </Button>
                      </div>
                    ) : importStep === 'input' ? (
                      <div className="space-y-3">
                        {importMode === 'url' ? (
                          <>
                            <div>
                              <Label htmlFor="import-url" className="text-xs font-medium text-foreground">URL da Página</Label>
                              <div className="flex gap-3 mt-1.5">
                                <div className="relative flex-1">
                                  <Input id="import-url" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="Ex: https://youtu.be/… ou https://notion.site/…"
                                    className={importUrl.includes('notion') ? 'pr-20' : ''} />
                                  {importUrl.includes('notion') && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Notion</span>
                                  )}
                                </div>
                                <Button onClick={handleExtract} disabled={cloning || !importUrl.trim()} className="gradient-primary text-primary-foreground shrink-0">
                                  {cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clonar'}
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* PDF Drop Zone */}
                            <div
                              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                              onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const files = Array.from(e.dataTransfer.files);
                                const file = files.find(f => /\.(pdf|txt|docx?)$/i.test(f.name));
                                if (!file) { toast.error('Arraste um arquivo PDF, TXT ou DOCX'); return; }
                                const tId = toast.loading(`Lendo ${file.name}...`);
                                try {
                                  const text = await extractTextFromFile(file, (p) => {
                                    toast.loading(p.message, { id: tId });
                                  });
                                  if (!text || text.trim().length < 20) {
                                    toast.error('Não foi possível extrair texto deste arquivo (pode estar protegido ou ser só imagens).', { id: tId });
                                    return;
                                  }
                                  setImportRawText(prev => prev ? prev + '\n\n' + text : text);
                                  if (!importTitle) setImportTitle(file.name.replace(/\.[^.]+$/, ''));
                                  toast.success(`"${file.name}" — ${text.split(/\s+/).length} palavras extraídas`, { id: tId });
                                } catch (err: any) {
                                  toast.error(err?.message || 'Erro ao ler o arquivo', { id: tId });
                                }
                              }}
                              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pdf,.txt,.doc,.docx';
                                input.onchange = async (ev) => {
                                  const file = (ev.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  const tId = toast.loading(`Lendo ${file.name}...`);
                                  try {
                                    const text = await extractTextFromFile(file, (p) => {
                                      toast.loading(p.message, { id: tId });
                                    });
                                    if (!text || text.trim().length < 20) {
                                      toast.error('Não foi possível extrair texto deste arquivo.', { id: tId });
                                      return;
                                    }
                                    setImportRawText(prev => prev ? prev + '\n\n' + text : text);
                                    if (!importTitle) setImportTitle(file.name.replace(/\.[^.]+$/, ''));
                                    toast.success(`"${file.name}" — ${text.split(/\s+/).length} palavras extraídas`, { id: tId });
                                  } catch (err: any) {
                                    toast.error(err?.message || 'Erro ao ler o arquivo', { id: tId });
                                  }
                                };
                                input.click();
                              }}
                            >
                              <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                              <p className="text-xs font-medium text-foreground">Arraste um PDF, TXT ou DOCX aqui</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">ou clique para selecionar (até 25MB)</p>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                              <p className="relative bg-card text-[10px] text-muted-foreground text-center w-fit mx-auto px-2">ou cole o texto diretamente</p>
                            </div>

                            <div>
                              <Label htmlFor="import-rawtext" className="text-xs font-medium text-foreground mb-1.5 block">Texto da Apostila</Label>
                              <Textarea
                                id="import-rawtext"
                                value={importRawText}
                                onChange={e => setImportRawText(e.target.value)}
                                placeholder={"Cole aqui a aula bruta para estruturar com IA ou uma apostila já pronta para salvar direto.\n\nVocê pode colar texto com títulos, listas e links já organizados."}
                                rows={14}
                                className="min-h-[320px] resize-y leading-6"
                              />
                            </div>
                          </>
                        )}
                        <div>
                          <Label htmlFor="import-title" className="text-xs font-medium text-foreground">Título da Aula (opcional)</Label>
                          <Input id="import-title" value={importTitle} onChange={e => setImportTitle(e.target.value)} placeholder="Ex: Estrutura de Dados — Árvores AVL (NP2)" className="mt-1.5" />
                        </div>
                        <div>
                          <Label htmlFor="import-topic" className="text-xs font-medium text-foreground">Disciplina / Tópico</Label>
                          <Input id="import-topic" value={importTopic} onChange={e => setImportTopic(e.target.value)} placeholder="Ex: Redes de Computadores, Banco de Dados" className="mt-1.5" />
                        </div>
                        {importMode === 'text' && importStep === 'input' && (
                          <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10 shadow-inner">
                            <div className="flex items-start gap-2.5">
                              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="space-y-1">
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  Use <strong>Estruturar com Ella</strong> para organizar seu texto cru em módulos.
                                </p>
                                <p className="text-[10px] text-primary font-medium">
                                  DICA: Se já tiver o texto pronto, use o <strong>Modo Word</strong> abaixo para formatar como se estivesse no Google Docs!
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <Button 
                                onClick={handleExtract} 
                                disabled={cloning || !importRawText.trim()} 
                                className="w-full gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform h-10"
                              >
                                {cloning ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Estruturando...</> : <><Wand2 className="h-4 w-4 mr-2" /> Estruturar com Ella</>}
                              </Button>
                              <Button 
                                onClick={() => {
                                  if (!importTitle.trim()) {
                                    toast.error("Dê um título antes de entrar no Modo Word");
                                    return;
                                  }
                                  setImportContent(importRawText);
                                  setImportStep('edit');
                                }}
                                disabled={cloning || !importRawText.trim()} 
                                variant="outline" 
                                className="w-full h-10 border-primary/20 hover:bg-primary/5 text-primary"
                              >
                                <FileText className="h-4 w-4 mr-2" /> Modo Word
                              </Button>
                              <Button 
                                onClick={handleSaveReadyText} 
                                disabled={cloning || !importRawText.trim() || !importTitle.trim()} 
                                variant="outline" 
                                className="w-full h-10 border-border/50 hover:bg-muted/50"
                              >
                                {cloning ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Salvando...</> : <><Check className="h-4 w-4 mr-2" /> Salvar Rápido</>}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : importStep === 'edit' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/10 text-primary text-xs border border-primary/20">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span>Modo Word Ativado: Formate seu conteúdo com as ferramentas acima.</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setImportStep('input')} className="h-6 px-2 text-[10px]">Alterar Origem</Button>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Título</Label>
                            <Input value={importTitle} onChange={e => setImportTitle(e.target.value)} placeholder="Título da apostila" className="mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Disciplina</Label>
                            <CategorySelect value={importTopic} onValueChange={setImportTopic} />
                          </div>
                        </div>

                        <div className="border border-border rounded-xl overflow-hidden bg-background">
                          <MarkdownEditor 
                            value={importContent} 
                            onChange={setImportContent} 
                            onSave={handleSaveImport}
                            className="border-none shadow-none min-h-[500px]"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={resetImportForm}>Cancelar</Button>
                          <Button className="flex-1 gradient-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={handleSaveImport} disabled={cloning || !importTitle.trim()}>
                            {cloning && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Salvar Apostila
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>Conteúdo extraído! Revise antes de salvar.</span>
                          </div>
                          {extractionMethod && (
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              extractionMethod.includes('firecrawl')
                                ? 'bg-orange-500/20 text-orange-400'
                                : extractionMethod === 'text'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {extractionMethod.includes('firecrawl') ? 'Firecrawl' : extractionMethod === 'text' ? 'Texto' : 'Fetch'}
                            </span>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Título</Label>
                          <Input value={importTitle} onChange={e => setImportTitle(e.target.value)} placeholder="Título da apostila" className="mt-1" />
                        </div>
                        <div><Label className="text-xs text-muted-foreground">Categoria</Label><CategorySelect value={importTopic} onValueChange={setImportTopic} /></div>

                        {/* Pré-visualização rica: sebras + estrutura + glossário + perguntas */}
                        <ImportPreviewPanel content={importContent} aiExercises={importExercises} />

                        <div>
                          <Label className="text-xs text-muted-foreground">Conteúdo (Markdown)</Label>
                          <Textarea value={importContent} onChange={e => setImportContent(e.target.value)} rows={6} className="mt-1 text-xs font-mono" />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={resetImportForm}>Cancelar</Button>
                          <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleSaveImport} disabled={cloning || !importTitle.trim()}>
                            {cloning && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Salvar {importExercises.length > 0 && `+ ${importExercises.length} ex.`}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Manual Create */}
                {showManualForm ? (
                  <Card className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardContent className="p-6 space-y-5">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" /> Criar Apostila Manualmente
                      </h3>
                      <div>
                        <Label htmlFor="manual-title" className="text-xs font-medium text-foreground">Título da Apostila</Label>
                        <Input id="manual-title" value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Ex: Estrutura de Dados — Árvores Binárias" className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="manual-category" className="text-xs font-medium text-foreground">Disciplina / Categoria</Label>
                        <CategorySelect value={manualCategory} onValueChange={setManualCategory} placeholder="Selecione a disciplina" />
                      </div>
                      <div>
                        <Label htmlFor="manual-content" className="text-xs font-medium text-foreground mb-1.5 block">Conteúdo da Apostila</Label>
                        <MarkdownEditor
                          value={manualContent}
                          onChange={setManualContent}
                          placeholder="Digite ou cole o conteúdo completo da aula. Use a barra para formatar..."
                          rows={12}
                        />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <Button variant="outline" className="flex-1 opacity-80" onClick={() => setShowManualForm(false)}>Cancelar</Button>
                        <Button className="flex-1 gradient-primary text-primary-foreground animate-pulse-glow" onClick={handleManualSave} disabled={!manualTitle.trim()}>Salvar Apostila</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button variant="outline" className="w-full py-5" onClick={() => setShowManualForm(true)}>
                    <Plus className="mr-1.5 h-4 w-4" /> Criar Apostila Manualmente
                  </Button>
                )}

                {/* Apostilas List */}
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Apostilas ({filteredApostilas.length})
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <MergeButton onMerged={loadAll} />
                      <AutoLinkAllButton />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={async () => {
                          toast.loading('Gerando embeddings...', { id: 'embed' });
                          const { data, error } = await supabase.functions.invoke('embed-apostilas', { body: {} });
                          if (error) { toast.error('Erro: ' + error.message, { id: 'embed' }); return; }
                          toast.success(`Embeddings: ${data.processed} ok, ${data.failed} falhas`, { id: 'embed' });
                        }}
                        title="Gera embeddings das apostilas para o Tira-dúvida com foto"
                      >
                        <PenTool className="h-3.5 w-3.5 mr-1" /> Indexar p/ Tira-dúvida
                      </Button>
                    </div>
                  </div>

                  {/* Barra de filtros — semestre, curso, status */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap p-2 rounded-lg bg-muted/30 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">Filtros:</span>
                    <Select value={filterSemester} onValueChange={setFilterSemester}>
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os semestres</SelectItem>
                        <SelectItem value="none">Sem semestre</SelectItem>
                        {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>{n}º Semestre</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os cursos</SelectItem>
                        <SelectItem value="none">Sem curso</SelectItem>
                        <SelectItem value="CC">Ciência da Computação</SelectItem>
                        <SelectItem value="SI">Sistemas de Informação</SelectItem>
                        <SelectItem value="EC">Engenharia da Computação</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="published">Publicadas</SelectItem>
                        <SelectItem value="draft">Ocultas</SelectItem>
                      </SelectContent>
                    </Select>
                    {(filterSemester !== 'all' || filterCourse !== 'all' || filterStatus !== 'all') && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setFilterSemester('all'); setFilterCourse('all'); setFilterStatus('all'); }}>
                        <X className="h-3 w-3 mr-1" /> Limpar
                      </Button>
                    )}
                  </div>

                  {(() => {
                    // Agrupa por disciplina (category). Auto-expande quando há busca ativa
                    // para não esconder resultados.
                    const groups = new Map<string, typeof filteredApostilas>();
                    filteredApostilas.forEach(a => {
                      const key = (a.category || 'Sem disciplina').trim() || 'Sem disciplina';
                      if (!groups.has(key)) groups.set(key, [] as any);
                      (groups.get(key) as any).push(a);
                    });
                    const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
                      a[0].localeCompare(b[0], 'pt-BR', { sensitivity: 'base' })
                    );
                    const searching = searchQuery.trim().length > 0;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sortedGroups.map(([cat, items]) => {
                          const open = searching || expandedCats.has(cat);
                          const publishedCount = items.filter(x => x.published).length;
                          const totalEx = items.reduce((s, x) => s + (exercises[x.id]?.length || 0), 0);
                          return (
                            <Card key={cat} className={`col-span-1 ${open ? 'sm:col-span-2 lg:col-span-3' : ''} border-border/70 hover:border-primary/40 transition-colors`}>
                              <button
                                type="button"
                                onClick={() => toggleCat(cat)}
                                className="w-full text-left p-4 flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-xl"
                                aria-expanded={open}
                              >
                                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <FolderOpen className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm truncate">{cat}</h4>
                                    <Badge variant="secondary" className="text-[10px]">{items.length} {items.length === 1 ? 'apostila' : 'apostilas'}</Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {publishedCount} publicada{publishedCount === 1 ? '' : 's'} · {totalEx} exercícios
                                  </p>
                                </div>
                                <div className={`text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}>
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </button>
                              {open && (
                                <div className="px-3 pb-3 space-y-2 border-t border-border/60 pt-3">
                                  {items.map(a => {
                    const exCount = exercises[a.id]?.length || 0;
                    const semBadge = a.semester ? `${a.semester}º sem` : null;
                    const courseList = (a.course || []) as string[];
                    return (
                      <Card key={a.id} className="hover-lift card-alternate">

                          <CardContent className="p-3 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                <span className={`h-3 w-3 rounded-full shrink-0 mt-1.5 sm:mt-0 ${a.published ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <h4 className="font-medium text-sm break-words leading-snug min-w-0 flex-1">{a.title}</h4>
                                    <Badge variant={a.published ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                      {a.published ? 'Publicada' : 'Oculta'}
                                    </Badge>
                                    {semBadge && (
                                      <Badge variant="outline" className="text-[10px] shrink-0 border-primary/40 text-primary">
                                        {semBadge}
                                      </Badge>
                                    )}
                                    {courseList.map((c) => (
                                      <Badge key={c} variant="outline" className="text-[9px] shrink-0">
                                        {c}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                    <span className="truncate max-w-[140px]">{a.category}</span>
                                    <span>·</span>
                                    <span className="whitespace-nowrap">{exCount} ex.</span>
                                    <span>·</span>
                                    <span className="whitespace-nowrap">{new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 sm:flex-nowrap shrink-0 justify-end pl-6 sm:pl-0">
                                {/* Secondary actions — desktop only */}
                                <div className="hidden sm:flex items-center gap-1">
                                  <ApostilaMaterialsManager apostilaId={a.id} apostilaTitle={a.title} />
                                  <AppendLinkDialog
                                    apostilaId={a.id}
                                    apostilaTitle={a.title}
                                    currentContent={a.content || ''}
                                    onDone={loadAll}
                                    trigger={
                                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Anexar link à apostila">
                                        <Link2 className="h-3.5 w-3.5" />
                                      </Button>
                                    }
                                  />
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowExerciseDialog(a.id)} title="Ver exercícios">
                                    <PenLine className="h-3.5 w-3.5" />
                                  </Button>
                                </div>

                                {/* Primary actions — always visible */}
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setExportingApostila(a)} title="Exportar apostila (PDF/DOCX)">
                                  <FileDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="hidden sm:inline-flex h-8 px-2.5 text-xs gap-1.5 gradient-primary text-primary-foreground"
                                    onClick={async () => {
                                      if ((a as any).isPlaceholder || a.id.startsWith('placeholder')) {
                                        try {
                                          const realId = await ensureApostilaExists(a as any);
                                          toast.success(`Apostila "${a.title.replace(/^\[GRADE\]\s*/i, '')}" iniciada!`);
                                          navigate(`/admin/apostilas/${realId}`);
                                        } catch (err: any) {
                                          toast.error('Erro ao iniciar apostila: ' + (err?.message || 'Tente novamente.'));
                                        }
                                      } else {
                                        navigate(`/admin/apostilas/${a.id}`);
                                      }
                                    }}
                                    title={(a as any).isPlaceholder ? 'Começar esta matéria' : 'Abrir no Workbench (editor completo)'}
                                  >
                                    {(a as any).isPlaceholder ? <><Plus className="h-3.5 w-3.5" /> Começar</> : <><PenTool className="h-3.5 w-3.5" /> Workbench</>}
                                  </Button>
                                  <Button size="icon" variant="ghost" className="hidden sm:inline-flex h-8 w-8" onClick={async () => { 
                                    if ((a as any).isPlaceholder || a.id.startsWith('placeholder')) {
                                      try {
                                        const realId = await ensureApostilaExists(a as any);
                                        toast.success(`Apostila "${a.title.replace(/^\[GRADE\]\s*/i, '')}" iniciada!`);
                                        navigate(`/admin/apostilas/${realId}`);
                                      } catch (err: any) {
                                        toast.error('Erro ao iniciar apostila: ' + (err?.message || 'Tente novamente.'));
                                      }
                                    } else {
                                      setEditingApostila(a); setEditTitle(a.title); setEditContent(a.content || ''); setEditCategory(a.category); 
                                    }
                                  }} title="Editar">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  {!(a as any).isPlaceholder && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmDeleteId(a.id)} title="Excluir">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}

                                  {/* Kebab — mobile only, agrupa secundárias + editar */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="icon" variant="ghost" className="sm:hidden h-8 w-8" title="Mais ações">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                      <DropdownMenuLabel className="text-xs">Mais ações</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {!(a as any).isPlaceholder && (
                                        <>
                                          <DropdownMenuItem onClick={() => setShowMaterialsFor(a.id)}>
                                            <Paperclip className="h-3.5 w-3.5 mr-2" /> Materiais vinculados
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setShowAppendFor(a.id)}>
                                            <Link2 className="h-3.5 w-3.5 mr-2" /> Anexar link
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setShowExerciseDialog(a.id)}>
                                            <PenLine className="h-3.5 w-3.5 mr-2" /> Ver exercícios
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}
                                      <DropdownMenuItem onClick={async () => {
                                        if ((a as any).isPlaceholder || a.id.startsWith('placeholder')) {
                                          try {
                                            const realId = await ensureApostilaExists(a as any);
                                            toast.success(`Apostila "${a.title.replace(/^\[GRADE\]\s*/i, '')}" iniciada!`);
                                            navigate(`/admin/apostilas/${realId}`);
                                          } catch (err: any) {
                                            toast.error('Erro ao iniciar apostila: ' + (err?.message || 'Tente novamente.'));
                                          }
                                        } else {
                                          navigate(`/admin/apostilas/${a.id}`);
                                        }
                                      }}>
                                        <PenTool className="h-3.5 w-3.5 mr-2 text-primary" /> {(a as any).isPlaceholder ? 'Começar Matéria' : 'Abrir no Workbench'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={async () => { 
                                        if ((a as any).isPlaceholder || a.id.startsWith('placeholder')) {
                                          try {
                                            const realId = await ensureApostilaExists(a as any);
                                            toast.success(`Apostila "${a.title.replace(/^\[GRADE\]\s*/i, '')}" iniciada!`);
                                            navigate(`/admin/apostilas/${realId}`);
                                          } catch (err: any) {
                                            toast.error('Erro ao iniciar apostila: ' + (err?.message || 'Tente novamente.'));
                                          }
                                        } else {
                                          setEditingApostila(a); setEditTitle(a.title); setEditContent(a.content || ''); setEditCategory(a.category); 
                                        }
                                      }}>
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
                                </div>
                              )}
                            </Card>
                          );
                        })}
                        {sortedGroups.length === 0 && (
                          <div className="col-span-full text-center py-12 text-muted-foreground">
                            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">{searchQuery ? 'Nenhuma apostila encontrada.' : 'Nenhuma apostila criada.'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Mobile-controlled secondary dialogs (triggered by kebab menu) */}
                {apostilas.map(a => (
                  <ApostilaMaterialsManager
                    key={`mat-${a.id}`}
                    apostilaId={a.id}
                    apostilaTitle={a.title}
                    hideTrigger
                    open={showMaterialsFor === a.id}
                    onOpenChange={(v) => setShowMaterialsFor(v ? a.id : null)}
                  />
                ))}
                {showAppendFor && (() => {
                  const a = apostilas.find(x => x.id === showAppendFor);
                  if (!a) return null;
                  return (
                    <AppendLinkDialog
                      apostilaId={a.id}
                      apostilaTitle={a.title}
                      currentContent={a.content || ''}
                      onDone={loadAll}
                      open
                      onOpenChange={(v) => { if (!v) setShowAppendFor(null); }}
                    />
                  );
                })()}

                {/* Edit Classico Modal Refatorado */}
                <Dialog open={!!editingApostila} onOpenChange={(v) => { if (!v) setEditingApostila(null); }}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Editar Apostila</DialogTitle>
                    </DialogHeader>
                    {editingApostila && (
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="edit-title" className="text-xs font-medium">Título</Label>
                            <Input id="edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="edit-teacher" className="text-xs font-medium">Professor</Label>
                            <Input id="edit-teacher" value={(editingApostila as any).teacher || ''} onChange={e => setEditingApostila({ ...editingApostila, teacher: e.target.value })} placeholder="Nome do prof." className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-category" className="text-xs font-medium">Disciplina/Categoria</Label>
                          <CategorySelect value={editCategory || ''} onValueChange={setEditCategory} />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={() => setEditingApostila(null)}>Cancelar</Button>
                          <Button onClick={async () => {
                            if (!editingApostila) return;
                            const tId = toast.loading('Salvando...');
                            const { error } = await supabase.from('apostilas').update({
                              title: editTitle,
                              category: editCategory,
                              teacher: (editingApostila as any).teacher
                            }).eq('id', editingApostila.id);
                            if (error) toast.error('Erro ao salvar', { id: tId });
                            else {
                              toast.success('Salvo com sucesso', { id: tId });
                              setEditingApostila(null);
                              loadAll();
                            }
                          }}>Salvar Alterações</Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Exercise Dialog */}
                {apostilas.map(a => (
                  <Dialog key={a.id} open={showExerciseDialog === a.id} onOpenChange={(v) => { setShowExerciseDialog(v ? a.id : null); if (v) { setExerciseDialogMode('individual'); setAiExercises([]); } }}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="text-base">Exercícios — {a.title}</DialogTitle></DialogHeader>
                      
                      {/* Existing exercises */}
                      {exercises[a.id]?.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          <PenTool className="h-8 w-8 mx-auto mb-2 opacity-30" strokeWidth={1.5} /> Nenhum exercício.
                        </div>
                      )}
                      {exercises[a.id]?.map((ex, i) => (
                        <div key={ex.id} className="border border-border/50 rounded-lg p-3 mb-2 text-sm">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-xs">{i + 1}. {ex.question}</p>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteExercise(ex.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          {Array.isArray(ex.options) && (ex.options as string[]).map((opt, oi) => (
                            <p key={oi} className={`text-[11px] mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : 'text-muted-foreground'}`}>
                              {String.fromCharCode(65 + oi)}) {opt}
                            </p>
                          ))}
                        </div>
                      ))}
                      
                      <Separator />
                      
                      {/* Mode Toggle */}
                      <div className="flex items-center gap-2">
                        <div className="inline-flex bg-muted rounded-full p-0.5 w-full">
                          {([['individual', 'Individual'], ['bulk', 'Lote'], ['ai', 'Assistente']] as const).map(([mode, label]) => (
                            <button key={mode} onClick={() => setExerciseDialogMode(mode)}
                              className={`flex-1 text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors ${exerciseDialogMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Individual Mode */}
                      {exerciseDialogMode === 'individual' && (
                        <div className="space-y-3 pt-2">
                          <p className="font-semibold text-sm">Novo exercício</p>
                          <Textarea value={exQuestion} onChange={e => setExQuestion(e.target.value)} placeholder="Pergunta" rows={2} />
                          {exOptions.map((o, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-6">{String.fromCharCode(65 + i)})</span>
                              <Input value={o} onChange={e => { const n = [...exOptions]; n[i] = e.target.value; setExOptions(n); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                            </div>
                          ))}
                          <div><Label className="text-xs">Resposta correta</Label>
                            <Select value={exCorrect} onValueChange={setExCorrect}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Explicação (opcional)</Label><Textarea value={exExplanation} onChange={e => setExExplanation(e.target.value)} rows={2} /></div>
                          <Button onClick={() => {
                            if (!exQuestion.trim()) return;
                            supabase.from('exercises').insert({
                              apostila_id: a.id, question: exQuestion, options: exOptions,
                              correct_answer: exCorrect, explanation: exExplanation || null,
                            }).then(({ error }) => {
                              if (error) { toast.error('Erro'); return; }
                              toast.success('Exercício adicionado!');
                              setExQuestion(''); setExOptions(['', '', '', '']); setExExplanation('');
                              loadAll();
                            });
                          }} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                        </div>
                      )}

                      {/* Bulk Mode */}
                      {exerciseDialogMode === 'bulk' && (
                        <div className="space-y-3 pt-2">
                          <p className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Importar em Lote</p>
                          <div className="bg-muted/50 rounded-lg p-3 text-[10px] font-mono text-muted-foreground leading-relaxed space-y-2">
                            <div>
                              <p className="text-foreground font-semibold mb-1">Múltipla escolha:</p>
                              <p>1. Qual é a capital do Brasil?</p>
                              <p>A) São Paulo</p><p>B) Rio de Janeiro</p><p>C) Brasília</p><p>D) Salvador</p>
                              <p>Gabarito: C</p><p>Explicação: Brasília é a capital federal.</p>
                            </div>
                            <div>
                              <p className="text-foreground font-semibold mb-1">Dissertativa:</p>
                              <p>2. Explique o processo de urbanização no Brasil.</p>
                              <p>Tipo: dissertativa</p>
                              <p>Resposta esperada: O processo de urbanização...</p>
                            </div>
                          </div>
                          <Textarea value={bulkExerciseText} onChange={e => setBulkExerciseText(e.target.value)}
                            placeholder="Cole aqui suas perguntas (alternativas ou dissertativas)..." rows={10} className="font-mono text-xs" />
                          {bulkExerciseText.trim() && (() => {
                            const p = parseBulkExercises(bulkExerciseText);
                            const mc = p.filter(e => e.type === 'multiple_choice').length;
                            const essay = p.filter(e => e.type === 'essay').length;
                            return <p className="text-[10px] text-muted-foreground">{p.length} exercício(s) detectado(s) — {mc} alternativa(s), {essay} dissertativa(s)</p>;
                          })()}
                          <Button onClick={() => {
                            const parsed = parseBulkExercises(bulkExerciseText);
                            if (parsed.length === 0) { toast.error('Nenhum exercício detectado.'); return; }
                            setBulkExerciseImporting(true);
                            Promise.all(parsed.map(ex => supabase.from('exercises').insert({
                              apostila_id: a.id, question: ex.question, options: ex.options,
                              correct_answer: ex.correct, explanation: ex.explanation || null,
                            }))).then(results => {
                              const ok = results.filter(r => !r.error).length;
                              toast.success(`${ok}/${parsed.length} exercícios importados!`);
                              setBulkExerciseText(''); setBulkExerciseImporting(false); loadAll();
                            });
                          }} disabled={!bulkExerciseText.trim() || bulkExerciseImporting} className="w-full gradient-primary text-primary-foreground">
                            {bulkExerciseImporting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Importando...</> : 'Importar Exercícios'}
                          </Button>
                        </div>
                      )}

                      {/* AI Mode */}
                      {exerciseDialogMode === 'ai' && (
                        <div className="space-y-3 pt-2">
                          <p className="font-semibold text-sm flex items-center gap-2"><PenTool className="h-4 w-4 text-primary" /> Gerar com IA</p>
                          {!a.content?.trim() ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              <p className="text-xs">Esta apostila não tem conteúdo. Adicione conteúdo primeiro para gerar exercícios com IA.</p>
                            </div>
                          ) : aiExercises.length === 0 ? (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px]">Múltipla escolha</Label>
                                  <Select value={String(aiMcCount)} onValueChange={v => setAiMcCount(+v)}>
                                    <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[0,2,4,5,6,8,10,12,15,18,20].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-[10px]">Dissertativas</Label>
                                  <Select value={String(aiEssayCount)} onValueChange={v => setAiEssayCount(+v)}>
                                    <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>{[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Total: {aiMcCount + aiEssayCount} exercícios ({aiMcCount} alternativa + {aiEssayCount} dissertativa)</p>
                              <Button onClick={async () => {
                                if (aiMcCount + aiEssayCount < 1) { toast.error('Selecione pelo menos 1 exercício.'); return; }
                                setAiGenerating(true);
                                try {
                                  const { data, error } = await supabase.functions.invoke('generate-exercises', {
                                    body: { content: a.content, title: a.title, mcCount: aiMcCount, essayCount: aiEssayCount },
                                  });
                                  if (error) {
                                    let msg = error.message;
                                    try { const ctx = await (error as any).context?.json?.(); if (ctx?.error) msg = ctx.error; } catch {}
                                    throw new Error(msg);
                                  }
                                  if (data?.error) throw new Error(data.error);
                                  if (!data?.exercises?.length) throw new Error('Nenhum exercício foi gerado.');
                                  setAiExercises(data.exercises);
                                  toast.success(`${data.exercises.length} exercícios gerados!`);
                                } catch (err: any) { toast.error('Erro: ' + (err.message || 'Tente novamente')); }
                                setAiGenerating(false);
                              }} disabled={aiGenerating} className="w-full gradient-primary text-primary-foreground">
                                {aiGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Gerando exercícios...</> : <><Wand2 className="h-4 w-4 mr-1.5" /> Gerar Exercícios com IA</>}
                              </Button>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground">{aiExercises.length} exercícios gerados. Revise e salve:</p>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {aiExercises.map((ex, i) => (
                                  <div key={i} className="border border-border/50 rounded-lg p-3 text-xs">
                                    <div className="flex justify-between items-start">
                                      <p className="font-medium">
                                        {i + 1}. {ex.question}
                                        {ex.type === 'essay' && <Badge variant="outline" className="ml-2 text-[9px] py-0">Dissertativa</Badge>}
                                      </p>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setAiExercises(prev => prev.filter((_, idx) => idx !== i))}>
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </div>
                                    {ex.type !== 'essay' && ex.options.length > 0 && (
                                      <div className="mt-1 space-y-0.5 text-muted-foreground">
                                        {ex.options.map((opt, oi) => (
                                          <p key={oi} className={String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : ''}>{String.fromCharCode(65 + oi)}) {opt}</p>
                                        ))}
                                      </div>
                                    )}
                                    {ex.explanation && <p className="mt-1 text-[10px] text-muted-foreground italic">{ex.type === 'essay' ? 'Resposta modelo: ' : ''}{ex.explanation}</p>}
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setAiExercises([])}>Descartar</Button>
                                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={async () => {
                                  let ok = 0;
                                  for (const ex of aiExercises) {
                                    const { error } = await supabase.from('exercises').insert({
                                      apostila_id: a.id, question: ex.question, options: ex.options,
                                      correct_answer: ex.correct_answer, explanation: ex.explanation || null,
                                    });
                                    if (!error) ok++;
                                  }
                                  toast.success(`${ok}/${aiExercises.length} exercícios salvos!`);
                                  setAiExercises([]); loadAll();
                                }}>Salvar Todos ({aiExercises.length})</Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                ))}

                {/* Edit Apostila Dialog */}
                <Dialog open={!!editingApostila} onOpenChange={(v) => { if (!v) { setEditingApostila(null); setEditExerciseMode('individual'); setEditAiExercises([]); setEditBulkText(''); } }}>
                  <DialogContent className="max-w-5xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[95dvh] sm:max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden">
                    <DialogHeader className="px-3 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3 border-b border-border shrink-0">
                      <DialogTitle className="text-sm sm:text-base">Editar Apostila</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div><Label className="text-xs mb-1 block">Título</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
                        <div><Label className="text-xs mb-1 block">Categoria</Label><CategorySelect value={editCategory} onValueChange={setEditCategory} /></div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Conteúdo</Label>
                        <MarkdownEditor
                          value={editContent}
                          onChange={setEditContent}
                          rows={16}
                          placeholder="Comece a escrever — use a barra de formatação acima"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {editingApostila && (
                          <AppendLinkDialog
                            apostilaId={editingApostila.id}
                            apostilaTitle={editingApostila.title}
                            currentContent={editContent}
                            onDone={async () => {
                              const { data: refreshed } = await supabase.from('apostilas').select('content').eq('id', editingApostila.id).maybeSingle();
                              if (refreshed?.content) setEditContent(refreshed.content);
                              loadAll();
                            }}
                            trigger={
                              <Button variant="outline" className="w-full sm:flex-1 gap-1.5 text-xs">
                                <Link2 className="h-3.5 w-3.5" /> <span className="truncate">Anexar link como continuação</span>
                              </Button>
                            }
                          />
                        )}
                        {editingApostila && (
                          <Button
                            variant="outline"
                            className="w-full sm:flex-1 gap-1.5 text-xs"
                            onClick={async () => {
                              const r = await autoLinkApostila(editingApostila.id);
                              if (r.linked > 0) toast.success(`${r.linked} material(is) vinculado(s) automaticamente!`);
                              else toast.info('Nenhum material novo encontrado para vincular.');
                            }}
                          >
                            <Wand2 className="h-3.5 w-3.5" /> <span className="truncate">Auto-vincular materiais</span>
                          </Button>
                        )}
                      </div>

                    {editingApostila && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2"><PenLine className="h-4 w-4 text-primary" /> Exercícios ({exercises[editingApostila.id]?.length || 0})</h4>

                          {/* Existing exercises */}
                          {exercises[editingApostila.id]?.map((ex, i) => (
                            <div key={ex.id} className="border border-border/50 rounded-lg p-3 text-xs">
                              <div className="flex justify-between items-start">
                                <p className="font-medium">{i + 1}. {ex.question}</p>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteExercise(ex.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                              {Array.isArray(ex.options) && (ex.options as string[]).map((opt, oi) => (
                                <p key={oi} className={`text-[11px] mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : 'text-muted-foreground'}`}>
                                  {String.fromCharCode(65 + oi)}) {opt}
                                </p>
                              ))}
                            </div>
                          ))}

                          {/* Mode Toggle */}
                          <div className="inline-flex bg-muted rounded-full p-0.5 w-full">
                            {([['individual', 'Individual'], ['bulk', 'Lote'], ['ai', 'Assistente']] as const).map(([mode, label]) => (
                              <button key={mode} onClick={() => setEditExerciseMode(mode)}
                                className={`flex-1 text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors ${editExerciseMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Individual */}
                          {editExerciseMode === 'individual' && (
                            <div className="space-y-2">
                              <Textarea value={exQuestion} onChange={e => setExQuestion(e.target.value)} placeholder="Pergunta" rows={2} />
                              {exOptions.map((o, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-xs font-medium w-5">{String.fromCharCode(65 + i)})</span>
                                  <Input value={o} onChange={e => { const n = [...exOptions]; n[i] = e.target.value; setExOptions(n); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                                </div>
                              ))}
                              <Select value={exCorrect} onValueChange={setExCorrect}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                              </Select>
                              <Textarea value={exExplanation} onChange={e => setExExplanation(e.target.value)} placeholder="Explicação (opcional)" rows={2} />
                              <Button onClick={() => {
                                if (!exQuestion.trim() || !editingApostila) return;
                                supabase.from('exercises').insert({
                                  apostila_id: editingApostila.id, question: exQuestion, options: exOptions,
                                  correct_answer: exCorrect, explanation: exExplanation || null,
                                }).then(({ error }) => {
                                  if (error) { toast.error('Erro'); return; }
                                  toast.success('Exercício adicionado!');
                                  setExQuestion(''); setExOptions(['', '', '', '']); setExExplanation(''); loadAll();
                                });
                              }} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                            </div>
                          )}

                          {/* Bulk */}
                          {editExerciseMode === 'bulk' && (
                            <div className="space-y-2">
                              <Textarea value={editBulkText} onChange={e => setEditBulkText(e.target.value)}
                                placeholder="Cole exercícios: alternativas (A-D + Gabarito) ou dissertativas (Tipo: dissertativa + Resposta esperada)..." rows={8} className="font-mono text-xs" />
                              {editBulkText.trim() && (() => {
                                const p = parseBulkExercises(editBulkText);
                                const mc = p.filter(e => e.type === 'multiple_choice').length;
                                const essay = p.filter(e => e.type === 'essay').length;
                                return <p className="text-[10px] text-muted-foreground">{p.length} exercício(s) — {mc} alternativa(s), {essay} dissertativa(s)</p>;
                              })()}
                              <Button onClick={() => {
                                if (!editingApostila) return;
                                const parsed = parseBulkExercises(editBulkText);
                                if (parsed.length === 0) { toast.error('Nenhum exercício detectado.'); return; }
                                Promise.all(parsed.map(ex => supabase.from('exercises').insert({
                                  apostila_id: editingApostila.id, question: ex.question, options: ex.options,
                                  correct_answer: ex.correct, explanation: ex.explanation || null,
                                }))).then(results => {
                                  const ok = results.filter(r => !r.error).length;
                                  toast.success(`${ok}/${parsed.length} exercícios importados!`);
                                  setEditBulkText(''); loadAll();
                                });
                              }} disabled={!editBulkText.trim()} className="w-full gradient-primary text-primary-foreground">Importar Exercícios</Button>
                            </div>
                          )}

                          {/* AI */}
                          {editExerciseMode === 'ai' && (
                            <div className="space-y-2">
                              {!editContent?.trim() ? (
                                <div className="text-center py-4 text-muted-foreground">
                                  <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-30" />
                                  <p className="text-xs">Adicione conteúdo à apostila para gerar exercícios com IA.</p>
                                </div>
                              ) : editAiExercises.length === 0 ? (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-[10px]">Múltipla escolha</Label>
                                      <Select value={String(editAiMcCount)} onValueChange={v => setEditAiMcCount(+v)}>
                                        <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>{[0,2,4,5,6,8,10,12,15,18,20].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-[10px]">Dissertativas</Label>
                                      <Select value={String(editAiEssayCount)} onValueChange={v => setEditAiEssayCount(+v)}>
                                        <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>{[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">Total: {editAiMcCount + editAiEssayCount} exercícios</p>
                                  <Button onClick={async () => {
                                    if (editAiMcCount + editAiEssayCount < 1) { toast.error('Selecione pelo menos 1 exercício.'); return; }
                                    setAiGenerating(true);
                                    try {
                                      const { data, error } = await supabase.functions.invoke('generate-exercises', {
                                        body: { content: editContent, title: editTitle, mcCount: editAiMcCount, essayCount: editAiEssayCount },
                                      });
                                      if (error) {
                                        let msg = error.message;
                                        try { const ctx = await (error as any).context?.json?.(); if (ctx?.error) msg = ctx.error; } catch {}
                                        throw new Error(msg);
                                      }
                                      if (data?.error) throw new Error(data.error);
                                      if (!data?.exercises?.length) throw new Error('Nenhum exercício gerado.');
                                      setEditAiExercises(data.exercises);
                                      toast.success(`${data.exercises.length} exercícios gerados!`);
                                    } catch (err: any) { toast.error('Erro: ' + (err.message || 'Tente novamente')); }
                                    setAiGenerating(false);
                                  }} disabled={aiGenerating} className="w-full gradient-primary text-primary-foreground">
                                    {aiGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Gerando...</> : <><Wand2 className="h-4 w-4 mr-1.5" /> Gerar com IA</>}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {editAiExercises.map((ex, i) => (
                                      <div key={i} className="border border-border/50 rounded-lg p-3 text-xs">
                                        <div className="flex justify-between items-start">
                                          <p className="font-medium">
                                            {i + 1}. {ex.question}
                                            {ex.type === 'essay' && <Badge variant="outline" className="ml-2 text-[9px] py-0">Dissertativa</Badge>}
                                          </p>
                                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditAiExercises(prev => prev.filter((_, idx) => idx !== i))}>
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                          </Button>
                                        </div>
                                        {ex.type !== 'essay' && ex.options.length > 0 && ex.options.map((opt, oi) => (
                                          <p key={oi} className={`text-[11px] mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : 'text-muted-foreground'}`}>{String.fromCharCode(65 + oi)}) {opt}</p>
                                        ))}
                                        {ex.explanation && <p className="mt-1 text-[10px] text-muted-foreground italic">{ex.type === 'essay' ? 'Resposta modelo: ' : ''}{ex.explanation}</p>}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setEditAiExercises([])}>Descartar</Button>
                                    <Button className="flex-1 gradient-primary text-primary-foreground" onClick={async () => {
                                      if (!editingApostila) return;
                                      let ok = 0;
                                      for (const ex of editAiExercises) {
                                        const { error } = await supabase.from('exercises').insert({
                                          apostila_id: editingApostila.id, question: ex.question, options: ex.options,
                                          correct_answer: ex.correct_answer, explanation: ex.explanation || null,
                                        });
                                        if (!error) ok++;
                                      }
                                      toast.success(`${ok}/${editAiExercises.length} exercícios salvos!`);
                                      setEditAiExercises([]); loadAll();
                                    }}>Salvar Todos ({editAiExercises.length})</Button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    </div>
                    <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-border bg-muted/20 shrink-0 pb-[max(env(safe-area-inset-bottom),0.625rem)]">
                      <Button className="w-full gradient-primary text-primary-foreground" onClick={handleEditSave}>Salvar Apostila</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* EXERCISES */}
            {tab === 'exercises' && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-sm mb-3">Selecionar Apostila</h3>
                    <Select value={selectedApostila} onValueChange={setSelectedApostila}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma apostila" /></SelectTrigger>
                      <SelectContent>
                        {apostilas.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.title} ({exercises[a.id]?.length || 0})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {selectedApostila && (
                  <>
                    {(exercises[selectedApostila]?.length || 0) === 0 && !bulkExerciseMode && (
                      <div className="text-center py-10 text-muted-foreground">
                        <PenTool className="h-10 w-10 mx-auto mb-3 opacity-25" strokeWidth={1.5} />
                        <p className="text-sm">Nenhum exercício para esta apostila.</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Gere com IA ou importe em lote.</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {exercises[selectedApostila]?.map((ex, i) => (
                        <Card key={ex.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm flex-1">{i + 1}. {ex.question}</p>
                              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteExercise(ex.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                            {Array.isArray(ex.options) && (ex.options as string[]).map((opt, oi) => (
                              <p key={oi} className={`text-xs mt-0.5 ${String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : 'text-muted-foreground'}`}>
                                {String.fromCharCode(65 + oi)}) {opt}
                              </p>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Toggle between modes */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex bg-muted rounded-full p-0.5">
                        {([['individual', 'Individual'], ['bulk', 'Lote'], ['ai', 'Assistente']] as [string, string][]).map(([mode, label]) => (
                          <button key={mode} onClick={() => { setBulkExerciseMode(mode === 'bulk'); if (mode === 'ai') setBulkExerciseMode(false); setExerciseDialogMode(mode as any); }}
                            className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${
                              (mode === 'individual' && !bulkExerciseMode && exerciseDialogMode !== 'ai') ||
                              (mode === 'bulk' && bulkExerciseMode) ||
                              (mode === 'ai' && exerciseDialogMode === 'ai' && !bulkExerciseMode)
                                ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {bulkExerciseMode ? (
                      <Card>
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Importar Exercícios em Lote
                          </h3>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Cole as perguntas no formato abaixo. Separe cada exercício com uma linha em branco:
                          </p>
                          <div className="bg-muted/50 rounded-lg p-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
                            <p>Qual é a capital do Brasil?</p>
                            <p>A) São Paulo</p><p>B) Rio de Janeiro</p><p>C) Brasília</p><p>D) Salvador</p>
                            <p>Gabarito: C</p>
                            <p>Explicação: Brasília é a capital federal desde 1960.</p>
                          </div>
                          <Textarea value={bulkExerciseText} onChange={e => setBulkExerciseText(e.target.value)}
                            placeholder="Cole aqui suas perguntas, alternativas, gabarito e explicação..." rows={12} className="font-mono text-xs" />
                          {bulkExerciseText.trim() && (
                            <p className="text-[10px] text-muted-foreground">{parseBulkExercises(bulkExerciseText).length} exercício(s) detectado(s)</p>
                          )}
                          <Button onClick={handleBulkExerciseImport} disabled={!bulkExerciseText.trim() || bulkExerciseImporting} className="w-full gradient-primary text-primary-foreground">
                            {bulkExerciseImporting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Importando...</> : 'Importar Exercícios'}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : exerciseDialogMode === 'ai' ? (
                      <Card>
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <PenTool className="h-4 w-4 text-primary" /> Gerar com IA
                          </h3>
                          {(() => {
                            const apt = apostilas.find(a => a.id === selectedApostila);
                            if (!apt?.content?.trim()) return (
                              <div className="text-center py-6 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-xs">Esta apostila não tem conteúdo. Adicione conteúdo primeiro.</p>
                              </div>
                            );
                            if (aiExercises.length === 0) return (
                              <>
                                <p className="text-xs text-muted-foreground">A IA vai analisar o conteúdo e gerar exercícios automaticamente.</p>
                                <Button onClick={async () => {
                                  setAiGenerating(true);
                                  try {
                                    const { data, error } = await supabase.functions.invoke('generate-exercises', {
                                      body: { content: apt.content, title: apt.title, mcCount: 8, essayCount: 2 },
                                    });
                                    if (error) {
                                      let msg = error.message;
                                      try { const ctx = await (error as any).context?.json?.(); if (ctx?.error) msg = ctx.error; } catch {}
                                      throw new Error(msg);
                                    }
                                    if (data?.error) throw new Error(data.error);
                                    if (!data?.exercises?.length) throw new Error('Nenhum exercício gerado.');
                                    setAiExercises(data.exercises);
                                    toast.success(`${data.exercises.length} exercícios gerados!`);
                                  } catch (err: any) { toast.error('Erro: ' + (err.message || 'Tente novamente')); }
                                  setAiGenerating(false);
                                }} disabled={aiGenerating} className="w-full gradient-primary text-primary-foreground">
                                  {aiGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Gerando exercícios...</> : <><Wand2 className="h-4 w-4 mr-1.5" /> Gerar Exercícios com IA</>}
                                </Button>
                              </>
                            );
                            return (
                              <>
                                <p className="text-xs text-muted-foreground">{aiExercises.length} exercícios gerados. Revise e salve:</p>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                  {aiExercises.map((ex, i) => (
                                    <div key={i} className="border border-border/50 rounded-lg p-3 text-xs">
                                      <div className="flex justify-between items-start">
                                        <p className="font-medium">{i + 1}. {ex.question}</p>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setAiExercises(prev => prev.filter((_, idx) => idx !== i))}>
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                      <div className="mt-1 space-y-0.5 text-muted-foreground">
                                        {ex.options.map((opt, oi) => (
                                          <p key={oi} className={String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : ''}>{String.fromCharCode(65 + oi)}) {opt}</p>
                                        ))}
                                      </div>
                                      {ex.explanation && <p className="mt-1 text-[10px] text-muted-foreground italic">{ex.explanation}</p>}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" className="flex-1" onClick={() => setAiExercises([])}>Descartar</Button>
                                  <Button className="flex-1 gradient-primary text-primary-foreground" onClick={async () => {
                                    let ok = 0;
                                    for (const ex of aiExercises) {
                                      const { error } = await supabase.from('exercises').insert({
                                        apostila_id: selectedApostila, question: ex.question, options: ex.options,
                                        correct_answer: ex.correct_answer, explanation: ex.explanation || null,
                                      });
                                      if (!error) ok++;
                                    }
                                    toast.success(`${ok}/${aiExercises.length} exercícios salvos!`);
                                    setAiExercises([]); loadAll();
                                  }}>Salvar Todos ({aiExercises.length})</Button>
                                </div>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-sm">Novo Exercício</h3>
                          <Textarea value={exQuestion} onChange={e => setExQuestion(e.target.value)} placeholder="Pergunta" rows={2} />
                          {exOptions.map((o, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-6">{String.fromCharCode(65 + i)})</span>
                              <Input value={o} onChange={e => { const n = [...exOptions]; n[i] = e.target.value; setExOptions(n); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                            </div>
                          ))}
                          <div><Label className="text-xs">Resposta correta</Label>
                            <Select value={exCorrect} onValueChange={setExCorrect}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{['A','B','C','D'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Explicação (opcional)</Label><Textarea value={exExplanation} onChange={e => setExExplanation(e.target.value)} rows={2} /></div>
                          <Button onClick={addExercise} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* MATERIALS */}
            {tab === 'materials' && (
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
                              <CategorySelect value={matCategoryId} onValueChange={setMatCategoryId} placeholder="Categoria (opcional)" />
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
            )}

            {/* USERS */}
            {tab === 'users' && (
              <div className="space-y-6">
                {/* Cabeçalho com cadastro manual */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold">Alunos</h2>
                    <p className="text-[11px] text-muted-foreground">Cadastre, bloqueie ou ajuste o acesso das contas.</p>
                  </div>
                  <AdminCreateUserDialog onCreated={loadAll} />
                </div>

                {/* Stats */}
                <div className="grid gap-3 grid-cols-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{users.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-[hsl(var(--success))]">{users.filter(u => !u.is_blocked).length}</p>
                      <p className="text-xs text-muted-foreground">Ativos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-destructive">{users.filter(u => u.is_blocked).length}</p>
                      <p className="text-xs text-muted-foreground">Bloqueados</p>
                    </CardContent>
                  </Card>
                </div>

                {/* User List */}
                <div className="space-y-2">
                  {filteredUsers.map(u => {
                    const isTestBot = (u.full_name || '').toLowerCase().includes('[teste bot]') || (u.email || '').includes('teste.evasive');
                    const isRA = (u as any).account_type === 'ra' || (u.email || '').endsWith('@ra.unip.local');
                    return (
                    <Card key={u.id} className={`hover:shadow-md transition-shadow ${u.is_blocked ? 'border-destructive/30' : ''} ${isTestBot ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`rounded-full p-2.5 shrink-0 ${u.is_blocked ? 'bg-destructive/10' : isTestBot ? 'bg-amber-500/15' : 'bg-accent'}`}>
                              {u.is_blocked ? <ShieldBan className="h-5 w-5 text-destructive" /> : <ShieldCheck className={`h-5 w-5 ${isTestBot ? 'text-amber-500' : 'text-primary'}`} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <p className="text-sm font-medium break-words">{u.full_name || 'Sem nome'}</p>
                                {isTestBot && <Badge className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20">TESTE BOT</Badge>}
                                {u.is_blocked && <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>}
                                {isRA && <Badge variant="outline" className="text-[10px]">RA UNIP</Badge>}
                                {(u as any).content_scope === 'enem_only' && (
                                  <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">Apenas ENEM</Badge>
                                )}
                              </div>
                              <p className="text-xs text-foreground/80 break-all leading-snug font-mono">{u.email}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0 sm:ml-auto items-center justify-end flex-wrap">
                            {/* Escopo de conteúdo (ENEM/Completo) */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-9 gap-1.5"
                              onClick={async () => {
                                const current = (u as any).content_scope === 'enem_only' ? 'enem_only' : 'full';
                                const next = current === 'enem_only' ? 'full' : 'enem_only';
                                const { error } = await supabase.from('profiles').update({ content_scope: next } as any).eq('user_id', u.user_id);
                                if (error) { toast.error('Erro ao atualizar escopo'); return; }
                                toast.success(next === 'enem_only' ? 'Acesso restrito a ENEM' : 'Acesso completo liberado');
                                loadAll();
                              }}
                            >
                              {(u as any).content_scope === 'enem_only' ? 'Liberar tudo' : 'Restringir a ENEM'}
                            </Button>
                            {/* Primário: Bloquear/Desbloquear */}
                            <Button
                              size="sm"
                              variant={u.is_blocked ? 'outline' : 'destructive'}
                              className="text-xs h-9 gap-1.5"
                              onClick={async () => {
                                const newBlocked = !u.is_blocked;
                                const { error } = await supabase.from('profiles').update({ is_blocked: newBlocked } as any).eq('user_id', u.user_id);
                                if (error) { toast.error('Erro ao atualizar'); return; }
                                toast.success(newBlocked ? `${u.full_name} foi bloqueado` : `${u.full_name} foi desbloqueado`);
                                loadAll();
                              }}
                            >
                              {u.is_blocked ? <><ShieldCheck className="h-3.5 w-3.5" /> Desbloquear</> : <><ShieldBan className="h-3.5 w-3.5" /> Bloquear</>}
                            </Button>
                            {/* Redefinir senha (admin) */}
                            <AdminPasswordResetMenu user={u} />
                            {/* Secundário: Remover — botão direto no desktop */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="hidden sm:inline-flex text-xs h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" /> Remover
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover usuário permanentemente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação é <strong>irreversível</strong>. Todos os dados de <strong>{u.full_name || u.email}</strong> serão excluídos permanentemente: respostas, flashcards, anotações, progresso, XP e badges.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      const { error } = await supabase.rpc('delete_user_completely', { _target_user_id: u.user_id });
                                      if (error) {
                                        toast.error(`Erro ao remover: ${error.message}`);
                                        return;
                                      }
                                      toast.success(`${u.full_name || u.email} foi removido permanentemente`);
                                      setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
                                    }}
                                  >
                                    Sim, remover permanentemente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            {/* Kebab mobile: agrupa ação secundária Remover */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="sm:hidden h-9 w-9" aria-label="Mais opções">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={async (e) => {
                                    e.preventDefault();
                                    if (!confirm(`Remover ${u.full_name || u.email} permanentemente? Esta ação é irreversível.`)) return;
                                    const { error } = await supabase.rpc('delete_user_completely', { _target_user_id: u.user_id });
                                    if (error) { toast.error(`Erro ao remover: ${error.message}`); return; }
                                    toast.success(`${u.full_name || u.email} foi removido permanentemente`);
                                    setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover usuário
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{searchQuery ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ANNOUNCEMENTS */}
            {tab === 'announcements' && (
              <AnnouncementsAdmin />
            )}

            {/* CALENDAR */}
            {tab === 'calendar' && (
              <CalendarEventsAdmin />
            )}

            {/* TESTIMONIALS */}
            {tab === 'testimonials' && (
              <TestimonialsAdmin />
            )}

            {/* AI PROVIDER */}
            {tab === 'ai' && (
              <div className="space-y-6">
                <AIProviderSettings />
                <ShareLinkSettings />
                <CoverDesignEditor />
                <SplashDownloader />
              </div>
            )}

            {/* PERFORMANCE */}
            {tab === 'performance' && (
              <PerformanceMetrics />
            )}

            {/* SMOKE TESTS */}
            {tab === 'smoke' && (
              <SmokeTestsPanel />
            )}

            {/* DIAGNOSTICS */}
            {tab === 'diagnostics' && (
              <DiagnosticsPanel />
            )}

            {/* CHANGELOG */}
            {tab === 'changelog' && (
              <VersionHistoryPanel />
            )}

            {tab === 'ella-audit' && (
              <EllaAuditPanel />
            )}

            {tab === 'security-alerts' && (
              <SecurityAlertsPanel />
            )}

            {tab === 'leads' && <SponsorLeadsPanel />}
            {tab === 'sponsors' && <AdminSponsorsManager />}



            {/* ADS */}
            {tab === 'ads' && (
              <AdminAdsManager />
            )}
            {tab === 'ads-chat' && (
              <AdsChatBuilder />
            )}
            {tab === 'rss' && (
              <RssFeedsManagerEnhanced />
            )}

            {/* COURSES */}
            {tab === 'courses' && (
              <FreeCoursesManager />
            )}
            </div>
          </main>
        </div>
      </div>

      {/* Validação estrutural (H2/H3): avisa antes de salvar quando faltam seções/subtópicos */}
      <StructureValidationDialog
        open={!!validationReport}
        report={validationReport}
        apostilaTitle={validationContext?.title}
        onCancel={() => {
          setValidationReport(null);
          setValidationContext(null);
        }}
        onConfirm={async () => {
          const ctx = validationContext;
          setValidationReport(null);
          setValidationContext(null);
          if (ctx) await ctx.run();
        }}
      />

      {/* Diálogo de duplicata: detecta apostilas parecidas e mantém a melhor formatada */}
      <DuplicateApostilaDialog
        open={!!duplicateMatch}
        match={duplicateMatch}
        onReplaceExisting={async () => {
          // Substitui o conteúdo existente pelo novo (que está melhor formatado)
          const newContent = pendingSave ? (manualContent || importContent || importRawText) : '';
          await replaceExistingWithBetter(newContent || importContent || manualContent || importRawText);
          setDuplicateMatch(null);
          setPendingSave(null);
        }}
        onKeepExisting={() => {
          toast.info('Mantida a versão existente — a melhor formatada.');
          // Apenas limpa formulários
          resetImportForm();
          setManualTitle(''); setManualContent(''); setManualCategory(''); setShowManualForm(false);
          setDuplicateMatch(null);
          setPendingSave(null);
        }}
        onCreateAnyway={async () => {
          if (pendingSave) await pendingSave();
          setDuplicateMatch(null);
          setPendingSave(null);
        }}
        onCancel={() => {
          setDuplicateMatch(null);
          setPendingSave(null);
        }}
      />

      {/* Confirmação de exclusão de apostila */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir apostila?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a apostila, seus exercícios e os vínculos com materiais. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const id = confirmDeleteId;
                setConfirmDeleteId(null);
                if (id) await deleteApostila(id);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ApostilaExportDialog
        apostila={exportingApostila}
        open={!!exportingApostila}
        onOpenChange={(v) => { if (!v) setExportingApostila(null); }}
      />
    </CategoriesCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: redefinir senha de um usuário
// ─────────────────────────────────────────────────────────────────────────────
function AdminPasswordResetMenu({ user }: { user: { user_id: string; email: string; full_name: string } }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  const isRA = (user.email || '').endsWith('@ra.unip.local');

  const generateSuggested = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let p = '';
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPwd(p);
    setConfirmPwd(p);
    setShowPwd(true);
  };

  const handleSetPassword = async () => {
    if (pwd.length < 6) { toast.error('A senha deve ter no mínimo 6 caracteres'); return; }
    if (pwd !== confirmPwd) { toast.error('As senhas não coincidem'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-set-password', {
        body: { target_user_id: user.user_id, new_password: pwd },
      });
      if (error || (data as any)?.error) {
        toast.error(`Erro: ${(data as any)?.error || error?.message}`);
        return;
      }
      toast.success(`Senha de ${user.full_name || user.email} alterada`);
      setOpen(false);
      setPwd(''); setConfirmPwd(''); setShowPwd(false);
    } finally { setSaving(false); }
  };

  const handleSendResetLink = async () => {
    if (isRA) { toast.error('Contas RA UNIP não recebem e-mail. Defina a senha manualmente.'); return; }
    setSendingLink(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { toast.error(`Erro: ${error.message}`); return; }
      toast.success(`Link de redefinição enviado para ${user.email}`);
    } finally { setSendingLink(false); }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Senha
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[11px]">Redefinir senha</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
            <PenLine className="h-3.5 w-3.5 mr-2" /> Definir nova senha
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isRA || sendingLink}
            onSelect={(e) => { e.preventDefault(); void handleSendResetLink(); }}
          >
            {sendingLink ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5 mr-2" />}
            Enviar link por e-mail
          </DropdownMenuItem>
          {isRA && (
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
              Contas RA UNIP não recebem e-mail.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPwd(''); setConfirmPwd(''); setShowPwd(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir nova senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Usuário: <span className="font-medium text-foreground">{user.full_name || user.email}</span>
              <br />
              <span className="font-mono">{user.email}</span>
            </div>
            <div>
              <Label className="text-xs">Nova senha</Label>
              <div className="relative mt-1">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <Button
                  type="button" size="icon" variant="ghost"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Confirmar nova senha</Label>
              <Input
                type={showPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Repita a senha"
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={generateSuggested}>
                <PenTool className="h-3.5 w-3.5 mr-1.5" /> Gerar senha forte
              </Button>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleSetPassword} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                  Salvar nova senha
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Informe a nova senha ao usuário por um canal seguro. O acesso anterior continuará válido até o usuário sair em outros dispositivos.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
