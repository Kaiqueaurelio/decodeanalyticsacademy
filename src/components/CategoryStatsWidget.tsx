import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSubjectColor } from '@/lib/subject-colors';
import { BarChart3, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ApostilaStat {
  hits: number;
  errors: number;
  title: string;
}

interface CategoryStatsWidgetProps {
  apostilas: { id: string; category: string; title: string }[];
  byApostila: Record<string, ApostilaStat>;
  exerciseCounts: Record<string, number>;
}

interface CategoryAgg {
  name: string;
  hits: number;
  errors: number;
  total: number;
  pct: number;
  totalExercises: number;
  answered: number;
  color: string;
}

export function CategoryStatsWidget({ apostilas, byApostila, exerciseCounts }: CategoryStatsWidgetProps) {
  const categories = useMemo<CategoryAgg[]>(() => {
    const map: Record<string, CategoryAgg> = {};

    apostilas.forEach(a => {
      const cat = a.category || 'Geral';
      if (!map[cat]) {
        map[cat] = { name: cat, hits: 0, errors: 0, total: 0, pct: 0, totalExercises: 0, answered: 0, color: getSubjectColor(cat) };
      }
      map[cat].totalExercises += exerciseCounts[a.id] || 0;

      const st = byApostila[a.id];
      if (st) {
        map[cat].hits += st.hits;
        map[cat].errors += st.errors;
        map[cat].total += st.hits + st.errors;
        map[cat].answered += st.hits + st.errors;
      }
    });

    return Object.values(map)
      .map(c => ({ ...c, pct: c.total > 0 ? Math.round((c.hits / c.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [apostilas, byApostila, exerciseCounts]);

  const categoriesWithData = categories.filter(c => c.total > 0);

  if (categoriesWithData.length === 0) {
    return (
      <Card className="p-5 hover-lift">
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Desempenho por Categoria
        </h3>
        <p className="text-xs text-muted-foreground text-center py-6">
          Responda exercícios para ver suas estatísticas por disciplina.
        </p>
      </Card>
    );
  }

  const best = categoriesWithData.reduce((a, b) => a.pct > b.pct ? a : b);
  const worst = categoriesWithData.reduce((a, b) => a.pct < b.pct ? a : b);

  const chartData = categoriesWithData.slice(0, 8).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 10) + '…' : c.name,
    fullName: c.name,
    acertos: c.pct,
    color: c.color,
  }));

  return (
    <Card className="p-5 hover-lift">
      <h3 className="text-xs font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" /> Desempenho por Categoria
      </h3>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="mb-5">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
                      <p className="font-semibold">{d.fullName}</p>
                      <p className="text-primary font-bold">{d.acertos}% de acerto</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="acertos" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-3">
        {categoriesWithData.map((c, i) => {
          const TrendIcon = c.pct >= 70 ? TrendingUp : c.pct >= 40 ? Minus : TrendingDown;
          const trendColor = c.pct >= 70 ? 'text-success' : c.pct >= 40 ? 'text-warning' : 'text-destructive';

          return (
            <div key={c.name} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-xs font-medium truncate flex-1">{c.name}</span>
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                <span className="text-xs font-bold" style={{ color: c.color }}>{c.pct}%</span>
              </div>
              <Progress value={c.pct} className="h-1.5 mb-1" />
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-2.5 w-2.5 text-success" /> {c.hits} acertos
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-2.5 w-2.5 text-destructive" /> {c.errors} erros
                </span>
                <span>{c.answered}/{c.totalExercises} respondidos</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Best / Worst highlights */}
      {categoriesWithData.length >= 2 && (
        <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Melhor</p>
            <p className="text-xs font-semibold truncate">{best.name}</p>
            <p className="text-sm font-bold text-success">{best.pct}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Revisar</p>
            <p className="text-xs font-semibold truncate">{worst.name}</p>
            <p className="text-sm font-bold text-destructive">{worst.pct}%</p>
          </div>
        </div>
      )}
    </Card>
  );
}
