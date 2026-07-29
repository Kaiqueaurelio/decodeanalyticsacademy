import { useMemo, useState } from 'react';

import {
  ArrowLeft, CalendarClock, CheckCircle2, Circle, Download, Loader2, NotebookPen,
  Plus, RefreshCw, Sparkles, Target, Trash2, TrendingUp, History,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudyPlans, useStudyPlanDetail } from '@/hooks/useStudyPlans';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { EllaPlanSuggestions } from '@/components/study-plan/EllaPlanSuggestions';
import { exportStudyPlanPdf } from '@/lib/study-plan-pdf';

import {
  KIND_LABEL, LEVEL_LABEL, planProgress, pendingSubjects, studyStreak,
  type StudyPlan, type StudyPlanTask,
} from '@/lib/study-plan';

const LEVELS = ['iniciante', 'intermediario', 'avancado'] as const;

type FormState = {
  title: string;
  goal: string;
  area: string;
  subjects: string;
  priorities: string;
  level: string;
  hoursPerDay: number;
  daysPerWeek: number;
  deadline: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  title: '', goal: '', area: '', subjects: '', priorities: '',
  level: 'iniciante', hoursPerDay: 2, daysPerWeek: 5, deadline: '', notes: '',
};

function parseList(value: string) {
  return value.split(/[,;\n]/).map((v) => v.trim()).filter(Boolean);
}

