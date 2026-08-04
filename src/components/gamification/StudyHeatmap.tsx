import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapProps {
  data?: { date: string; count: number }[];
}

export function StudyHeatmap({ data = [] }: HeatmapProps) {
  // Gerar dados fictícios se não houver (para demonstração) ou processar reais
  const heatmapData = useMemo(() => {
    const days = 14 * 7; // 14 semanas
    const result = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = data.find(item => item.date === dateStr);
      
      result.push({
        date: dateStr,
        count: existing ? existing.count : (Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0),
        dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      });
    }
    return result;
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count < 2) return 'bg-primary/30';
    if (count < 4) return 'bg-primary/60';
    return 'bg-primary';
  };

  return (
    <Card className="p-4 border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Frequência de Estudos</h3>
          <p className="text-[10px] text-muted-foreground/60">Sua constância nos últimos 3 meses</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Menos</span>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-[2px] bg-muted/30" />
            <div className="h-2 w-2 rounded-[2px] bg-primary/30" />
            <div className="h-2 w-2 rounded-[2px] bg-primary/60" />
            <div className="h-2 w-2 rounded-[2px] bg-primary" />
          </div>
          <span className="text-[9px] text-muted-foreground">Mais</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
        <div className="grid grid-rows-7 gap-1 pr-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <span key={day} className="text-[8px] text-muted-foreground/40 h-2.5 flex items-center">{day}</span>
          ))}
        </div>
        
        <TooltipProvider delayDuration={0}>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {heatmapData.map((day, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div 
                    className={`h-2.5 w-2.5 rounded-[2px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer ${getColor(day.count)}`} 
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] py-1 px-2 border-primary/20 bg-background/95 backdrop-blur">
                  <span className="font-bold">{day.count} {day.count === 1 ? 'atividade' : 'atividades'}</span>
                  <span className="text-muted-foreground ml-1">em {day.formattedDate}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
}
