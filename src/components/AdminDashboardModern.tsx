import React, { useState, useEffect, useMemo } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookOpen, PenLine, Users, Megaphone, RefreshCw, Search, ChevronRight, Sparkles,
  Activity, GraduationCap, Bell, ArrowUpRight, Link as LinkIcon, FileText, FileUp,
  Eye, EyeOff, Edit, Trash2, Trophy, Medal, Award, Filter, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface Props { onNavigate: (tab: string) => void }

type ApostilaRow = {
  id: string; title: string; category: string | null;
  published: boolean; created_at: string;
};

type Ranking = {
  user_id: string; full_name: string; ra: string | null;
  avatar_url: string | null; total: number; hits: number;
  errors: number; accuracy: number;
};

const DATE_RANGES = [
  { value: 'all', label: 'Qualquer data' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

export function AdminDashboardModern({ onNavigate }: Props) {
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
  const [dateRange, setDateRange] = useState<string>('all');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ApostilaRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
          .select('id,title,category,published,created_at')
          .order('created_at', { ascending: false })
          .limit(100),
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
    const now = Date.now();
    const days = dateRange === 'all' ? null : parseInt(dateRange, 10);
    return apostilas.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q)) return false;
      if (statusFilter === 'published' && !a.published) return false;
      if (statusFilter === 'draft' && a.published) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (days) {
        const ageDays = (now - new Date(a.created_at).getTime()) / 86400000;
        if (ageDays > days) return false;
      }
      return true;
    });
  }, [apostilas, search, statusFilter, categoryFilter, dateRange]);

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

  const handleEdit = (a: ApostilaRow) => {
    navigate(`/admin/apostilas/${a.id}`);
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

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setDateRange('all');
  };
  const hasFilters = !!search || statusFilter !== 'all' || categoryFilter !== 'all' || dateRange !== 'all';

  const cards = [
    { label: 'Apostilas', value: stats.apostilas, icon: BookOpen, gradient: 'from-blue-500 to-blue-600', tab: 'apostilas' },
    { label: 'Exercícios', value: stats.exercises, icon: PenLine, gradient: 'from-emerald-500 to-green-600', tab: 'exercises' },
    { label: 'Usuários', value: stats.users, icon: Users, gradient: 'from-pink-500 to-rose-600', tab: 'users' },
    { label: 'Anúncios', value: stats.ads, icon: Megaphone, gradient: 'from-amber-500 to-orange-600', tab: 'ads' },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo Decode Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full"><Bell className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, hsl(265 85% 35%), hsl(280 80% 50%) 50%, hsl(300 70% 55%))' }}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-amber-200 font-semibold text-lg">
            Olá, {user?.email?.split('@')[0] || 'Admin'}
          </p>
          <h2 className="text-white text-2xl sm:text-3xl font-bold mt-2 leading-tight">
            Gerencie a <span className="text-amber-200">academia</span> com
            uma <span className="text-amber-200">experiência</span> intuitiva.
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => handleQuickCreate('link')} className="bg-amber-400 hover:bg-amber-500 text-purple-950 font-semibold rounded-full px-5">
              <LinkIcon className="h-4 w-4 mr-1.5" /> Por link
            </Button>
            <Button onClick={() => handleQuickCreate('pdf')} className="bg-white/15 hover:bg-white/25 text-white font-semibold rounded-full px-5 backdrop-blur">
              <FileUp className="h-4 w-4 mr-1.5" /> Por PDF
            </Button>
            <Button onClick={() => handleQuickCreate('text')} className="bg-white/15 hover:bg-white/25 text-white font-semibold rounded-full px-5 backdrop-blur">
              <FileText className="h-4 w-4 mr-1.5" /> Por texto
            </Button>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-10 bottom-0 w-40 h-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 opacity-90">
          <div className="relative">
            <GraduationCap className="w-32 h-32 text-white/90" strokeWidth={1.2} />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-200" />
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            onClick={() => onNavigate(c.tab)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="text-left rounded-2xl bg-card border border-border/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{c.label}</p>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-md`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-3">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">Ver detalhes →</p>
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
                    <stop offset="0%" stopColor="hsl(280 80% 60%)" />
                    <stop offset="100%" stopColor="hsl(265 85% 45%)" />
                  </linearGradient>
                  <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(45 95% 60%)" />
                    <stop offset="100%" stopColor="hsl(30 95% 55%)" />
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
                <Trophy className="h-5 w-5 text-amber-500" /> Ranking
              </CardTitle>
              <CardDescription>Top alunos por acertos</CardDescription>
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
              const medalColor = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-600' : '';
              return (
                <div key={r.user_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-7 text-center font-bold text-sm text-muted-foreground">
                    {MedalIcon ? <MedalIcon className={`h-5 w-5 ${medalColor} mx-auto`} /> : `${idx + 1}º`}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs shrink-0 overflow-hidden">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (r.full_name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.full_name || 'Aluno'}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-emerald-600 font-medium">{r.hits}</span> acertos · <span className="text-rose-600">{r.errors}</span> erros
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    {r.accuracy}%
                  </Badge>
                </div>
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

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3">
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
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Data" /></SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> {filtered.length} resultado(s)
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma apostila encontrada.</p>
            )}
            {filtered.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.category || 'Sem categoria'} · {new Date(item.created_at).toLocaleDateString('pt-BR')}
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
                    size="icon"
                    variant="ghost"
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
                    size="icon"
                    variant="ghost"
                    title="Excluir"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirm */}
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
    </div>
  );
}
