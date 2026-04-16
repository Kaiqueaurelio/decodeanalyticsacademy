import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, CalendarDays, CalendarRange } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Period = 'week' | 'month';
type MetricKey = 'logins' | 'views' | 'downloads';

interface ActivityChartProps {
  delay?: number;
}

const METRICS: { key: MetricKey; label: string; color: string; gradientId: string }[] = [
  { key: 'logins', label: 'Logins', color: 'hsl(var(--primary))', gradientId: 'fillLogins' },
  { key: 'views', label: 'Visualizações', color: 'hsl(var(--accent))', gradientId: 'fillViews' },
  { key: 'downloads', label: 'Downloads', color: 'hsl(var(--success))', gradientId: 'fillDownloads' },
];

export function ActivityChart({ delay = 0.6 }: ActivityChartProps) {
  const [logs, setLogs] = useState<{ created_at: string; action: string }[]>([]);
  const [animate, setAnimate] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    logins: true,
    views: true,
    downloads: true,
  });

  const daysCount = period === 'week' ? 7 : 30;

  useEffect(() => {
    const fetchLogs = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29); // always fetch 30 days
      const { data } = await supabase
        .from('activity_logs')
        .select('created_at, action')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      setLogs(data || []);
      setTimeout(() => setAnimate(true), 300);
    };
    fetchLogs();
  }, []);

  const chartData = useMemo(() => {
    const days: Record<string, { logins: number; views: number; downloads: number }> = {};
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { logins: 0, views: 0, downloads: 0 };
    }
    logs.forEach(l => {
      const key = l.created_at.slice(0, 10);
      if (days[key]) {
        if (l.action === 'login') days[key].logins++;
        else if (l.action === 'view') days[key].views++;
        else if (l.action === 'download') days[key].downloads++;
      }
    });
    return Object.entries(days).map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      ...counts,
    }));
  }, [logs, daysCount]);

  // Summary totals
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        logins: acc.logins + d.logins,
        views: acc.views + d.views,
        downloads: acc.downloads + d.downloads,
      }),
      { logins: 0, views: 0, downloads: 0 }
    );
  }, [chartData]);

  const toggleMetric = useCallback((key: MetricKey) => {
    setVisibleMetrics(prev => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      // Don't allow hiding all metrics
      if (prev[key] && activeCount <= 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const chartConfig = {
    logins: { label: 'Logins', color: METRICS[0].color },
    views: { label: 'Visualizações', color: METRICS[1].color },
    downloads: { label: 'Downloads', color: METRICS[2].color },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Atividade
            </CardTitle>

            {/* Period toggle */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/30">
              <button
                onClick={() => setPeriod('week')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  period === 'week'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                7 dias
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  period === 'month'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarRange className="h-3 w-3" />
                30 dias
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Interactive legend */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {METRICS.map(metric => {
              const active = visibleMetrics[metric.key];
              const total = totals[metric.key];
              return (
                <button
                  key={metric.key}
                  onClick={() => toggleMetric(metric.key)}
                  className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
                    active
                      ? 'border-border/50 bg-secondary/30 hover:bg-secondary/50'
                      : 'border-border/20 bg-transparent opacity-40 hover:opacity-60'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
                    style={{ backgroundColor: metric.color, opacity: active ? 1 : 0.3 }}
                  />
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className={`font-bold tabular-nums ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                {METRICS.map(m => (
                  <linearGradient key={m.gradientId} id={m.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={m.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                interval={period === 'month' ? 4 : 0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                allowDecimals={false}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {METRICS.map((m, i) =>
                visibleMetrics[m.key] ? (
                  <Area
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    fill={`url(#${m.gradientId})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                    isAnimationActive={animate}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={i * 200}
                  />
                ) : null
              )}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