// ---------------------------------------------------------------- Wizard
function PlanWizard({
  open, onOpenChange, initial, planId, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<FormState>;
  planId?: string;
  onDone: (planId: string) => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const isAdjust = Boolean(planId);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const subjects = parseList(form.subjects);
    if (!form.goal.trim()) return toast.error('Descreva seu objetivo de estudo.');
    if (subjects.length === 0) return toast.error('Informe pelo menos uma disciplina.');
    if (form.deadline && new Date(form.deadline) < new Date(new Date().toDateString())) {
      return toast.error('A data limite precisa ser futura.');
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-study-plan', {
        body: {
          mode: isAdjust ? 'adjust' : 'create',
          plan_id: planId,
          title: form.title.trim(),
          goal: form.goal.trim(),
          area: form.area.trim(),
          level: form.level,
          subjects,
          priorities: parseList(form.priorities),
          hours_per_day: form.hoursPerDay,
          days_per_week: form.daysPerWeek,
          deadline: form.deadline || null,
          notes: form.notes.trim(),
        },
      });

      if (error) throw new Error('Não foi possível falar com a assistente agora.');
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success(isAdjust ? 'Plano reorganizado com sucesso.' : 'Plano de estudos criado.');
      onOpenChange(false);
      onDone((data as any).plan_id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar o plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            {isAdjust ? 'Ajustar plano com a Ella' : 'Novo plano de estudos'}
          </DialogTitle>
          <DialogDescription>
            A Ella monta um cronograma equilibrado a partir da sua rotina e dos seus objetivos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="plan-title">Título do plano (opcional)</Label>
            <Input id="plan-title" value={form.title} maxLength={120}
              onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Reta final ENEM 2026" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-goal">Objetivo de estudo *</Label>
            <Textarea id="plan-goal" value={form.goal} maxLength={400} rows={3}
              onChange={(e) => set('goal', e.target.value)}
              placeholder="Ex.: Melhorar em Matemática e Redação para o ENEM" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-area">Curso ou área de interesse</Label>
              <Input id="plan-area" value={form.area} maxLength={120}
                onChange={(e) => set('area', e.target.value)} placeholder="Ex.: Ciência da Computação" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-level">Nível de conhecimento</Label>
              <Select value={form.level} onValueChange={(v) => set('level', v)}>
                <SelectTrigger id="plan-level" className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{LEVEL_LABEL[l]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-subjects">Matérias que deseja estudar *</Label>
            <Textarea id="plan-subjects" value={form.subjects} rows={2}
              onChange={(e) => set('subjects', e.target.value)}
              placeholder="Separe por vírgula. Ex.: Matemática, Redação, Biologia" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-priorities">Prioridade entre as disciplinas</Label>
            <Input id="plan-priorities" value={form.priorities}
              onChange={(e) => set('priorities', e.target.value)}
              placeholder="Da mais urgente para a menos. Ex.: Redação, Matemática" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Horas por dia: <strong>{form.hoursPerDay}h</strong></Label>
              <Slider value={[form.hoursPerDay]} min={0.5} max={10} step={0.5}
                onValueChange={([v]) => set('hoursPerDay', v)} aria-label="Horas de estudo por dia" />
            </div>
            <div className="grid gap-2">
              <Label>Dias por semana: <strong>{form.daysPerWeek}</strong></Label>
              <Slider value={[form.daysPerWeek]} min={1} max={7} step={1}
                onValueChange={([v]) => set('daysPerWeek', v)} aria-label="Dias de estudo por semana" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-deadline">Data limite (opcional)</Label>
              <Input id="plan-deadline" type="date" value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)} className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-notes">Observações</Label>
              <Input id="plan-notes" value={form.notes} maxLength={600}
                onChange={(e) => set('notes', e.target.value)} placeholder="Ex.: trabalho de manhã" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="h-11" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button className="h-11 gap-2" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {saving ? 'Montando seu plano…' : isAdjust ? 'Reorganizar plano' : 'Gerar plano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- Detalhe
function PlanDetail({ plan, onBack, onChanged }: {
  plan: StudyPlan;
  onBack: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const { tasks, versions, loading, reload, toggleTask } = useStudyPlanDetail(plan.id);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [title, setTitle] = useState(plan.title);

  const progress = useMemo(() => planProgress(tasks), [tasks]);
  const pending = useMemo(() => pendingSubjects(tasks), [tasks]);
  const streak = useMemo(() => studyStreak(tasks), [tasks]);

  const weeks = useMemo(() => {
    const map = new Map<number, StudyPlanTask[]>();
    tasks.forEach((t) => map.set(t.week_index, [...(map.get(t.week_index) ?? []), t]));
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [tasks]);

  const content = plan.plan ?? {};

  const saveTitle = async () => {
    const clean = title.trim().slice(0, 120);
    if (!clean || clean === plan.title) return setTitle(plan.title);
    const { error } = await supabase.from('planos_estudo').update({ title: clean }).eq('id', plan.id);
    if (error) { toast.error('Não foi possível renomear o plano.'); setTitle(plan.title); }
    else { toast.success('Título atualizado.'); onChanged(); }
  };

  const removePlan = async () => {
    const { error } = await supabase.from('planos_estudo').delete().eq('id', plan.id);
    if (error) return toast.error('Não foi possível excluir o plano.');
    toast.success('Plano excluído.');
    onChanged();
    onBack();
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('user_id', user?.id ?? '').maybeSingle();
      await exportStudyPlanPdf(plan, tasks, profile?.full_name ?? 'Aluno');
      toast.success('PDF gerado.');
    } catch {
      toast.error('Não foi possível gerar o PDF agora.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="h-11 gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Meus planos
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-11 gap-2" onClick={() => setAdjustOpen(true)}>
            <RefreshCw className="h-4 w-4" /> Ajustar com a Ella
          </Button>
          <Button variant="outline" size="sm" className="h-11 gap-2" onClick={exportPdf} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar PDF
          </Button>
          <Button variant="ghost" size="sm" className="h-11 gap-2 text-destructive"
            onClick={() => setConfirmDelete(true)} aria-label="Excluir plano">
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          aria-label="Título do plano"
          className="h-auto border-0 bg-transparent px-0 text-xl font-semibold focus-visible:ring-0 sm:text-2xl"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          {content.objetivo_principal || plan.goal}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">{LEVEL_LABEL[plan.level] ?? plan.level}</Badge>
          <Badge variant="outline">{plan.hours_per_day}h/dia</Badge>
          <Badge variant="outline">{plan.days_per_week} dias/semana</Badge>
          {plan.deadline && <Badge variant="outline">até {new Date(plan.deadline).toLocaleDateString('pt-BR')}</Badge>}
          <Badge variant="outline">v{plan.version}</Badge>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{progress.pct}% · {progress.done}/{progress.total}</span>
          </div>
          <Progress value={progress.pct} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Sequência</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> {streak}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Previsão</p>
            <p className="mt-1 text-sm font-medium">{content.previsao_conclusao || plan.deadline || 'A definir'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Carga semanal</p>
            <p className="mt-1 text-sm font-medium">
              {content.carga_horaria?.por_semana_horas ?? plan.hours_per_day * plan.days_per_week} h
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="cronograma">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="versoes">Histórico</TabsTrigger>

        </TabsList>

        <TabsContent value="cronograma" className="mt-4 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Carregando cronograma…</p>}
          {!loading && weeks.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma atividade neste plano.</p>
          )}
          {weeks.map(([week, weekTasks]) => {
            const wp = planProgress(weekTasks);
            return (
              <Card key={week} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Semana {week}</h3>
                  <span className="text-xs text-muted-foreground">{wp.done}/{wp.total} concluídas</span>
                </div>
                <div className="mt-3 space-y-2">
                  {weekTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={async () => {
                        const ok = await toggleTask(task);
                        if (!ok) toast.error('Não foi possível atualizar a atividade.');
                      }}
                      aria-pressed={task.done}
                      className={`flex w-full min-h-[44px] items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        task.done ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      {task.done
                        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                        : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />}
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium ${task.done ? 'line-through opacity-70' : ''}`}>
                          {task.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {task.day_label}
                          {task.subject ? ` · ${task.subject}` : ''}
                          {` · ${KIND_LABEL[task.kind] ?? task.kind} · ${task.duration_minutes} min`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="sugestoes" className="mt-4">
          <EllaPlanSuggestions plan={plan} onApplied={() => { reload(); onChanged(); }} />
        </TabsContent>



        <TabsContent value="metas" className="mt-4 space-y-4">
          {([
            ['Curto prazo', content.metas?.curto_prazo],
            ['Médio prazo', content.metas?.medio_prazo],
            ['Longo prazo', content.metas?.longo_prazo],
            ['Recomendações de revisão', content.revisao],
            ['Sugestões de exercícios', content.exercicios],
            ['Pausas e descanso', content.pausas],
          ] as [string, string[] | undefined][]).map(([label, items]) => (
            items?.length ? (
              <Card key={label} className="p-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Target className="h-4 w-4" strokeWidth={1.75} /> {label}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {items.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </Card>
            ) : null
          ))}
        </TabsContent>

        <TabsContent value="evolucao" className="mt-4 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold">Disciplinas pendentes</h3>
            {pending.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Tudo concluído. Excelente trabalho.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pending.map(([subject, count]) => (
                  <li key={subject} className="flex items-center justify-between text-sm">
                    <span>{subject}</span>
                    <Badge variant="outline">{count} atividade{count > 1 ? 's' : ''}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold">Ordem recomendada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {content.ordem_recomendada?.join(' → ') || plan.subjects.join(' → ')}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="versoes" className="mt-4 space-y-3">
          {versions.length === 0 && <p className="text-sm text-muted-foreground">Sem versões anteriores.</p>}
          {versions.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-center gap-3 p-4">
              <History className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium">Versão {v.version}</span>
              <span className="text-xs text-muted-foreground">{v.note}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(v.created_at).toLocaleString('pt-BR')}
              </span>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <PlanWizard
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        planId={plan.id}
        initial={{
          title: plan.title,
          goal: plan.goal,
          area: plan.area ?? '',
          level: plan.level,
          subjects: plan.subjects.join(', '),
          priorities: Array.isArray(plan.priorities) ? (plan.priorities as string[]).join(', ') : '',
          hoursPerDay: Number(plan.hours_per_day),
          daysPerWeek: plan.days_per_week,
          deadline: plan.deadline ?? '',
        }}
        onDone={() => { reload(); onChanged(); }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este plano?</AlertDialogTitle>
            <AlertDialogDescription>
              O cronograma, o progresso e o histórico de versões deste plano serão apagados. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="h-11" onClick={removePlan}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------- Página
export default function PlanoEstudosPage() {

  const { plans, loading, error, reload } = useStudyPlans();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = plans.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {selected ? (
          <PlanDetail
            plan={selected}
            onBack={() => setSelectedId(null)}
            onChanged={reload}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                  <NotebookPen className="h-5 w-5" strokeWidth={1.75} />
                  Plano de Estudos
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cronogramas personalizados criados com a Ella, com acompanhamento e exportação em PDF.
                </p>
              </div>
              <Button className="h-11 gap-2" onClick={() => setWizardOpen(true)}>
                <Plus className="h-4 w-4" /> Novo plano
              </Button>
            </div>

            {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

            {loading ? (
              <p className="mt-8 text-sm text-muted-foreground">Carregando seus planos…</p>
            ) : plans.length === 0 ? (
              <Card className="mt-8 p-8 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
                <h2 className="mt-3 font-semibold">Você ainda não tem um plano</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Conte seu objetivo, as matérias e quanto tempo tem por dia. A Ella monta o cronograma completo.
                </p>
                <Button className="mt-5 h-11 gap-2" onClick={() => setWizardOpen(true)}>
                  <Plus className="h-4 w-4" /> Criar meu primeiro plano
                </Button>
              </Card>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedId(plan.id)}
                    className="rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <h2 className="line-clamp-2 font-semibold">{plan.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plan.goal}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.subjects.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                      {plan.subjects.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">+{plan.subjects.length - 4}</Badge>
                      )}
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {plan.hours_per_day}h/dia · {plan.days_per_week} dias · v{plan.version}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <PlanWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onDone={async (id) => { await reload(); setSelectedId(id); }}
      />
    </div>
  );
}
