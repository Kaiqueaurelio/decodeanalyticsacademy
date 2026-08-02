import React, { useState, useEffect, useMemo } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
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
  BookOpen, PenLine, Users, Megaphone, RefreshCw, Search, ChevronRight, Wand2,
  GraduationCap, Bell, Link as LinkIcon, FileText, FileUp,
  Eye, EyeOff, Edit, Trash2, Trophy, Medal, Award, Filter, X, Check,
  CheckCircle2, XCircle, CalendarDays, ArrowDownUp, FolderOpen, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubjectColor } from '@/lib/subject-colors';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface Props { onNavigate: (tab: string) => void }

type ApostilaRow = {
  id: string; title: string; category: string | null;
  published: boolean; created_at: string; updated_at: string;
};

type Ranking = {
  user_id: string; full_name: string; ra: string | null;
  avatar_url: string | null; total: number; hits: number;
  errors: number; accuracy: number;
};

type SortKey = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc';

const PAGE_SIZE = 12;

export function AdminDashboard({ onNavigate }: Props) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    apostilas: 0, exercises: 0, users: 0, comments: 0, likes: 0, ads: 0,
  });
  const [apostilas, setApostilas] = useState<ApostilaRow[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateUntil, setDateUntil] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_desc');

  // Paginação
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Pasta aberta no grid por categoria
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Seleção em lote
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Confirmações
  const [deleteTarget, setDeleteTarget] = useState<ApostilaRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
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
      const [a, e, u, c, l, ad, list, rank] = await Promise.all([
        supabase.from('apostilas').select('id', { count: 'exact', head: true }),
        supabase.from('exercises').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_comments').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_likes').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('apostilas')
          .select('id,title,category,published,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.rpc('get_student_rankings', { _limit: 10 }),
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

    const list = apostilas.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q)) return false;
      if (statusFilter === 'published' && !a.published) return false;
      if (statusFilter === 'draft' && a.published) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      const ts = new Date(a.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (untilTs && ts > untilTs) return false;
      return true;
    });

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

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

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
    const { error } = await supabase
      .from('apostilas')
      .update({ published: !a.published })
      .eq('id', a.id);
    setBusyId(null);
    if (error) { toast.error('Erro: ' + error.message); return; }
    setApostilas((prev) => prev.map((x) => x.id === a.id ? { ...x, published: !x.published } : x));
    toast.success(a.published ? 'Despublicada' : 'Publicada');
  };

  const handleEdit = (a: ApostilaRow) => navigate(`/admin/apostilas/${a.id}`);

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
  const hasFilters = !!search || statusFilter !== 'all' || categoryFilter !== 'all'
    || !!dateFrom || !!dateUntil || sortKey !== 'created_desc';

  const cards = [
    { label: 'Apostilas', value: stats.apostilas, icon: BookOpen, tone: 'primary' as const, tab: 'apostilas' },
    { label: 'Exercícios', value: stats.exercises, icon: PenLine, tone: 'accent' as const, tab: 'exercises' },
    { label: 'Usuários', value: stats.users, icon: Users, tone: 'primary' as const, tab: 'users' },
    { label: 'Anúncios', value: stats.ads, icon: Megaphone, tone: 'accent' as const, tab: 'ads' },
  ];


  const engagement = [
    { day: 'Seg', apostilas: 12, exercises: 24 },
    { day: 'Ter', apostilas: 18, exercises: 32 },
    { day: 'Qua', apostilas: 22, exercises: 28 },
    { day: 'Qui', apostilas: 28, exercises: 42 },
    { day: 'Sex', apostilas: 32, exercises: 50 },
    { day: 'Sab', apostilas: 26, exercises: 38 },
    { day: 'Dom', apostilas: 20, exercises: 30 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de comando — identidade Decode */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-5 sm:p-7"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            background:
              'radial-gradient(680px 300px at 8% -20%, hsl(var(--primary)), transparent 62%), radial-gradient(560px 300px at 95% 0%, hsl(var(--accent)), transparent 62%)',
          }}
        />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Painel administrativo
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              Olá, {user?.email?.split('@')[0] || 'Admin'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Crie uma apostila em segundos ou escolha uma seção no menu lateral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => handleQuickCreate('link')} className="rounded-xl font-semibold">
              <LinkIcon className="mr-1.5 h-4 w-4" /> Nova por link
            </Button>
            <Button onClick={() => handleQuickCreate('pdf')} variant="secondary" className="rounded-xl font-semibold">
              <FileUp className="mr-1.5 h-4 w-4" /> Por PDF
            </Button>
            <Button onClick={() => handleQuickCreate('text')} variant="secondary" className="rounded-xl font-semibold">
              <FileText className="mr-1.5 h-4 w-4" /> Por texto
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl" onClick={load} aria-label="Atualizar dados">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            onClick={() => onNavigate(c.tab)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">{c.label}</p>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  c.tone === 'primary'
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-accent/30 bg-accent/10 text-accent'
                }`}
              >
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums sm:text-3xl">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ver detalhes →</p>
          </motion.button>
        ))}
      </div>


      {/* Chart + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Engajamento da semana</CardTitle>
              <CardDescription>Apostilas lidas e exercícios resolvidos</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full">Últimos 7 dias</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={engagement} barGap={6}>
                <defs>
                  <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  </linearGradient>
                  <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                  </linearGradient>

                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="apostilas" fill="url(#grad-purple)" radius={[8,8,0,0]} />
                <Bar dataKey="exercises" fill="url(#grad-amber)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ranking de alunos */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Ranking
              </CardTitle>
              <CardDescription>Clique para ver detalhes</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('users')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {rankings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Ainda sem respostas registradas.
              </p>
            )}
            {rankings.map((r, idx) => {
              const MedalIcon = idx === 0 ? Trophy : idx === 1 ? Medal : idx === 2 ? Award : null;
              const medalColor = idx === 0 ? 'text-primary' : idx === 1 ? 'text-accent' : 'text-muted-foreground';
              return (
                <button
                  key={r.user_id}
                  type="button"
                  onClick={() => openStudent(r)}
                  className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="w-7 text-center font-bold text-sm text-muted-foreground">
                    {MedalIcon ? <MedalIcon className={`h-5 w-5 ${medalColor} mx-auto`} /> : `${idx + 1}º`}
                  </div>
                  <div className="w-9 h-9 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (r.full_name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.full_name || 'Aluno'}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary font-medium">{r.hits}</span> acertos · <span className="text-destructive">{r.errors}</span> erros
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/30">
                    {r.accuracy}%
                  </Badge>

                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Apostilas recentes com filtros */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Apostilas recentes</CardTitle>
              <CardDescription>Busque, filtre e gerencie sem sair do dashboard</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('apostilas')}>
              Ver todas <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Filtros linha 1: busca, categoria, status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="published">Publicadas</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros linha 2: intervalo de datas + ordenação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-full"
                aria-label="De"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">até</span>
              <Input
                type="date"
                value={dateUntil}
                onChange={(e) => setDateUntil(e.target.value)}
                className="rounded-full"
                aria-label="Até"
              />
            </div>
            <Select value={sortKey} onValueChange={(v: any) => setSortKey(v)}>
              <SelectTrigger className="rounded-full">
                <ArrowDownUp className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Criada · mais recente</SelectItem>
                <SelectItem value="created_asc">Criada · mais antiga</SelectItem>
                <SelectItem value="updated_desc">Atualizada · mais recente</SelectItem>
                <SelectItem value="updated_asc">Atualizada · mais antiga</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(hasFilters || selected.size > 0) && (
            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> {filtered.length} resultado(s) · mostrando {Math.min(visibleCount, filtered.length)}
              </p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  <X className="h-3 w-3 mr-1" /> Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Barra de ações em lote */}
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2"
            >
              <Badge className="rounded-full bg-primary/15 text-primary border-primary/30">
                {selected.size} selecionada(s)
              </Badge>
              <div className="flex-1" />
              <Button
                size="sm" variant="outline" className="rounded-full"
                onClick={() => bulkSetPublished(true)} disabled={bulkBusy}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" /> Publicar
              </Button>
              <Button
                size="sm" variant="outline" className="rounded-full"
                onClick={() => bulkSetPublished(false)} disabled={bulkBusy}
              >
                <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Despublicar
              </Button>
              <Button
                size="sm" variant="destructive" className="rounded-full"
                onClick={() => setBulkDeleteOpen(true)} disabled={bulkBusy}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}

          {/* Cabeçalho com select-all */}
          {visibleItems.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-muted-foreground border-b border-border/40 mb-2">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleSelectAllVisible}
                aria-label="Selecionar todas visíveis"
              />
              <span>Selecionar todas visíveis</span>
            </div>
          )}

          <div className="space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-9 w-9 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                <p className="text-sm">Nenhuma apostila encontrada.</p>
              </div>
            )}

            {(() => {
              // Agrupa por categoria mantendo ordem alfabetica
              const groupsMap = new Map<string, ApostilaRow[]>();
              for (const it of visibleItems) {
                const key = (it.category?.trim() || 'Sem categoria');
                const arr = groupsMap.get(key) ?? [];
                arr.push(it);
                groupsMap.set(key, arr);
              }
              const groups = Array.from(groupsMap.entries()).sort(([a], [b]) =>
                a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
              );

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups.map(([category, items]) => {
                      const color = getSubjectColor(category);
                      const published = items.filter((i) => i.published).length;
                      const isOpen = openCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setOpenCategory(isOpen ? null : category)}
                          aria-expanded={isOpen}
                          className={`group relative text-left rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                            isOpen
                              ? 'border-primary/60 shadow-lg ring-1 ring-primary/30'
                              : 'border-border/60 hover:border-primary/40'
                          }`}
                          style={{ boxShadow: isOpen ? `0 8px 32px -12px ${color}55` : undefined }}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                            style={{ backgroundColor: color }}
                            aria-hidden
                          />
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="rounded-xl p-2.5 shrink-0"
                              style={{ backgroundColor: `${color}22`, color }}
                            >
                              <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                                isOpen ? 'rotate-180 text-primary' : ''
                              }`}
                            />
                          </div>
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">
                            {category}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                              {items.length} {items.length === 1 ? 'apostila' : 'apostilas'}
                            </Badge>
                            <span className="tabular-nums">
                              {published}/{items.length} publicadas
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence initial={false}>
                    {openCategory && (
                      <motion.div
                        key={openCategory}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        {(() => {
                          const items = groups.find(([c]) => c === openCategory)?.[1] ?? [];
                          const color = getSubjectColor(openCategory);
                          return (
                            <div
                              className="rounded-2xl border border-border/60 bg-muted/30 p-3 sm:p-4"
                              style={{ borderTopColor: color, borderTopWidth: 2 }}
                            >
                              <div className="flex items-baseline justify-between mb-3 px-1">
                                <h4 className="font-semibold text-sm" style={{ color }}>
                                  {openCategory}
                                </h4>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {items.map((item) => {
                                  const isSel = selected.has(item.id);
                                  return (
                                    <div
                                      key={item.id}
                                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                        isSel ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card hover:bg-muted/40'
                                      }`}
                                    >
                                      <Checkbox
                                        checked={isSel}
                                        onCheckedChange={() => toggleSelectOne(item.id)}
                                        aria-label={`Selecionar ${item.title}`}
                                      />
                                      <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${color}22`, color }}
                                      >
                                        <BookOpen className="h-5 w-5" strokeWidth={1.75} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          criada {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                          {item.updated_at && item.updated_at !== item.created_at && (
                                            <> · atualizada {new Date(item.updated_at).toLocaleDateString('pt-BR')}</>
                                          )}
                                        </p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={item.published
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}
                                      >
                                        {item.published ? 'Publicada' : 'Rascunho'}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="icon" variant="ghost"
                                          title={item.published ? 'Despublicar' : 'Publicar'}
                                          disabled={busyId === item.id}
                                          onClick={() => handleTogglePublish(item)}
                                        >
                                          {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button size="icon" variant="ghost" title="Editar" onClick={() => handleEdit(item)}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon" variant="ghost" title="Excluir"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => setDeleteTarget(item)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              );
            })()}
          </div>


          {/* Paginação - Carregar mais */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full"
              >
                Carregar mais ({filtered.length - visibleCount} restantes)
              </Button>
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs text-muted-foreground pt-4">
              Fim da lista · {filtered.length} apostila(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirm individual delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir apostila?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title}</strong> será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} apostila(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as apostilas selecionadas serão removidas permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              disabled={bulkBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkBusy ? 'Excluindo...' : 'Excluir tudo'}
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
    </div>
  );
}
