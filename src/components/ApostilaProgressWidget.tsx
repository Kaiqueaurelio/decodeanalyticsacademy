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
      <Card className="p-4 bg-card border border-border/50">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-primary" /> Progresso por Apostila
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">Responda exercícios para ver o progresso</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border border-border/50">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" /> Progresso por Apostila
      </h3>
      <div className="space-y-3">
        {entries.slice(0, 6).map(([id, s]) => {
          const totalAnswered = s.hits + s.errors;
          const totalExercises = exerciseCounts[id] || totalAnswered;
          const completionPct = totalExercises > 0 ? Math.round((totalAnswered / totalExercises) * 100) : 0;
          const accuracyPct = totalAnswered > 0 ? Math.round((s.hits / totalAnswered) * 100) : 0;

          return (
            <div key={id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium truncate flex-1 mr-2">{s.title}</p>
                <span className="text-[10px] font-bold text-primary shrink-0">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-1.5 mb-1" />
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <CheckCircle className="h-2.5 w-2.5 text-success" /> {s.hits}
                </span>
                <span className="flex items-center gap-0.5">
                  <XCircle className="h-2.5 w-2.5 text-destructive" /> {s.errors}
                </span>
                <span className="ml-auto">{accuracyPct}% acerto</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
