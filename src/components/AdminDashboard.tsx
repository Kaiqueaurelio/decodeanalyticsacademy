import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import owlLogo from '@/assets/owl-icon.png';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookOpen, PenLine, Users, Megaphone, RefreshCw, Search, ChevronRight,
  Link as LinkIcon, FileText, FileUp, Plus, Activity,
  Eye, EyeOff, Edit, Trash2, Trophy, Medal, Award, Filter, X, Check,
  CheckCircle2, XCircle, CalendarDays, ArrowDownUp, FolderOpen, ChevronDown, LayoutDashboard,
  GraduationCap, AlertTriangle, Clock3, ShieldCheck, ExternalLink, History, Loader2, Sparkles, FileDown
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubjectColor } from '@/lib/subject-colors';
import { BY_SEMESTER, canonicalSubjectKey, subjectKey } from '@/lib/subject-semester-map';
import { ensureApostilaExists } from '@/lib/create-placeholder-apostila';
import { logMaintenance } from '@/lib/maintenance-logger';
import { AdminNotionGalleryCard } from './admin/AdminNotionGalleryCard';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";


interface Props { 
  onNavigate: (tab: string) => void; 
  isAdmin?: boolean;
  filterSemester?: string;
  setFilterSemester?: (s: string) => void;
}

type ApostilaRow = {
  id: string; title: string; category: string | null;
  published: boolean; created_at: string; updated_at: string;
  status?: 'liberada' | 'bloqueada' | 'em_manutencao';
  content?: string | null;
};

type Ranking = {
  user_id: string; full_name: string; ra: string | null;
  avatar_url: string | null; total: number; hits: number;
  errors: number; accuracy: number;
};

type SortKey = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc';

const PAGE_SIZE = 12;

