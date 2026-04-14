import React, { useEffect, useState, useCallback, useRef, useMemo, useContext, createContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GliderTabs } from '@/components/GliderTabs';
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
  Users, ShieldBan, ShieldCheck, Search, Menu, X, Activity, GraduationCap, FolderOpen, Settings, RefreshCw,
  Sun, Moon, FileUp
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ActivityChart } from '@/components/ActivityChart';

type Apostila = Tables<'apostilas'>;
type Exercise = Tables<'exercises'>;
type Material = Tables<'materials'>;

const SEMESTER_LABELS: Record<number, string> = {
  1: '1º Semestre', 2: '2º Semestre', 3: '3º Semestre', 4: '4º Semestre',
  5: '5º Semestre', 6: '6º Semestre', 7: '7º Semestre', 8: '8º Semestre',
};

const CategoriesCtx = createContext<{ categories: { id: string; name: string; sort_order: number }[] }>({ categories: [] });

function CategorySelect({ value, onValueChange, placeholder }: { value: string; onValueChange: (v: string) => void; placeholder?: string }) {
  const { categories } = useContext(CategoriesCtx);
  const grouped = useMemo(() => {
    const map: Record<number, string[]> = {};
    categories.forEach(c => {
      const sem = Math.floor(c.sort_order / 100);
      if (!map[sem]) map[sem] = [];
      map[sem].push(c.name);
    });
    return map;
  }, [categories]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="mt-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {Object.entries(grouped).sort(([a], [b]) => +a - +b).map(([sem, names]) => (
          <div key={sem}>
            <div className="px-2 py-1.5 text-xs font-semibold text-primary sticky top-0 bg-popover">{SEMESTER_LABELS[+sem] || `Semestre ${sem}`}</div>
            {names.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

type Tab = 'overview' | 'apostilas' | 'exercises' | 'materials' | 'users';

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
  xls: 'excel', xlsx: 'excel',
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

// ─── Sidebar Navigation ────────────────────────────────────────
function AdminSidebar({ tab, setTab, stats, sidebarOpen, setSidebarOpen }: {
  tab: Tab; setTab: (t: Tab) => void;
  stats: { apostilas: number; exercises: number; materials: number; users: number };
  sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const navItems = [
    { id: 'overview' as Tab, label: 'Visão Geral', icon: BarChart3, count: undefined },
    { id: 'apostilas' as Tab, label: 'Apostilas', icon: BookOpen, count: stats.apostilas },
    { id: 'exercises' as Tab, label: 'Exercícios', icon: PenLine, count: stats.exercises },
    { id: 'materials' as Tab, label: 'Materiais', icon: FolderOpen, count: stats.materials },
    { id: 'users' as Tab, label: 'Usuários', icon: Users, count: stats.users },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary p-2.5">
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground">Admin Panel</h1>
                <p className="text-[10px] text-muted-foreground">Decode Analytics</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <div className="px-3 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Menu</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  tab === item.id
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${tab === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tab === item.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggleButton />
          <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Dashboard
          </Button>
        </div>
      </aside>
    </>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────
function OverviewTab({ apostilas, exercises, allAnswers, materials, users, setTab, loading }: {
  apostilas: Apostila[]; exercises: Record<string, Exercise[]>; allAnswers: any[];
  materials: Material[]; users: any[]; setTab: (t: Tab) => void; loading?: boolean;
}) {
  const totalExercises = Object.values(exercises).flat().length;
  const totalAnswers = allAnswers.length;
  const correctAnswers = allAnswers.filter(a => a.is_correct).length;
  const approvalRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const published = apostilas.filter(a => a.published).length;
  const blocked = users.filter((u: any) => u.is_blocked).length;

  const statCards = [
    { icon: BookOpen, label: 'Apostilas', value: apostilas.length, sub: `${published} publicadas`, color: 'bg-primary/10 text-primary' },
    { icon: PenLine, label: 'Exercícios', value: totalExercises, sub: 'cadastrados', color: 'bg-accent text-accent-foreground' },
    { icon: CheckCircle, label: 'Respostas', value: totalAnswers, sub: `${correctAnswers} corretas`, color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
    { icon: Users, label: 'Usuários', value: users.length, sub: `${blocked} bloqueados`, color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
    { icon: FolderOpen, label: 'Materiais', value: materials.length, sub: 'arquivos', color: 'bg-primary/10 text-primary' },
    { icon: TrendingUp, label: 'Aproveitamento', value: approvalRate, sub: 'geral', color: 'bg-accent text-accent-foreground', suffix: '%' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-shimmer h-8 w-40 rounded" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-shimmer h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton-shimmer h-40 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton-shimmer h-64 rounded-xl" />
          <div className="skeleton-shimmer h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Resumo completo da plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.08 }}
          >
            <Card className="overflow-hidden hover-lift">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-xl p-2.5 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter end={typeof s.value === 'number' ? s.value : 0} suffix={(s as any).suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.label} · {s.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Desempenho dos Alunos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa de acerto geral</span>
              <span className="text-lg font-bold text-primary"><AnimatedCounter end={approvalRate} suffix="%" /></span>
            </div>
            <Progress value={approvalRate} className="h-3" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[hsl(var(--success))]" /> {correctAnswers} acertos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive" /> {totalAnswers - correctAnswers} erros
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Blocked Users Alert */}
      {blocked > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
        >
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-destructive/10 p-2.5">
                    <ShieldBan className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{blocked} usuário(s) bloqueado(s)</p>
                    <p className="text-xs text-muted-foreground">Contas aguardando revisão ou desbloqueio</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setTab('users')}>
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Apostilas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.7 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Apostilas Recentes
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setTab('apostilas')}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {apostilas.slice(0, 5).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.06 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${a.published ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{a.category} · {exercises[a.id]?.length || 0} exercícios</p>
                  </div>
                  <Badge variant={a.published ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                    {a.published ? 'Publicada' : 'Oculta'}
                  </Badge>
                </motion.div>
              ))}
              {apostilas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma apostila criada.</p>}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.8 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" /> Ações Rápidas
              </CardTitle>
              <CardDescription>Acesse as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Importar URL', icon: LinkIcon, action: () => setTab('apostilas') },
                  { label: 'Criar Apostila', icon: Plus, action: () => setTab('apostilas') },
                  { label: 'Exercícios', icon: PenLine, action: () => setTab('exercises') },
                  { label: 'Upload Material', icon: Upload, action: () => setTab('materials') },
                  { label: 'Gerenciar Usuários', icon: Users, action: () => setTab('users') },
                  { label: 'Ver Materiais', icon: FolderOpen, action: () => setTab('materials') },
                ].map((a, i) => (
                  <motion.div
                    key={a.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.05 }}
                  >
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 text-xs w-full" onClick={a.action}>
                      <a.icon className="h-5 w-5 text-primary" />
                      {a.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({});
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; sort_order: number }[]>([]);
  const [allAnswers, setAllAnswers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<{ id: string; user_id: string; full_name: string; email: string; is_blocked: boolean; created_at: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Apostila dialogs
  const [showExerciseDialog, setShowExerciseDialog] = useState<string | null>(null);
  const [selectedApostila, setSelectedApostila] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingApostila, setEditingApostila] = useState<Apostila | null>(null);
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
  const [importStep, setImportStep] = useState<'input' | 'review'>('input');
  const [importMode, setImportMode] = useState<'url' | 'text'>('url');
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
    setUsers((profs || []).map(p => ({ id: p.id, user_id: p.user_id, full_name: p.full_name, email: p.email, is_blocked: (p as any).is_blocked ?? false, created_at: p.created_at })));
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
      if (error) throw error;
      setImportTitle(data.title || '');
      setImportTopic(data.category || 'Geral');
      setImportContent(data.content || '');
      setImportExercises(data.exercises || []);
      setExtractionMethod(data.extraction_method || '');
      setImportStep('review');
      const methodLabel = data.extraction_method === 'firecrawl' ? ' (via Firecrawl 🔥)' : data.extraction_method === 'firecrawl-fallback' ? ' (Firecrawl fallback 🔥)' : '';
      toast.success(data.exercises?.length > 0 ? `Conteúdo estruturado com ${data.exercises.length} exercícios!${methodLabel}` : `Conteúdo estruturado!${methodLabel}`);
    } catch (err: any) { toast.error('Erro ao processar: ' + (err.message || 'Tente novamente')); }
    setCloning(false);
  };

  const handleSaveImport = async () => {
    if (!importTitle.trim() || !user) return;
    setCloning(true);
    try {
      const isNotion = importUrl.includes('notion.site') || importUrl.includes('notion.so');
      const sourceType = importMode === 'text' ? 'text' : isNotion ? 'notion' : 'link';
      const { data: newApostila, error } = await supabase.from('apostilas').insert({
        title: importTitle.trim(), content: importContent,
        category: importTopic || 'Geral', source_type: sourceType,
        file_url: importMode === 'text' ? null : isNotion ? null : importUrl, created_by: user.id, published: false,
      }).select().single();
      if (error) throw error;
      if (importExercises.length > 0 && newApostila) {
        await supabase.from('exercises').insert(importExercises.map(ex => ({
          apostila_id: newApostila.id, question: ex.question, options: ex.options,
          correct_answer: ex.correct_answer, explanation: ex.explanation || null,
        })));
      }
      toast.success(`Apostila salva com ${importExercises.length} exercícios!`);
      resetImportForm(); loadAll();
    } catch (err: any) { toast.error('Erro ao salvar: ' + (err.message || 'Tente novamente')); }
    setCloning(false);
  };

  const handleManualSave = async () => {
    if (!manualTitle.trim() || !user) return;
    const { error } = await supabase.from('apostilas').insert({
      title: manualTitle.trim(), content: manualContent,
      category: manualCategory || 'Geral', source_type: 'manual', created_by: user.id, published: false,
    });
    if (error) { toast.error('Erro ao criar'); return; }
    toast.success('Apostila criada!');
    setManualTitle(''); setManualContent(''); setManualCategory(''); setShowManualForm(false); loadAll();
  };

  const resetImportForm = () => {
    setImportUrl(''); setImportTitle(''); setImportTopic('');
    setImportContent(''); setImportExercises([]); setImportStep('input');
    setImportRawText(''); setExtractionMethod('');
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
          file_url: isNotion ? null : url, created_by: user.id, published: false,
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
    await supabase.from('apostilas').update({ published: !current }).eq('id', id);
    toast.success(!current ? 'Apostila publicada!' : 'Apostila ocultada!'); loadAll();
  };

  const deleteApostila = async (id: string) => {
    if (!confirm('Excluir esta apostila e seus exercícios?')) return;
    await supabase.from('exercises').delete().eq('apostila_id', id);
    await supabase.from('apostilas').delete().eq('id', id);
    toast.success('Apostila excluída'); loadAll();
  };

  const handleEditSave = async () => {
    if (!editingApostila) return;
    await supabase.from('apostilas').update({ title: editTitle, content: editContent, category: editCategory }).eq('id', editingApostila.id);
    toast.success('Apostila atualizada!'); setEditingApostila(null); loadAll();
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

  const deleteExercise = async (id: string) => {
    await supabase.from('exercises').delete().eq('id', id);
    toast.success('Exercício excluído'); loadAll();
  };

  const handleEditMaterial = async () => {
    if (!editingMaterial) return;
    const { error } = await supabase.from('materials').update({ title: editMatTitle.trim(), description: editMatDesc || null }).eq('id', editingMaterial.id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Material atualizado!'); setEditingMaterial(null); loadAll();
  };

  // Filtered data
  const filteredApostilas = useMemo(() => {
    if (!searchQuery.trim()) return apostilas;
    const q = searchQuery.toLowerCase();
    return apostilas.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [apostilas, searchQuery]);

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
    overview: { title: 'Visão Geral', desc: 'Resumo completo da plataforma' },
    apostilas: { title: 'Gerenciar Apostilas', desc: `${apostilas.length} apostilas cadastradas` },
    exercises: { title: 'Gerenciar Exercícios', desc: `${totalExercises} exercícios cadastrados` },
    materials: { title: 'Gerenciar Materiais', desc: `${materials.length} materiais disponíveis` },
    users: { title: 'Gerenciar Usuários', desc: `${users.length} usuários cadastrados` },
  };

  return (
    <CategoriesCtx.Provider value={{ categories: dbCategories }}>
      <div className="min-h-screen bg-background flex">
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
          <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border h-14 flex items-center px-4 lg:px-6 gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{tabTitles[tab].title}</h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">{tabTitles[tab].desc}</p>
            </div>

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

            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={loadAll} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </header>

          {/* Mobile GliderTabs */}
          <div className="lg:hidden sticky top-14 z-20 bg-card/95 backdrop-blur-xl border-b border-border/40 px-2 py-2 overflow-x-auto">
            <GliderTabs
              tabs={[
                { id: 'overview', label: 'Geral', icon: <BarChart3 className="h-3.5 w-3.5" /> },
                { id: 'apostilas', label: 'Apostilas', icon: <BookOpen className="h-3.5 w-3.5" />, count: apostilas.length },
                { id: 'exercises', label: 'Exercícios', icon: <PenLine className="h-3.5 w-3.5" />, count: totalExercises },
                { id: 'materials', label: 'Materiais', icon: <FolderOpen className="h-3.5 w-3.5" />, count: materials.length },
                { id: 'users', label: 'Usuários', icon: <Users className="h-3.5 w-3.5" />, count: users.length },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as Tab)}
            />
          </div>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
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
              <OverviewTab apostilas={apostilas} exercises={exercises} allAnswers={allAnswers} materials={materials} users={users} setTab={setTab} loading={refreshing} />
            )}

            {/* APOSTILAS */}
            {tab === 'apostilas' && (
              <div className="space-y-6">
                {/* Import Card */}
                <Card className="overflow-hidden">
                  <div className="h-1 bg-primary" />
                  <CardContent className="p-5 space-y-4">
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
                              🔗 URL
                            </button>
                            <button
                              onClick={() => setImportMode('text')}
                              className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${importMode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              📝 Texto
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => { setBatchMode(!batchMode); resetImportForm(); }}
                          className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${batchMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                          {batchMode ? '📦 Lote' : 'Modo Lote'}
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
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">📝 Notion</span>
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
                                const pdfFile = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
                                const txtFile = files.find(f => f.type === 'text/plain' || f.name.endsWith('.txt'));
                                const docFile = files.find(f => f.name.endsWith('.docx') || f.name.endsWith('.doc'));
                                const file = pdfFile || txtFile || docFile;
                                if (!file) { toast.error('Arraste um arquivo PDF, TXT ou DOCX'); return; }
                                toast.info(`Lendo ${file.name}...`);
                                try {
                                  const text = await file.text();
                                  setImportRawText(prev => prev ? prev + '\n\n' + text : text);
                                  toast.success(`Conteúdo de "${file.name}" adicionado!`);
                                } catch { toast.error('Erro ao ler o arquivo'); }
                              }}
                              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pdf,.txt,.doc,.docx';
                                input.onchange = async (ev) => {
                                  const file = (ev.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  toast.info(`Lendo ${file.name}...`);
                                  try {
                                    const text = await file.text();
                                    setImportRawText(prev => prev ? prev + '\n\n' + text : text);
                                    toast.success(`Conteúdo de "${file.name}" adicionado!`);
                                  } catch { toast.error('Erro ao ler o arquivo'); }
                                };
                                input.click();
                              }}
                            >
                              <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                              <p className="text-xs font-medium text-foreground">Arraste um PDF, TXT ou DOCX aqui</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">ou clique para selecionar</p>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                              <p className="relative bg-card text-[10px] text-muted-foreground text-center w-fit mx-auto px-2">ou cole o texto diretamente</p>
                            </div>

                            <div>
                              <Label htmlFor="import-rawtext" className="text-xs font-medium text-foreground">Texto Bruto da Aula</Label>
                              <Textarea id="import-rawtext"
                                value={importRawText}
                                onChange={e => setImportRawText(e.target.value)}
                                placeholder={"Cole aqui qualquer texto — mesmo bagunçado, copiado de slides ou anotações.\n\nA IA vai organizar tudo em formato de apostila com exercícios."}
                                rows={8}
                                className="mt-1.5 text-xs"
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {importRawText.trim().length > 0 ? `${importRawText.trim().split(/\s+/).length} palavras` : 'Cole qualquer texto — a IA estrutura automaticamente'}
                              </p>
                            </div>
                            <Button onClick={handleExtract} disabled={cloning || !importRawText.trim()} className="w-full gradient-primary text-primary-foreground">
                              {cloning ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Estruturando...</> : '✨ Estruturar como Apostila'}
                            </Button>
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
                              {extractionMethod.includes('firecrawl') ? '🔥 Firecrawl' : extractionMethod === 'text' ? '📝 Texto' : '🌐 Fetch'}
                            </span>
                          )}
                        </div>
                        <div><Label className="text-xs text-muted-foreground">Título</Label><Input value={importTitle} onChange={e => setImportTitle(e.target.value)} className="mt-1" /></div>
                        <div><Label className="text-xs text-muted-foreground">Categoria</Label><CategorySelect value={importTopic} onValueChange={setImportTopic} /></div>
                        <div><Label className="text-xs text-muted-foreground">Conteúdo</Label><Textarea value={importContent} onChange={e => setImportContent(e.target.value)} rows={6} className="mt-1 text-xs" /></div>
                        {importExercises.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">{importExercises.length} exercícios gerados</Label>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                              {importExercises.map((ex, i) => (
                                <div key={i} className="border border-border/50 rounded-lg p-3 text-xs">
                                  <p className="font-medium">{i + 1}. {ex.question}</p>
                                  <div className="mt-1 space-y-0.5 text-muted-foreground">
                                    {ex.options?.map((opt: string, oi: number) => (
                                      <p key={oi} className={String.fromCharCode(65 + oi) === ex.correct_answer ? 'text-[hsl(var(--success))] font-medium' : ''}>{String.fromCharCode(65 + oi)}) {opt}</p>
                                    ))}
                                  </div>
                                  <button className="mt-1 text-[10px] text-destructive hover:underline" onClick={() => setImportExercises(prev => prev.filter((_, idx) => idx !== i))}>Remover</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                        <Label htmlFor="manual-content" className="text-xs font-medium text-foreground">Conteúdo da Apostila</Label>
                        <Textarea id="manual-content" value={manualContent} onChange={e => setManualContent(e.target.value)} rows={6} className="mt-1.5" placeholder="Digite ou cole o conteúdo completo da aula..." />
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Apostilas ({filteredApostilas.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {filteredApostilas.map(a => {
                      const exCount = exercises[a.id]?.length || 0;
                      return (
                        <Card key={a.id} className="hover-lift card-alternate">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                              <span className={`h-3 w-3 rounded-full shrink-0 ${a.published ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm truncate">{a.title}</h4>
                                  <Badge variant={a.published ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                    {a.published ? 'Publicada' : 'Oculta'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                  <span>{a.category}</span>
                                  <span>·</span>
                                  <span>{exCount} exercícios</span>
                                  <span>·</span>
                                  <span>{new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowExerciseDialog(a.id)} title="Ver exercícios">
                                  <PenLine className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className={`h-8 w-8 ${a.published ? 'text-destructive' : 'text-[hsl(var(--success))]'}`} onClick={() => togglePublish(a.id, a.published)}>
                                  {a.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingApostila(a); setEditTitle(a.title); setEditContent(a.content || ''); setEditCategory(a.category); }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteApostila(a.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {filteredApostilas.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{searchQuery ? 'Nenhuma apostila encontrada.' : 'Nenhuma apostila criada.'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exercise Dialog */}
                {apostilas.map(a => (
                  <Dialog key={a.id} open={showExerciseDialog === a.id} onOpenChange={(v) => setShowExerciseDialog(v ? a.id : null)}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="text-base">Exercícios — {a.title}</DialogTitle></DialogHeader>
                      {exercises[a.id]?.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" /> Nenhum exercício.
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
                    </DialogContent>
                  </Dialog>
                ))}

                {/* Edit Apostila Dialog */}
                <Dialog open={!!editingApostila} onOpenChange={(v) => !v && setEditingApostila(null)}>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-base">Editar Apostila</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label className="text-xs">Título</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
                      <div><Label className="text-xs">Categoria</Label><CategorySelect value={editCategory} onValueChange={setEditCategory} /></div>
                      <div><Label className="text-xs">Conteúdo</Label><Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} /></div>
                      <Button className="w-full gradient-primary text-primary-foreground" onClick={handleEditSave}>Salvar</Button>
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
                    {(exercises[selectedApostila]?.length || 0) === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Nenhum exercício para esta apostila.</p>
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
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-accent p-2.5 shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{m.title}</h4>
                                <p className="text-[11px] text-muted-foreground">
                                  {m.type.toUpperCase()} · {new Date(m.created_at).toLocaleDateString('pt-BR')}
                                  {m.description && ` · ${m.description}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingMaterial(m); setEditMatTitle(m.title); setEditMatDesc(m.description || ''); }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                {m.file_url && (
                                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
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
                {/* Stats */}
                <div className="grid gap-4 grid-cols-3">
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
                  {filteredUsers.map(u => (
                    <Card key={u.id} className={`hover:shadow-md transition-shadow ${u.is_blocked ? 'border-destructive/30' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2.5 shrink-0 ${u.is_blocked ? 'bg-destructive/10' : 'bg-accent'}`}>
                            {u.is_blocked ? <ShieldBan className="h-5 w-5 text-destructive" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{u.full_name || 'Sem nome'}</p>
                              {u.is_blocked && <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{u.email} · Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={u.is_blocked ? 'outline' : 'destructive'}
                            className="text-xs h-9 gap-1.5 shrink-0"
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{searchQuery ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </main>
        </div>
      </div>
    </CategoriesCtx.Provider>
  );
}
