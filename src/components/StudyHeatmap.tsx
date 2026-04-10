import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from 'lucide-react';

export function StudyHeatmap() {
  const { user } = useAuth();
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 27);

    supabase
      .from('answers')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(({ data }) => {
        const map: Record<string, number> = {};
        data?.forEach(a => {
          const key = new Date(a.created_at).toISOString().split('T')[0];
          map[key] = (map[key] || 0) + 1;
        });
        setActivityMap(map);
      });
  }, [user]);

  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 27 + i);
    return d.toISOString().split('T')[0];
  });

  const maxActivity = Math.max(1, ...Object.values(activityMap));

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    const ratio = count / maxActivity;
    if (ratio <= 0.25) return 'bg-primary/20';
    if (ratio <= 0.5) return 'bg-primary/40';
    if (ratio <= 0.75) return 'bg-primary/60';
    return 'bg-primary';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" /> Atividade (28 dias)
      </h3>
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => (
            <div key={i} className="text-[9px] text-muted-foreground text-center font-medium">{d}</div>
          ))}
          {days.map(day => {
            const count = activityMap[day] || 0;
            return (
              <Tooltip key={day}>
                <TooltipTrigger asChild>
                  <div
                    className={`aspect-square rounded-sm ${getIntensity(count)} smooth-all hover:ring-1 hover:ring-primary/50 cursor-default`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>{formatDate(day)}: {count} {count === 1 ? 'exercício' : 'exercícios'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[9px] text-muted-foreground">Menos</span>
        {['bg-muted/50', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary'].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground">Mais</span>
      </div>
    </Card>
  );
}
