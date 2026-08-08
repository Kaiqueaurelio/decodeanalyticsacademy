import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  PenLine, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Plus, 
  Activity, 
  BarChart3, 
  ShieldBan, 
  Clock, 
  Settings, 
  BookOpen as BookIcon,
  Link as LinkIcon,
  Upload,
  FolderOpen,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ActivityChart } from '@/components/ActivityChart';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;
type Exercise = Tables<'exercises'>;
type Material = Tables<'materials'>;

interface OverviewTabProps {
  apostilas: Apostila[];
  exercises: Record<string, Exercise[]>;
  allAnswers: any[];
  materials: Material[];
  users: any[];
  setTab: (t: any) => void;
  loading?: boolean;
  filterSemester: string;
  setFilterSemester: (s: string) => void;
}

export function OverviewTab({ 
  apostilas, 
  exercises, 
  allAnswers, 
  users, 
  setTab, 
  loading, 
  filterSemester, 
  setFilterSemester 
}: OverviewTabProps) {
  const navigate = useNavigate();
  const totalExercises = Object.values(exercises).flat().length;
  const totalAnswers = allAnswers.length;
  const correctAnswers = allAnswers.filter(a => a.is_correct).length;
  const approvalRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const published = apostilas.filter(a => a.published).length;
  const blocked = users.filter((u: any) => u.is_blocked).length;
  const draft = apostilas.length - published;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newUsers7d = users.filter((u: any) => new Date(u.created_at).getTime() > weekAgo).length;

  const statCards = [
    { icon: BookOpen, label: 'Apostilas', value: apostilas.length, sub: `${published} publicadas · ${draft} rascunho`, tone: 'primary', trend: published > 0 ? `${Math.round((published / Math.max(apostilas.length, 1)) * 100)}%` : null },
    { icon: PenLine, label: 'Exercícios', value: totalExercises, sub: `em ${Object.keys(exercises).length} apostilas`, tone: 'violet', trend: null },
    { icon: TrendingUp, label: 'Aproveitamento', value: approvalRate, sub: `${totalAnswers} respostas totais`, tone: 'success', trend: null, suffix: '%' },
    { icon: Users, label: 'Usuários', value: users.length, sub: blocked > 0 ? `${blocked} bloqueados` : `+${newUsers7d} esta semana`, tone: blocked > 0 ? 'danger' : 'warning', trend: newUsers7d > 0 ? `+${newUsers7d}` : null },
  ] as const;

  const toneStyles: Record<string, { wrap: string; icon: string; ring: string }> = {
    primary: { wrap: 'bg-primary/10', icon: 'text-primary', ring: 'group-hover:ring-primary/30' },
    violet:  { wrap: 'bg-accent', icon: 'text-accent-foreground', ring: 'group-hover:ring-accent-foreground/20' },
    success: { wrap: 'bg-[hsl(var(--success))]/10', icon: 'text-[hsl(var(--success))]', ring: 'group-hover:ring-[hsl(var(--success))]/30' },
    warning: { wrap: 'bg-[hsl(var(--warning))]/10', icon: 'text-[hsl(var(--warning))]', ring: 'group-hover:ring-[hsl(var(--warning))]/30' },
    danger:  { wrap: 'bg-destructive/10', icon: 'text-destructive', ring: 'group-hover:ring-destructive/30' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Painel Operacional</h2>
          <p className="text-sm text-muted-foreground mt-1">Status operacional e métricas de desempenho</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-[180px] rounded-2xl bg-card border-primary/20">
              <GraduationCap className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Semestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Semestres</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <SelectItem key={s} value={s.toString()}>{s}º Semestre</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-10 rounded-2xl gap-2" onClick={() => setTab('apostilas')}>
            <Plus className="h-4 w-4" /> Nova Apostila
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const t = toneStyles[s.tone];
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.06 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 rounded-[2rem] cursor-default">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`rounded-2xl p-3 shadow-inner ${t.wrap} ring-1 ring-inset ring-white/5`}>
                      <s.icon className={`h-6 w-6 ${t.icon}`} />
                    </div>
                    {s.trend && (
                      <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-muted/80 text-foreground shadow-sm">
                        {s.trend}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                      <AnimatedCounter end={typeof s.value === 'number' ? s.value : 0} suffix={(s as any).suffix} />
                    </p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] pt-1">{s.label}</p>
                    <p className="text-[11px] font-medium text-muted-foreground/60 truncate">{s.sub}</p>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="h-full border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Desempenho
              </CardTitle>
              <CardDescription className="text-xs">Taxa de acerto geral dos alunos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-primary tabular-nums leading-none">
                    <AnimatedCounter end={approvalRate} suffix="%" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Aproveitamento</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-muted-foreground">{totalAnswers} respostas</p>
                  <p className="text-xs text-muted-foreground">{totalExercises} exercícios</p>
                </div>
              </div>
              <Progress value={approvalRate} className="h-2.5" />
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" /> {correctAnswers} acertos
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> {totalAnswers - correctAnswers} erros
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.35 }}
          className="lg:col-span-2"
        >
          <Card className="h-full border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Atividade Recente
              </CardTitle>
              <CardDescription className="text-xs">Engajamento dos últimos dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart delay={0.4} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
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
              {apostilas.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                  <p className="text-sm">Nenhuma apostila criada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
            <CardContent className="space-y-3">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                onClick={() => navigate('/admin/biblioteca')}
                className="group w-full text-left rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 hover:border-primary/60 hover:shadow-lg transition-all p-4 flex items-center gap-4"
              >
                <div className="rounded-xl bg-primary/15 p-3 shrink-0 group-hover:scale-110 transition-transform">
                  <BookIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                    Publicar Livros (PDF / EPUB)
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Biblioteca Decode</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Acervo exclusivo de livros — separado da aba Materiais</p>
                </div>
                <Plus className="h-4 w-4 text-primary shrink-0" />
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Importar URL', icon: LinkIcon, action: () => setTab('apostilas') },
                  { label: 'Criar Apostila', icon: Plus, action: () => setTab('apostilas') },
                  { label: 'Exercícios', icon: PenLine, action: () => setTab('exercises') },
                  { label: 'Upload Material', icon: Upload, action: () => setTab('materials') },
                  { label: 'Gerenciar Usuários', icon: Users, action: () => setTab('users') },
                  { label: 'Ver Materiais', icon: FolderOpen, action: () => setTab('materials') },
                  { label: 'Download Logo', icon: Download, action: async () => {
                    try {
                      const response = await fetch('/logo-decode.png');
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'logo-decode.png';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Logo baixado com sucesso!');
                    } catch (err) {
                      toast.error('Erro ao baixar logo');
                    }
                  } },
                ].map((a, i) => (
                  <motion.div
                    key={a.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.05 }}
                  >
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2 text-xs w-full" onClick={() => {
                      const result = a.action() as unknown;
                      if (result instanceof Promise) result.catch(() => {});
                    }}>
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
