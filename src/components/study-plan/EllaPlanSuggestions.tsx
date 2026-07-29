/**
 * Sugestões automáticas da Ella para o Plano de Estudos.
 *
 * A análise é feita no servidor a partir do histórico real do aluno
 * (conclusão de atividades por disciplina, apostilas concluídas, acerto em
 * exercícios e dias parados). O aluno escolhe quais sugestões aplicar; ao
 * aplicar, o cronograma é regerado e a versão anterior fica registrada no
 * histórico com a nota do ajuste.
 */
import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import type { StudyPlan } from '@/lib/study-plan';

export type PlanSuggestion = {
  titulo: string;
  motivo: string;
  acao: 'reforcar' | 'reduzir' | 'reordenar' | 'revisar' | 'ritmo';
  disciplina: string;
  impacto: 'alto' | 'medio' | 'baixo';
  instrucao: string;
};

type Signals = {
  totalTasks: number;
  doneTasks: number;
  pct: number;
  bySubject: { subject: string; total: number; done: number; pct: number }[];
  staleDays: number;
  apostilasConcluidas: number;
  exerciciosRespondidos: number;
  precisao: number;
  streakAtual: number;
};

const ACTION_LABEL: Record<PlanSuggestion['acao'], string> = {
  reforcar: 'Reforçar',
  reduzir: 'Aliviar carga',
  reordenar: 'Reordenar',
  revisar: 'Revisão',
  ritmo: 'Retomar ritmo',
};

const IMPACT_CLASS: Record<PlanSuggestion['impacto'], string> = {
  alto: 'border-primary/40 text-primary',
  medio: 'border-border text-muted-foreground',
  baixo: 'border-border text-muted-foreground',
};

export function EllaPlanSuggestions({
  plan, onApplied,
}: {
  plan: StudyPlan;
  onApplied: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<PlanSuggestion[] | null>(null);
  const [signals, setSignals] = useState<Signals | null>(null);
  const [resumo, setResumo] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const analyze = useCallback(async (silent = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-study-plan', {
        body: { mode: 'suggest', plan_id: plan.id },
      });
      if (error) throw new Error('Não foi possível falar com a assistente agora.');
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      const list = ((data as { sugestoes?: PlanSuggestion[] })?.sugestoes ?? []);
      setSuggestions(list);
      setSignals((data as { signals?: Signals })?.signals ?? null);
      setResumo((data as { resumo?: string })?.resumo ?? '');
      setSelected(new Set(list.map((_, i) => i)));
      if (!silent) toast.success('Análise concluída.');
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : 'Erro ao analisar seu progresso.');
    } finally {
      setLoading(false);
    }
  }, [plan.id]);

  // Analisa automaticamente ao abrir a aba, uma vez por plano.
  useEffect(() => {
    setSuggestions(null);
    setSignals(null);
    setSelected(new Set());
    void analyze(true);
  }, [analyze]);

  const toggle = (index: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const apply = async () => {
    if (!suggestions) return;
    const chosen = suggestions.filter((_, i) => selected.has(i));
    if (chosen.length === 0) return toast.error('Escolha pelo menos uma sugestão.');

    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-study-plan', {
        body: {
          mode: 'adjust',
          plan_id: plan.id,
          suggestions: chosen.map((s) => `${s.titulo}: ${s.instrucao || s.motivo}`),
          version_note: `Ajuste automático da Ella — ${chosen.map((s) => s.titulo).join(' | ')}`,
        },
      });
      if (error) throw new Error('Não foi possível falar com a assistente agora.');
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      toast.success(`Cronograma atualizado (v${(data as { version?: number })?.version ?? ''}). Mudanças salvas no histórico.`);
      setSuggestions(null);
      onApplied();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao aplicar as sugestões.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} /> Sugestões da Ella
          </h3>
          <Button
            variant="outline" size="sm" className="ml-auto h-11 gap-2"
            onClick={() => analyze()} disabled={loading || applying}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Analisar de novo
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {resumo || 'A Ella lê seu histórico de conclusão e progresso para propor ajustes no cronograma.'}
        </p>

        {signals && (
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ['Plano concluído', `${signals.pct}%`],
              ['Apostilas concluídas', String(signals.apostilasConcluidas)],
              ['Acerto em exercícios', `${signals.precisao}%`],
              ['Dias parado', String(signals.staleDays)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}

        {signals && signals.bySubject.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Conclusão por disciplina</p>
            {signals.bySubject.slice(0, 6).map((s) => (
              <div key={s.subject} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{s.subject}</span>
                  <span className="text-muted-foreground">{s.done}/{s.total}</span>
                </div>
                <Progress value={s.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {loading && !suggestions && (
        <p className="text-sm text-muted-foreground">Analisando seu histórico…</p>
      )}

      {suggestions?.length === 0 && !loading && (
        <Card className="p-4 text-sm text-muted-foreground">
          Nenhum ajuste necessário por enquanto. Continue seguindo o cronograma.
        </Card>
      )}

      {suggestions && suggestions.length > 0 && (
        <>
          {suggestions.map((s, i) => (
            <Card key={`${s.titulo}-${i}`} className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(i)}
                  onCheckedChange={() => toggle(i)}
                  aria-label={`Aplicar sugestão: ${s.titulo}`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Lightbulb className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                    <span className="text-sm font-semibold">{s.titulo}</span>
                    <Badge variant="outline" className={IMPACT_CLASS[s.impacto]}>{ACTION_LABEL[s.acao]}</Badge>
                    {s.disciplina && <Badge variant="secondary">{s.disciplina}</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.motivo}</p>
                  {s.instrucao && (
                    <p className="mt-1 text-xs text-muted-foreground">Ajuste: {s.instrucao}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <Button className="h-11 w-full gap-2 sm:w-auto" onClick={apply} disabled={applying || loading}>
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Aplicar {selected.size} sugestão{selected.size === 1 ? '' : 'ões'} ao cronograma
          </Button>
          <p className="text-xs text-muted-foreground">
            A versão atual do plano é guardada no histórico antes de qualquer mudança.
          </p>
        </>
      )}
    </div>
  );
}
