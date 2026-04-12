import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

interface CategoryData {
  name: string;
  hits: number;
  errors: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(260, 55%, 55%)',
  'hsl(280, 65%, 55%)',
  'hsl(200, 60%, 50%)',
  'hsl(340, 60%, 50%)',
  'hsl(160, 50%, 45%)',
];

export function CategoryPerformanceChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return null;

  const chartData = data.map(d => ({
    name: d.name.length > 20 ? d.name.slice(0, 18) + '...' : d.name,
    value: d.hits + d.errors,
    hits: d.hits,
    errors: d.errors,
    pct: d.hits + d.errors > 0 ? Math.round((d.hits / (d.hits + d.errors)) * 100) : 0,
  }));

  const totalHits = data.reduce((s, d) => s + d.hits, 0);
  const totalErrors = data.reduce((s, d) => s + d.errors, 0);
  const totalPct = totalHits + totalErrors > 0 ? Math.round((totalHits / (totalHits + totalErrors)) * 100) : 0;

  return (
    <Card className="p-5 hover-lift">
      <h3 className="text-xs font-semibold mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" /> Desempenho por Apostila
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs">
                      <p className="font-semibold mb-1">{d.name}</p>
                      <p className="text-success">{d.hits} acertos</p>
                      <p className="text-destructive">{d.errors} erros</p>
                      <p className="font-bold mt-1">{d.pct}% precisão</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold">{totalPct}%</p>
              <p className="text-[9px] text-muted-foreground">geral</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {chartData.slice(0, 5).map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[11px] truncate flex-1">{d.name}</span>
              <span className="text-[11px] font-bold">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
