import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityChartProps {
  delay?: number;
}

export function ActivityChart({ delay = 0.6 }: ActivityChartProps) {
  const [logs, setLogs] = useState<{ created_at: string; action: string }[]>([]);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      const { data } = await supabase
        .from('activity_logs')
        .select('created_at, action')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      setLogs(data || []);
      // trigger draw-on animation after data loads
      setTimeout(() => setAnimate(true), 300);
    };
    fetchLogs();
  }, []);

  const chartData = useMemo(() => {
    const days: Record<string, { logins: number; views: number; downloads: number }> = {};
    for (let i = 13; i >= 0; i--) {
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
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      ...counts,
    }));
  }, [logs]);

  const chartConfig = {
    logins: { label: 'Logins', color: 'hsl(var(--primary))' },
    views: { label: 'Visualizações', color: 'hsl(var(--accent-foreground))' },
    downloads: { label: 'Downloads', color: 'hsl(142 76% 36%)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Atividade Recente (14 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="fillLogins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent-foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="logins"
                stroke="hsl(var(--primary))"
                fill="url(#fillLogins)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={animate}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--accent-foreground))"
                fill="url(#fillViews)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={animate}
                animationDuration={1500}
                animationEasing="ease-out"
                animationBegin={300}
              />
              <Area
                type="monotone"
                dataKey="downloads"
                stroke="hsl(142 76% 36%)"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                isAnimationActive={animate}
                animationDuration={1500}
                animationEasing="ease-out"
                animationBegin={600}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
