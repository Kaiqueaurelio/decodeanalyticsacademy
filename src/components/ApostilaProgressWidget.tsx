import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface ApostilaProgress {
  title: string;
  hits: number;
  errors: number;
}

interface Props {
  data: Record<string, ApostilaProgress>;
  exerciseCounts: Record<string, number>;
}

export function ApostilaProgressWidget({ data, exerciseCounts }: Props) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <Card className="p-5 hover-lift">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary" /> Progresso por Apostila
        </h3>
        <p className="text-xs text-muted-foreground text-center py-6">Responda exercícios para acompanhar seu progresso</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 hover-lift">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <BookOpen className="h-4 w-4 text-primary" /> Progresso por Apostila
      </h3>
      <div className="space-y-4">
        {entries.slice(0, 6).map(([id, s], idx) => {
          const totalAnswered = s.hits + s.errors;
          const totalExercises = exerciseCounts[id] || totalAnswered;
          const completionPct = totalExercises > 0 ? Math.round((totalAnswered / totalExercises) * 100) : 0;
          const accuracyPct = totalAnswered > 0 ? Math.round((s.hits / totalAnswered) * 100) : 0;

          return (
            <div key={id} className="animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium truncate flex-1 mr-2">{s.title}</p>
                <span className="text-[11px] font-bold text-primary shrink-0">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-1.5 mb-2" />
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" /> {s.hits} acertos
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" /> {s.errors} erros
                </span>
                <span className="ml-auto font-medium">{accuracyPct}% precisão</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
