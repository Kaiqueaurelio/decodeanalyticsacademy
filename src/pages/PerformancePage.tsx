/**
 * PerformancePage — Painel de desempenho do aluno.
 *
 * Reúne num único lugar:
 *  - KPIs (acertos, erros, aproveitamento, sequência, XP, nível)
 *  - Meta semanal (Pomodoros)
 *  - Gráfico de evolução temporal
 *  - Desempenho por grupo canônico (Programação/Redes/IA/Segurança/Cloud/Outros)
 *  - Heatmap de estudos (últimos 90 dias)
 *  - Tabela detalhada acertos/erros por apostila
 *  - Ranking entre alunos
 *
 * Os dados vêm das mesmas fontes do dashboard (tabelas answers, exercises,
 * pomodoro_sessions, study_streaks) — esta página apenas reorganiza para
 * análise focada de progresso.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { EvolutionChart } from '@/components/EvolutionChart';
import { CategoryPerformanceChart } from '@/components/CategoryPerformanceChart';
import { Leaderboard } from '@/components/Leaderboard';
import { WeeklyGoalWidget } from '@/components/WeeklyGoalWidget';
import { StudyHeatmap } from '@/components/StudyHeatmap';
import { Reveal } from '@/components/Reveal';
import {
  CANONICAL_GROUPS,
  GROUP_META,
  getCanonicalGroup,
  type CanonicalGroup,
} from '@/lib/subjectGroups';
import {
  CheckCircle, XCircle, Percent, Flame, Trophy, Target,
  TrendingUp, BookOpen, ArrowLeft, Award, Zap, ChevronRight,
} from 'lucide-react';

interface ApostilaStat {
  apostila_id: string;
  title: string;
  category: string | null;
  group: CanonicalGroup;
  hits: number;
  errors: number;
  total: number;
  totalExercises: number;
  accuracy: number;
  progress: number;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const gamification = useGamification();
  const [loading, setLoading] = useState(true);
  const [perApostila, setPerApostila] = useState<ApostilaStat[]>([]);
  const [stats, setStats] = useState({ hits: 0, errors: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: apostilas }, { data: exercises }, { data: answers }] = await Promise.all([
      supabase.from('apostilas').select('id, title, category').eq('published', true),
      supabase.from('exercises').select('id, apostila_id'),
      supabase.from('answers').select('exercise_id, is_correct').eq('user_id', user!.id),
    ]);

    const exByApostila: Record<string, string[]> = {};
    const apIdByExercise: Record<string, string> = {};
    (exercises || []).forEach((e) => {
      apIdByExercise[e.id] = e.apostila_id;
      if (!exByApostila[e.apostila_id]) exByApostila[e.apostila_id] = [];
      exByApostila[e.apostila_id].push(e.id);
    });

    const byApostila: Record<string, { hits: number; errors: number; answered: Set<string> }> = {};
    let hits = 0;
    let errors = 0;
    (answers || []).forEach((a) => {
      const apId = apIdByExercise[a.exercise_id];
      if (!apId) return;
      if (!byApostila[apId]) byApostila[apId] = { hits: 0, errors: 0, answered: new Set() };
      byApostila[apId].answered.add(a.exercise_id);
      if (a.is_correct) {
        byApostila[apId].hits++;
        hits++;
      } else {
        byApostila[apId].errors++;
        errors++;
      }
    });

    const rows: ApostilaStat[] = (apostilas || []).map((ap) => {
      const st = byApostila[ap.id] || { hits: 0, errors: 0, answered: new Set() };
      const total = st.hits + st.errors;
      const totalEx = exByApostila[ap.id]?.length || 0;
      return {
        apostila_id: ap.id,
        title: ap.title,
        category: ap.category,
        group: getCanonicalGroup(ap.category, ap.title),
        hits: st.hits,
        errors: st.errors,
        total,
        totalExercises: totalEx,
        accuracy: total > 0 ? Math.round((st.hits / total) * 100) : 0,
        progress: totalEx > 0 ? Math.round((st.answered.size / totalEx) * 100) : 0,
      };
    });

    // Ordena: com atividade primeiro, mais alto aproveitamento depois
    rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.accuracy - a.accuracy;
    });

    setPerApostila(rows);
    setStats({ hits, errors, total: hits + errors });
    setLoading(false);
  };

  const overallAccuracy = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;

  // Stats por grupo canônico
  const byGroup = useMemo(() => {
    const acc: Record<CanonicalGroup, { hits: number; errors: number; total: number; accuracy: number }> = {
      Programação: { hits: 0, errors: 0, total: 0, accuracy: 0 },
      Redes: { hits: 0, errors: 0, total: 0, accuracy: 0 },
      IA: { hits: 0, errors: 0, total: 0, accuracy: 0 },
      Segurança: { hits: 0, errors: 0, total: 0, accuracy: 0 },
      Cloud: { hits: 0, errors: 0, total: 0, accuracy: 0 },
      Outros: { hits: 0, errors: 0, total: 0, accuracy: 0 },
    };
    perApostila.forEach((r) => {
      acc[r.group].hits += r.hits;
      acc[r.group].errors += r.errors;
      acc[r.group].total += r.total;
    });
    for (const g of CANONICAL_GROUPS) {
      const t = acc[g].total;
      acc[g].accuracy = t > 0 ? Math.round((acc[g].hits / t) * 100) : 0;
    }
    return acc;
  }, [perApostila]);

  // Pontos fortes / fracos
  const strongestGroup = useMemo(() => {
    const withData = CANONICAL_GROUPS.filter((g) => byGroup[g].total >= 3);
    if (withData.length === 0) return null;
    return withData.reduce((a, b) => (byGroup[a].accuracy >= byGroup[b].accuracy ? a : b));
  }, [byGroup]);
  const weakestGroup = useMemo(() => {
    const withData = CANONICAL_GROUPS.filter((g) => byGroup[g].total >= 3);
    if (withData.length === 0) return null;
    return withData.reduce((a, b) => (byGroup[a].accuracy <= byGroup[b].accuracy ? a : b));
  }, [byGroup]);

  const categoryChartData = perApostila
    .filter((r) => r.total > 0)
    .slice(0, 8)
    .map((r) => ({ name: r.title, hits: r.hits, errors: r.errors }));

  const kpiCards = [
    { icon: CheckCircle, label: 'Acertos', value: stats.hits, color: 'text-success', bg: 'bg-success/10' },
    { icon: XCircle, label: 'Erros', value: stats.errors, color: 'text-destructive', bg: 'bg-destructive/10' },
    { icon: Percent, label: 'Aproveitamento', value: overallAccuracy, suffix: '%', color: 'text-warning', bg: 'bg-warning/10' },
    { icon: Flame, label: 'Sequência', value: gamification.streak?.current_streak || 0, suffix: 'd', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Zap, label: 'XP total', value: gamification.xp?.xp_points || 0, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Award, label: 'Nível', value: gamification.xp?.level || 1, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Watermark />
      <AppHeader />

      <main className="container py-6 sm:py-8 px-4 sm:px-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              Painel de Desempenho
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Acompanhe sua evolução, acertos, erros e ranking.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {kpiCards.map((k) => (
              <Card key={k.label} className="p-3 flex flex-col items-center text-center">
                <div className={`h-9 w-9 rounded-lg ${k.bg} ${k.color} flex items-center justify-center mb-1.5`}>
                  <k.icon className="h-4 w-4" />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color} tabular-nums`}>
                  <AnimatedCounter value={k.value} />
                  {k.suffix && <span className="text-xs ml-0.5">{k.suffix}</span>}
                </p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* Insights */}
        {(strongestGroup || weakestGroup) && (
          <Reveal>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {strongestGroup && (
                <Card className="p-4 border-success/30 bg-success/5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/15 text-success flex items-center justify-center text-xl">
                      {GROUP_META[strongestGroup].icon}
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="text-[10px] mb-1 border-success/40 text-success">Ponto forte</Badge>
                      <p className="text-sm font-semibold">{strongestGroup}</p>
                      <p className="text-xs text-muted-foreground">
                        {byGroup[strongestGroup].accuracy}% de acerto · {byGroup[strongestGroup].total} questões
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {weakestGroup && weakestGroup !== strongestGroup && (
                <Card className="p-4 border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center text-xl">
                      {GROUP_META[weakestGroup].icon}
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="text-[10px] mb-1 border-destructive/40 text-destructive">Foco recomendado</Badge>
                      <p className="text-sm font-semibold">{weakestGroup}</p>
                      <p className="text-xs text-muted-foreground">
                        {byGroup[weakestGroup].accuracy}% de acerto · revise para melhorar
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Reveal>
        )}

        {/* Meta semanal + Ranking lado a lado */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <Reveal from="left"><WeeklyGoalWidget /></Reveal>
          <Reveal from="right"><Leaderboard /></Reveal>
        </div>

        {/* Evolução temporal */}
        <Reveal>
          <div className="mb-6">
            <EvolutionChart />
          </div>
        </Reveal>

        {/* Desempenho por grupo canônico */}
        <Reveal>
          <Card className="p-5 mb-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Desempenho por área
            </h2>
            <div className="space-y-3">
              {CANONICAL_GROUPS.map((g) => {
                const meta = GROUP_META[g];
                const data = byGroup[g];
                if (data.total === 0) return null;
                return (
                  <div key={g} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${meta.color.replace('hsl(', 'hsla(').replace(')', ', 0.15)')}` }}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: meta.color }}>{g}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          <span className="text-success">{data.hits}</span>
                          {' / '}
                          <span className="text-destructive">{data.errors}</span>
                          {' · '}
                          <strong className="text-foreground">{data.accuracy}%</strong>
                        </span>
                      </div>
                      <Progress value={data.accuracy} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
              {CANONICAL_GROUPS.every((g) => byGroup[g].total === 0) && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Responda alguns exercícios para ver seu desempenho por área.
                </p>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Top apostilas - gráfico */}
        {categoryChartData.length > 0 && (
          <Reveal>
            <div className="mb-6">
              <CategoryPerformanceChart data={categoryChartData} />
            </div>
          </Reveal>
        )}

        {/* Tabela detalhada */}
        <Reveal>
          <Card className="p-5 mb-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Acertos e erros por apostila
            </h2>
            {perApostila.filter((r) => r.total > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Você ainda não respondeu exercícios. Comece estudando uma apostila!
              </p>
            ) : (
              <ScrollArea className="h-[400px] -mx-2">
                <div className="space-y-1 px-2">
                  {perApostila
                    .filter((r) => r.total > 0)
                    .map((r) => {
                      const meta = GROUP_META[r.group];
                      return (
                        <button
                          key={r.apostila_id}
                          onClick={() => navigate(`/apostila/${r.apostila_id}`)}
                          className="w-full p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/40 transition-all text-left flex items-center gap-3"
                        >
                          <div className="h-9 w-9 rounded-md flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: `${meta.color.replace('hsl(', 'hsla(').replace(')', ', 0.15)')}` }}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{r.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                              <span>{r.category || 'Geral'}</span>
                              <span>·</span>
                              <span className="text-success">✓ {r.hits}</span>
                              <span className="text-destructive">✗ {r.errors}</span>
                              <span>·</span>
                              <span>progresso {r.progress}%</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            <span className={`text-base font-bold tabular-nums ${
                              r.accuracy >= 70 ? 'text-success' : r.accuracy >= 50 ? 'text-warning' : 'text-destructive'
                            }`}>{r.accuracy}%</span>
                            <span className="text-[10px] text-muted-foreground">{r.total} resp.</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                </div>
              </ScrollArea>
            )}
          </Card>
        </Reveal>

        {/* Heatmap */}
        <Reveal>
          <div className="mb-6">
            <StudyHeatmap />
          </div>
        </Reveal>

        {loading && (
          <div className="text-center text-xs text-muted-foreground py-2">Carregando dados…</div>
        )}
      </main>
    </div>
  );
}
