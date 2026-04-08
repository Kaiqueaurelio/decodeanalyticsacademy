import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function EvolutionChart() {
  const { user } = useAuth();
  const [data, setData] = useState<{ date: string; acertos: number; erros: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('answers').select('created_at, is_correct').eq('user_id', user.id).order('created_at')
      .then(({ data: answers }) => {
        if (!answers) return;
        const byDate: Record<string, { acertos: number; erros: number }> = {};
        answers.forEach(a => {
          const date = new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (!byDate[date]) byDate[date] = { acertos: 0, erros: 0 };
          if (a.is_correct) byDate[date].acertos++;
          else byDate[date].erros++;
        });
        setData(Object.entries(byDate).map(([date, v]) => ({ date, ...v })));
      });
  }, [user]);

  if (data.length < 2) return null;

  return (
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Evolução
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={2}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={24} />
          <Tooltip contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="acertos" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          <Bar dataKey="erros" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
