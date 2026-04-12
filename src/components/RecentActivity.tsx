import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'correct' | 'incorrect';
  question: string;
  time: string;
}

export function RecentActivity() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('answers')
      .select('id, is_correct, created_at, exercises(question)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!data) return;
        setItems(data.map((a: any) => ({
          id: a.id,
          type: a.is_correct ? 'correct' : 'incorrect',
          question: a.exercises?.question?.slice(0, 60) || 'Exercício',
          time: formatRelative(a.created_at),
        })));
      });
  }, [user]);

  if (items.length === 0) return null;

  return (
    <Card className="p-5 hover-lift">
      <h3 className="text-xs font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" /> Atividade Recente
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className={`mt-0.5 rounded-lg p-1.5 ${item.type === 'correct' ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {item.type === 'correct'
                ? <CheckCircle className="h-3.5 w-3.5 text-success" />
                : <XCircle className="h-3.5 w-3.5 text-destructive" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.question}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5" /> {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