export function AdminDashboard({ onNavigate, isAdmin: isAdminProp, filterSemester, setFilterSemester }: Props) {
  const { user, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = isAdminProp ?? authIsAdmin;
  const navigate = useNavigate();

  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('decode:admin-widgets');
    return saved ? JSON.parse(saved) : ['apostilas', 'exercises', 'users', 'ads'];
  });
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  useEffect(() => {
    localStorage.setItem('decode:admin-widgets', JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  const toggleWidget = (id: string) => {
    setVisibleWidgets(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    apostilas: 0, exercises: 0, users: 0, comments: 0, likes: 0, ads: 0,
  });
  const [apostilas, setApostilas] = useState<ApostilaRow[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [engagement, setEngagement] = useState<{ day: string; apostilas: number; exercises: number }[]>([]);


  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateUntil, setDateUntil] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_desc');

  // Paginação
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const adminLoaderRef = useRef<HTMLDivElement>(null);
  // Pasta aberta no grid por categoria
  const [openCategory, setOpenCategory] = useState<string | null>(null);



  // Seleção em lote
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Confirmações
  const [deleteTarget, setDeleteTarget] = useState<ApostilaRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkSemesterOpen, setBulkSemesterOpen] = useState(false);
  const [targetSemester, setTargetSemester] = useState<string>('1');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Detalhe do aluno
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [historyApostilaFilter, setHistoryApostilaFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'correct' | 'wrong'>('all');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 6 * 86400000);
      since.setHours(0, 0, 0, 0);
      const [a, e, u, c, l, ad, list, rank, views, answers] = await Promise.all([
        supabase.from('apostilas').select('id', { count: 'exact', head: true }),
        supabase.from('exercises').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_comments').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_likes').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('apostilas')
          .select('id,title,category,published,created_at,updated_at,semester,course,cover_url,teacher,content,status')
          .order('semester', { ascending: true }) // Ordenado por semestre primeiro
          .order('title', { ascending: true })

          .limit(1000), // Garantir que carregamos o suficiente para os Placeholders e Grid

        supabase.rpc('get_student_rankings', { _limit: 10 }),
        supabase.from('apostila_views').select('viewed_at').gte('viewed_at', since.toISOString()).limit(5000),
        supabase.from('answers').select('created_at').gte('created_at', since.toISOString()).limit(5000),
      ]);
      setStats({
        apostilas: a.count || 0,
        exercises: e.count || 0,
        users: u.count || 0,
        comments: c.count || 0,
        likes: l.count || 0,
        ads: ad.count || 0,
      });
      setApostilas(list.data || []);
      setRankings(rank.data || []);

      // Engajamento real dos últimos 7 dias
      const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const buckets: { key: string; day: string; apostilas: number; exercises: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        buckets.push({ key: d.toDateString(), day: DAYS[d.getDay()], apostilas: 0, exercises: 0 });
      }
      const idx = new Map(buckets.map((b, i) => [b.key, i]));
      (views.data || []).forEach((r: any) => {
        const i = idx.get(new Date(r.viewed_at).toDateString());
        if (i !== undefined) buckets[i].apostilas++;
      });
      (answers.data || []).forEach((r: any) => {
        const i = idx.get(new Date(r.created_at).toDateString());
        if (i !== undefined) buckets[i].exercises++;
      });
      setEngagement(buckets.map(({ day, apostilas, exercises }) => ({ day, apostilas, exercises })));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    apostilas.forEach((a) => a.category && set.add(a.category));
    return Array.from(set).sort();
  }, [apostilas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const untilTs = dateUntil ? new Date(dateUntil + 'T23:59:59').getTime() : null;

    let list = apostilas.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !(a.category || '').toLowerCase().includes(q)) return false;
      if (statusFilter === 'published' && !a.published) return false;
      if (statusFilter === 'draft' && a.published) return false;
      
      const isEnem = (a.category || '').toUpperCase().includes('ENEM');
      
      // Detecção de aba para separação ENEM vs Faculdade
      const searchParams = new URLSearchParams(window.location.search);
      const activeTab = searchParams.get('tab');
      
      if (activeTab === 'cc-apostilas' && isEnem) return false;
      if (activeTab === 'enem-apostilas' && !isEnem) return false;

      if (categoryFilter === '__uncategorized' && a.category?.trim()) return false;
      if (categoryFilter !== 'all' && categoryFilter !== '__uncategorized' && a.category !== categoryFilter) return false;
      
      // Filtro de semestre integrado
      if (filterSemester && filterSemester !== 'all') {
        const rowSemester = (a as any).semester;
        if (rowSemester !== undefined && rowSemester !== null) {
           if (rowSemester.toString() !== filterSemester) return false;
        } else if (filterSemester !== '0' && filterSemester !== 'none') {
           return false;
        }
      }

      const ts = new Date(a.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (untilTs && ts > untilTs) return false;
      return true;
    });

    const unique = new Map<string, ApostilaRow>();
    for (const apostila of list) {
      const key = `${subjectKey(apostila.title)}::${canonicalSubjectKey(apostila.category)}`;
      const current = unique.get(key);
      if (!current || (apostila.content || '').length > (current.content || '').length) unique.set(key, apostila);
    }
    list = [...unique.values()];

    const searchParams = new URLSearchParams(window.location.search);
    const activeTab = searchParams.get('tab');
    const isCcTab = activeTab === 'cc-apostilas';

    // Placeholders para o Admin Dashboard
    if (isCcTab && !q) {
      const activeSemNum = filterSemester && filterSemester !== 'all' && filterSemester !== 'none' ? parseInt(filterSemester, 10) : null;
      
      // Se tiver semestre selecionado, mostra placeholders apenas desse semestre
      // Se não tiver, mostra de TODOS os semestres para garantir visibilidade da grade
      const semestersToDisplay = activeSemNum !== null ? [activeSemNum] : [1, 2, 3, 4, 5, 6, 7, 8];
      
      const existingCategoriesKeys = new Set(list.map(a => subjectKey(a.category || '')));
      let allPlaceholders: any[] = [];

      semestersToDisplay.forEach(semNum => {
        const canonicalSubjects = BY_SEMESTER[semNum] || [];
        const placeholders = canonicalSubjects
          .filter((subject: string) => !existingCategoriesKeys.has(subjectKey(subject)))
          .map((subject: string, idx: number) => ({
            id: `placeholder-admin-dash-${semNum}-${idx}`,
            title: `[GRADE] ${subject}`,
            category: subject,
            semester: semNum,
            published: false,
            created_at: new Date(2000, 0, 1).toISOString(), // Antigo para ficar no fim se ordenado por desc
            updated_at: new Date(2000, 0, 1).toISOString(),
            isPlaceholder: true
          }));
        allPlaceholders = [...allPlaceholders, ...placeholders];
      });
        
      list = [...list, ...allPlaceholders] as any[];
    }

    const sorted = [...list].sort((x, y) => {
      switch (sortKey) {
        case 'created_asc': return new Date(x.created_at).getTime() - new Date(y.created_at).getTime();
        case 'updated_desc': return new Date(y.updated_at).getTime() - new Date(x.updated_at).getTime();
        case 'updated_asc': return new Date(x.updated_at).getTime() - new Date(y.updated_at).getTime();
        default: return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
      }
    });
    return sorted;
  }, [apostilas, search, statusFilter, categoryFilter, dateFrom, dateUntil, sortKey]);

  // Reset paginação quando filtros mudam
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, statusFilter, categoryFilter, dateFrom, dateUntil, sortKey]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // A listagem principal representa disciplinas, e não uma sequência confusa de
  // apostilas. A apostila só é exibida depois que o administrador abre a pasta.
  const folders = useMemo(() => {
    const grouped = new Map<string, ApostilaRow[]>();
    for (const apostila of filtered) {
      const name = apostila.category?.trim() || 'Sem disciplina';
      const items = grouped.get(name) || [];
      items.push(apostila);
      grouped.set(name, items);
    }
    return [...grouped.entries()]
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
        semester: (items[0] as any)?.semester as number | null | undefined,
      }))
      .sort((a, b) => (a.semester || 99) - (b.semester || 99) || a.name.localeCompare(b.name, 'pt-BR'));
  }, [filtered]);

  const openedFolder = folders.find((folder) => folder.name === openCategory) || null;

  // Rolagem infinita no acervo administrativo
  useEffect(() => {
    if (!hasMore) return;
    const el = adminLoaderRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let done = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (done) return;
        if (entries[0]?.isIntersecting) {
          done = true;
          // Use requestIdleCallback or setTimeout to avoid layout thrashing during scroll
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => setVisibleCount((c) => c + PAGE_SIZE));
          } else {
            setTimeout(() => setVisibleCount((c) => c + PAGE_SIZE), 1);
          }
        }
      },
      { root: null, rootMargin: '800px 0px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);



  // Sincroniza seleção quando a lista filtrada muda (remove ids fora)
  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(filtered.map((a) => a.id));
      const next = new Set<string>();
      prev.forEach((id) => { if (valid.has(id)) next.add(id); });
      return next;
    });
  }, [filtered]);

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((i) => selected.has(i.id));
  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleItems.forEach((i) => next.delete(i.id));
      else visibleItems.forEach((i) => next.add(i.id));
      return next;
    });
  };
  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const handleQuickCreate = (kind: 'link' | 'pdf' | 'text') => {
    sessionStorage.setItem('admin.quickCreate', kind);
    onNavigate('apostilas');
  };

  const handleTogglePublish = async (a: ApostilaRow) => {
    setBusyId(a.id);
    const nextPublished = !a.published;
    const nextStatus = nextPublished ? 'liberada' : 'bloqueada';
    
    const { error } = await supabase
      .from('apostilas')
      .update({ published: nextPublished, status: nextStatus })
      .eq('id', a.id);
      
    setBusyId(null);
    if (error) { toast.error('Erro: ' + error.message); return; }
    
    setApostilas((prev) => prev.map((x) => x.id === a.id ? { ...x, published: nextPublished, status: nextStatus } : x));
    
    logMaintenance(
      a.id, 
      nextPublished ? 'publish' : 'unpublish', 
      `Status alterado para ${nextStatus}`
    );
    
    toast.success(nextPublished ? 'Publicada' : 'Despublicada');
  };
  
  const handleStatusChange = async (a: ApostilaRow, status: 'liberada' | 'bloqueada' | 'em_manutencao') => {
    setBusyId(a.id);
    const isPublished = status === 'liberada';
    
    const { error } = await supabase
      .from('apostilas')
      .update({ status, published: isPublished })
      .eq('id', a.id);
      
    setBusyId(null);
    if (error) { toast.error('Erro: ' + error.message); return; }
    
    setApostilas((prev) => prev.map((x) => x.id === a.id ? { ...x, status, published: isPublished } : x));
    
    logMaintenance(
      a.id, 
      'update_status', 
      `Status alterado para ${status}`
    );
    
    toast.success(`Status da apostila alterado para ${status.replace('_', ' ')}`);
  };

  const handleEdit = async (a: ApostilaRow) => {
    if ((a as any).isPlaceholder || a.id.startsWith('placeholder')) {
      try {
        setBusyId(a.id);
        const realId = await ensureApostilaExists(a as any);
        setBusyId(null);
        toast.success(`Apostila "${a.title.replace(/^\[GRADE\]\s*/i, '')}" iniciada!`);
        navigate(`/admin/apostilas/${realId}`);
      } catch (err: any) {
        setBusyId(null);
        toast.error('Erro ao iniciar apostila: ' + (err?.message || 'Tente novamente.'));
      }
    } else {
      navigate(`/admin/apostilas/${a.id}`);
    }
  };


  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    const { error } = await supabase.from('apostilas').delete().eq('id', deleteTarget.id);
    setBusyId(null);
    if (error) { toast.error('Erro: ' + error.message); return; }
    setApostilas((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast.success('Apostila excluída');
    setDeleteTarget(null);
  };

  // Ações em lote
  const bulkSetPublished = async (publish: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error } = await supabase.from('apostilas').update({ published: publish }).in('id', ids);
    setBulkBusy(false);
    if (error) { toast.error('Erro: ' + error.message); return; }
    setApostilas((prev) => prev.map((x) => selected.has(x.id) ? { ...x, published: publish } : x));
    toast.success(`${ids.length} apostila(s) ${publish ? 'publicadas' : 'despublicadas'}`);
    clearSelection();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error } = await supabase.from('apostilas').delete().in('id', ids);
    setBulkBusy(false);
    if (error) { toast.error('Erro: ' + error.message); return; }
    setApostilas((prev) => prev.filter((x) => !selected.has(x.id)));
    toast.success(`${ids.length} apostila(s) excluídas`);
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const bulkMoveSemester = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const sem = parseInt(targetSemester, 10);
    if (isNaN(sem)) return;

    setBulkBusy(true);
    const { error } = await supabase.from('apostilas').update({ semester: sem }).in('id', ids);
    setBulkBusy(false);

    if (error) { toast.error('Erro: ' + error.message); return; }
    setApostilas((prev) => prev.map((x) => selected.has(x.id) ? { ...x, semester: sem } : x));
    toast.success(`${ids.length} apostila(s) movidas para o ${sem}º semestre`);
    clearSelection();
    setBulkSemesterOpen(false);
  };

  // Detalhe do aluno
  const openStudent = async (r: Ranking) => {
    setStudentLoading(true);
    setStudentDetail({ loading: true, ranking: r });
    setHistoryApostilaFilter('all');
    setHistoryStatusFilter('all');
    setHistoryPage(1);
    const { data, error } = await supabase.rpc('get_student_detail', { _user_id: r.user_id });
    setStudentLoading(false);
    if (error) { toast.error('Erro: ' + error.message); setStudentDetail(null); return; }
    setStudentDetail({ ...data, ranking: r });
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setCategoryFilter('all');
    setDateFrom(''); setDateUntil(''); setSortKey('created_desc');
  };

  const handleExportAcervo = () => {
    if (filtered.length === 0) {
      toast.error('Nenhum dado para exportar.');
      return;
    }

    const headers = ['ID', 'Título', 'Categoria', 'Semestre', 'Status', 'Criado em', 'Atualizado em', 'Professor'];
    const rows = filtered.map(a => [
      a.id,
      a.title,
      a.category || '',
      (a as any).semester || '',
      a.published ? 'Ativo' : 'Rascunho',
      new Date(a.created_at).toLocaleDateString(),
      new Date(a.updated_at).toLocaleDateString(),
      (a as any).teacher || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `acervo-decode-academy-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Acervo exportado com sucesso (CSV).');
  };
  const hasFilters = !!search || statusFilter !== 'all' || categoryFilter !== 'all'
    || !!dateFrom || !!dateUntil || sortKey !== 'created_desc';

  const cards = [
    { label: 'Apostilas', value: stats.apostilas, icon: BookOpen, tone: 'primary' as const, tab: 'apostilas' },
    { label: 'Exercícios', value: stats.exercises, icon: PenLine, tone: 'accent' as const, tab: 'exercises' },
    { label: 'Usuários', value: stats.users, icon: Users, tone: 'primary' as const, tab: 'users' },
    { label: 'Anúncios', value: stats.ads, icon: Megaphone, tone: 'accent' as const, tab: 'ads' },
  ];


  const totalEngagement = engagement.reduce((s, d) => s + d.apostilas + d.exercises, 0);
  const contentHealth = useMemo(() => {
    const now = Date.now();
    const drafts = apostilas.filter((item) => !item.published);
    const staleDrafts = drafts.filter((item) => {
      const updatedAt = new Date(item.updated_at || item.created_at).getTime();
      return Number.isFinite(updatedAt) && now - updatedAt > 30 * 86400000;
    });
    const withoutCategory = apostilas.filter((item) => !item.category?.trim());
    const healthy = Math.max(0, apostilas.length - drafts.length - withoutCategory.length);
    const score = apostilas.length > 0 ? Math.round((healthy / apostilas.length) * 100) : 100;
    return { drafts, staleDrafts, withoutCategory, score };
  }, [apostilas]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Cabeçalho da Central Operacional - Design Refinado e Hierárquico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
            <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent uppercase">
              Central de Comando
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Gestão estratégica de conteúdos, alunos e métricas da <span className="text-primary font-bold">DECODE ACADEMY</span>.
            Monitore o pulso da plataforma em tempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all duration-300"
            onClick={load}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Sincronizar Dados
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-muted"
            onClick={() => setShowWidgetConfig(true)}
          >
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Grid de Métricas Principais - Mais Limpo e Profissional */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -4 }}
            className="group cursor-pointer"
            onClick={() => onNavigate(card.tab)}
          >
            <Card className="relative overflow-hidden border-primary/10 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-500">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <card.icon className="h-12 w-12" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    card.tone === 'primary' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  )}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{card.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold tracking-tighter">
                    {card.value}
                  </div>
                  <div className="text-[10px] font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    GERENCIAR <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Saúde e Integridade - NOVA SEÇÃO SOLICITADA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/10 bg-card/20 backdrop-blur-md overflow-hidden h-full">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Saúde das Apostilas
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {contentHealth.score}% OK
                </Badge>
              </div>
              <CardDescription>Auditoria automática de renderização</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                  {/* Status Geral */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Integridade Visual</span>
                      <span className="font-mono text-emerald-500">STATUS: NOMINAL</span>
                    </div>
                    <Progress value={contentHealth.score} className="h-2" />
                  </div>

                  {/* Lista de Alertas */}
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Alertas Críticos</h4>
                    
                    {contentHealth.withoutCategory.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <div className="text-sm">
                            <p className="font-medium">{contentHealth.withoutCategory.length} Sem Categoria</p>
                            <p className="text-[10px] text-muted-foreground">Afeta a organização por pastas</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {contentHealth.staleDrafts.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <Clock3 className="h-4 w-4 text-primary" />
                          <div className="text-sm">
                            <p className="font-medium">{contentHealth.staleDrafts.length} Rascunhos Antigos</p>
                            <p className="text-[10px] text-muted-foreground">Inativos há mais de 30 dias</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {apostilas.filter(a => !a.title || a.title.includes('Sem título')).length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <div className="text-sm">
                            <p className="font-medium">Títulos Ausentes</p>
                            <p className="text-[10px] text-muted-foreground">Identificadas apostilas sem nome</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {contentHealth.score === 100 && (
                      <div className="py-12 text-center space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Tudo certo! Nenhuma inconsistência encontrada.</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/5 bg-white/5">
                <Button variant="outline" className="w-full text-xs gap-2 rounded-xl" onClick={() => onNavigate('apostilas')}>
                  Gerenciar Acervo Acadêmico
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acervo Administrativo e Ranking */}
        <div className="lg:col-span-2 space-y-8">
          {/* Aba de Comando Rápido */}
          <Card className="border-primary/10 bg-card/20 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-xl font-bold tracking-tight">
                  Gerenciar Apostilas
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground/60 flex items-center gap-2">
                  {filtered.length} apostilas cadastradas · v4.1.0
                </CardDescription>
              </div>
                <div className="flex items-center gap-2">
                  {/* Espaço para o buscador se for movido para o header no futuro */}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Barra de Busca e Ações */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Filtrar por título, categoria ou professor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 rounded-xl focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportAcervo} className="rounded-xl gap-2 border-primary/20">
                    <FileDown className="h-4 w-4" /> Exportar
                  </Button>
                  <Button onClick={() => handleQuickCreate('text')} className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                    <Plus className="h-4 w-4" /> Novo Conteúdo
                  </Button>
                  {selected.size > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                        onClick={() => bulkSetPublished(true)}
                        disabled={bulkBusy}
                      >
                        <Eye className="h-4 w-4" /> Ativar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                        onClick={() => bulkSetPublished(false)}
                        disabled={bulkBusy}
                      >
                        <EyeOff className="h-4 w-4" /> Ocultar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2"
                        onClick={() => setBulkSemesterOpen(true)}
                        disabled={bulkBusy}
                      >
                        <CalendarDays className="h-4 w-4" /> Mover
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setBulkDeleteOpen(true)} 
                        className="rounded-xl gap-2"
                        disabled={bulkBusy}
                      >
                        <Trash2 className="h-4 w-4" /> Excluir ({selected.size})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSelectAllVisible}
                  className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider"
                >
                  {allVisibleSelected ? 'Desmarcar Tudo' : 'Selecionar Visíveis'}
                </Button>

                {(new URLSearchParams(window.location.search).get('tab') === 'cc-apostilas' || new URLSearchParams(window.location.search).get('tab') === 'overview') && (
                  <Select 
                    value={filterSemester || 'all'} 
                    onValueChange={(v) => setFilterSemester?.(v)}
                  >
                    <SelectTrigger className="w-[140px] h-9 bg-white/5 border-white/10 rounded-xl text-xs font-medium">
                      <GraduationCap className="h-3 w-3 mr-2 text-primary" />
                      <SelectValue placeholder="Semestre" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/90 backdrop-blur-xl border-white/10 rounded-xl">
                      <SelectItem value="all">Grade Completa</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <SelectItem key={s} value={s.toString()}>{s}º Semestre</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-white/5 border-white/10 rounded-xl text-xs">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/90 backdrop-blur-xl border-white/10 rounded-xl">
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter as any}>
                  <SelectTrigger className="w-[140px] h-9 bg-white/5 border-white/10 rounded-xl text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/90 backdrop-blur-xl border-white/10 rounded-xl">
                    <SelectItem value="all">Qualquer Status</SelectItem>
                    <SelectItem value="published">Publicadas</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortKey} onValueChange={setSortKey as any}>
                  <SelectTrigger className="w-[160px] h-9 bg-white/5 border-white/10 rounded-xl text-xs">
                    <SelectValue placeholder="Ordenação" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/90 backdrop-blur-xl border-white/10 rounded-xl">
                    <SelectItem value="created_desc">Mais Recentes</SelectItem>
                    <SelectItem value="created_asc">Mais Antigas</SelectItem>
                    <SelectItem value="updated_desc">Atualizadas Recente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fluxo simples: disciplina (pasta) primeiro, apostila depois. */}
              {openedFolder ? (
                <section className="rounded-2xl border border-primary/30 bg-card/70 p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><FolderOpen className="h-5 w-5" /></div>
                      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Caderno da matéria</p><h3 className="truncate text-base font-bold">{openedFolder.name}</h3></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setOpenCategory(null)}>Voltar às matérias</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {openedFolder.items.map((a) => {
                      const placeholder = (a as any).isPlaceholder || a.id.startsWith('placeholder');
                      return <button key={a.id} type="button" onClick={() => handleEdit(a)} className="group min-h-40 rounded-xl border border-border/70 bg-muted/20 p-4 text-left transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <div className="flex items-start justify-between gap-2"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><Badge variant={a.published ? 'default' : 'secondary'} className="text-[10px]">{placeholder ? 'Criar' : a.published ? 'Publicada' : 'Oculta'}</Badge></div>
                        <h4 className="mt-7 line-clamp-2 text-sm font-semibold group-hover:text-primary">{a.title.replace(/^\[GRADE\]\s*/i, '')}</h4>
                        <p className="mt-2 text-[11px] text-muted-foreground">{placeholder ? 'Clique para começar o material' : 'Clique para abrir e editar'}</p>
                      </button>;
                    })}
                  </div>
                </section>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {folders.map((folder) => {
                    const published = folder.items.filter((item) => item.published).length;
                    return <button key={folder.name} type="button" onClick={() => setOpenCategory(folder.name)} className="group flex min-h-28 items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4 text-left transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><FolderOpen className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{folder.name}</span><Badge variant="secondary" className="text-[9px]">{folder.items.length} {folder.items.length === 1 ? 'apostila' : 'apostilas'}</Badge></span><span className="mt-1 block text-[11px] text-muted-foreground">{published} publicada{published === 1 ? '' : 's'}{folder.semester ? ` · ${folder.semester}º semestre` : ''}</span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>;
                  })}
                </div>
              )}

              {/* Mantido temporariamente no DOM para preservar ações em lote, mas não exibido. */}
              <div className="hidden">
                {visibleItems.map((a) => (
                  <AdminNotionGalleryCard
                    key={a.id}
                    item={a}
                    selected={selected.has(a.id)}
                    onSelect={toggleSelectOne}
                    onEdit={handleEdit}
                    onDelete={(item) => setDeleteTarget(item)}
                    onStatusChange={handleStatusChange}
                    busyId={busyId}
                  />
                ))}
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogos e Modais Administrativos */}
      <Dialog open={showWidgetConfig} onOpenChange={setShowWidgetConfig}>
        <DialogContent className="bg-popover/90 backdrop-blur-2xl border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Personalizar Central Operacional</DialogTitle>
            <DialogDescription>Escolha quais painéis e métricas deseja manter visíveis.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {['apostilas', 'exercises', 'users', 'ads', 'rankings', 'engagement'].map((id) => (
              <div key={id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-sm font-medium capitalize">{id.replace('apostilas', 'Contéudos').replace('exercises', 'Exercícios').replace('users', 'Alunos').replace('ads', 'Publicidade')}</span>
                <Switch 
                  checked={visibleWidgets.includes(id)} 
                  onCheckedChange={() => toggleWidget(id)} 
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Seção de Gráficos e Ranking unificada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        <Card className="lg:col-span-2 border-primary/10 bg-card/20 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Engajamento Semanal</CardTitle>
              <CardDescription>Atividade real de leitura e exercícios</CardDescription>
            </div>
            <Badge variant="outline">{totalEngagement} Interações</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagement}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="day" strokeOpacity={0.5} fontSize={12} />
                <YAxis strokeOpacity={0.5} fontSize={12} />
                <Tooltip 
                  cursor={{fill: 'rgba(var(--primary-rgb), 0.05)'}}
                  contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))'}}
                />
                <Bar dataKey="apostilas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exercises" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-card/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] px-4">
              <div className="space-y-2 pb-4">
                {rankings.map((r, idx) => (
                  <div key={r.user_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer" onClick={() => openStudent(r)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}º</span>
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                        {r.avatar_url ? <img src={r.avatar_url} className="h-full w-full rounded-full object-cover" /> : r.full_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold line-clamp-1">{r.full_name}</p>
                        <p className="text-muted-foreground">{r.hits} acertos</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">{r.accuracy}%</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>



      {/* Confirm individual delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2rem] border-primary/20 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Excluir Apostila?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Esta ação não pode ser desfeita. O material "<strong>{deleteTarget?.title}</strong>" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black"
            >
              {busyId === deleteTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="bg-popover/90 backdrop-blur-2xl border-white/10 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Excluir em Lote</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Você está prestes a excluir permanentemente {selected.size} apostila(s). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={bulkBusy} className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              disabled={bulkBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-black"
            >
              {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de detalhe do aluno */}
      <Dialog open={!!studentDetail} onOpenChange={(o) => !o && setStudentDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {studentDetail?.ranking?.avatar_url
                  ? <img src={studentDetail.ranking.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (studentDetail?.ranking?.full_name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div>{studentDetail?.ranking?.full_name || 'Aluno'}</div>
                {studentDetail?.ranking?.ra && (
                  <DialogDescription className="text-xs">RA {studentDetail.ranking.ra}</DialogDescription>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {studentLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : studentDetail && !studentDetail.loading ? (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-5 pb-4">
                {/* Totais */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Acertos</p>
                    <p className="text-2xl font-bold text-emerald-600">{studentDetail.hits ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Erros</p>
                    <p className="text-2xl font-bold text-rose-600">{studentDetail.errors ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Precisão</p>
                    <p className="text-2xl font-bold text-primary">{studentDetail.accuracy ?? 0}%</p>
                  </div>
                </div>

                {/* Progresso por apostila */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Desempenho por apostila
                  </h3>
                  {(studentDetail.by_apostila || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">Sem dados ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {studentDetail.by_apostila.map((b: any) => (
                        <div key={b.apostila_id} className="rounded-lg border border-border/50 p-3">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-sm font-medium truncate">{b.title || 'Apostila'}</p>
                            <Badge variant="outline" className="rounded-full text-xs shrink-0">
                              {b.accuracy}%
                            </Badge>
                          </div>
                          <Progress value={b.accuracy} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1.5">
                            <span className="text-emerald-600">{b.hits} acertos</span> ·{' '}
                            <span className="text-rose-600">{b.errors} erros</span> · total {b.total}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Histórico de tentativas */}
                {(() => {
                  const allHistory: any[] = studentDetail.history || [];
                  const apostilaOptions = Array.from(
                    new Map(
                      allHistory
                        .filter((h) => h.apostila_title)
                        .map((h) => [h.apostila_title, h.apostila_title])
                    ).values()
                  );
                  const filtered = allHistory.filter((h) => {
                    if (historyApostilaFilter !== 'all' && h.apostila_title !== historyApostilaFilter) return false;
                    if (historyStatusFilter === 'correct' && !h.is_correct) return false;
                    if (historyStatusFilter === 'wrong' && h.is_correct) return false;
                    return true;
                  });
                  const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE));
                  const page = Math.min(historyPage, totalPages);
                  const pageItems = filtered.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Filter className="h-4 w-4" /> Histórico de tentativas
                          <span className="text-xs font-normal text-muted-foreground">({filtered.length})</span>
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <Select
                            value={historyApostilaFilter}
                            onValueChange={(v) => { setHistoryApostilaFilter(v); setHistoryPage(1); }}
                          >
                            <SelectTrigger className="h-8 text-xs w-[180px]">
                              <SelectValue placeholder="Apostila" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas apostilas</SelectItem>
                              {apostilaOptions.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={historyStatusFilter}
                            onValueChange={(v: any) => { setHistoryStatusFilter(v); setHistoryPage(1); }}
                          >
                            <SelectTrigger className="h-8 text-xs w-[140px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="correct">Acertos</SelectItem>
                              <SelectItem value="wrong">Erros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">Nenhuma tentativa para os filtros.</p>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            {pageItems.map((h: any) => (
                              <div
                                key={h.id}
                                className={`flex items-start gap-2 rounded-lg p-2.5 border text-xs ${
                                  h.is_correct
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : 'border-rose-500/30 bg-rose-500/5'
                                }`}
                              >
                                {h.is_correct
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                  : <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-foreground line-clamp-2">{h.question}</p>
                                  <p className="text-muted-foreground mt-0.5">
                                    {h.apostila_title || '—'} · {new Date(h.created_at).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-3 text-xs">
                              <span className="text-muted-foreground">
                                Página {page} de {totalPages}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm" variant="outline" className="h-7 px-2"
                                  disabled={page <= 1}
                                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                >Anterior</Button>
                                <Button
                                  size="sm" variant="outline" className="h-7 px-2"
                                  disabled={page >= totalPages}
                                  onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                                >Próxima</Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>


      <Dialog open={bulkSemesterOpen} onOpenChange={setBulkSemesterOpen}>
        <DialogContent className="bg-popover/90 backdrop-blur-2xl border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mover em Lote</DialogTitle>
            <DialogDescription>
              Selecione o semestre de destino para as {selected.size} apostilas selecionadas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Semestre de Destino</label>
              <Select value={targetSemester} onValueChange={setTargetSemester}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue placeholder="Escolha o semestre" />
                </SelectTrigger>
                <SelectContent className="bg-popover/90 backdrop-blur-xl border-white/10 rounded-xl">
                  {[0,1,2,3,4,5,6,7,8].map(s => (
                    <SelectItem key={s} value={s.toString()}>{s === 0 ? 'Bônus / ENEM' : `${s}º Semestre`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold" 
              onClick={bulkMoveSemester}
              disabled={bulkBusy}
            >
              {bulkBusy ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Confirmar Movimentação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


