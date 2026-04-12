import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Exam {
  id: string;
  title: string;
  date: string;
}

export function ExamCalendarWidget() {
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('decode_exams');
    return saved ? JSON.parse(saved) : [];
  });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const save = (list: Exam[]) => {
    setExams(list);
    localStorage.setItem('decode_exams', JSON.stringify(list));
  };

  const addExam = () => {
    if (!newTitle.trim() || !newDate) return;
    save([...exams, { id: crypto.randomUUID(), title: newTitle.trim(), date: newDate }]);
    setNewTitle('');
    setNewDate('');
    setAdding(false);
  };

  const removeExam = (id: string) => save(exams.filter(e => e.id !== id));

  const sorted = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="p-4 bg-card border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Próximas Provas
        </h3>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAdding(!adding)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {adding && (
        <div className="space-y-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border/30">
          <Input
            placeholder="Nome da prova"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" className="w-full h-7 text-xs" onClick={addExam}>Adicionar</Button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma prova agendada</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(exam => {
            const examDate = new Date(exam.date + 'T23:59:59');
            const days = differenceInDays(examDate, new Date());
            const past = isPast(examDate);
            return (
              <div
                key={exam.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                  past ? 'border-border/20 bg-muted/30 opacity-60' :
                  days <= 3 ? 'border-destructive/30 bg-destructive/5' :
                  days <= 7 ? 'border-warning/30 bg-warning/5' :
                  'border-border/30 bg-background'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{exam.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(exam.date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!past && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      days <= 3 ? 'bg-destructive/10 text-destructive' :
                      days <= 7 ? 'bg-warning/10 text-warning' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <Clock className="h-2.5 w-2.5" />
                      {days === 0 ? 'Hoje!' : `${days}d`}
                    </span>
                  )}
                  {past && <span className="text-[10px] text-muted-foreground">Passou</span>}
                  <button onClick={() => removeExam(exam.id)} className="p-1 rounded hover:bg-muted transition-colors">
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
