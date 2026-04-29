/**
 * MistakesNotebookCard — "Caderno de erros".
 *
 * Lista os exercícios que o aluno errou recentemente, agrupados por apostila.
 * Estratégia: pega os últimos 100 answers com is_correct=false do usuário,
 * junta com a apostila do exercício, e oferece "Refazer" abrindo a página
 * de exercícios da apostila.
 *
 * Não cria nova tabela — usa as existentes (answers + exercises + apostilas).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookX, RotateCw, ChevronRight, Loader2 } from 'lucide-react';

interface Group {
  apostila_id: string;
  apostila_title: string;
  category: string | null;
  count: number;
  lastAt: string;
}

const PAGE_SIZE = 100;

export function MistakesNotebookCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }
    let active = true;

    (async () => {
      setLoading(true);
      try {
        // Wrong answers (last 100)
        const { data: wrong } = await supabase
          .from('answers')
          .select('exercise_id, created_at')
          .eq('user_id', user.id)
          .eq('is_correct', false)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (!wrong || wrong.length === 0) {
          if (active) setGroups([]);
          return;
        }

        const exerciseIds = Array.from(new Set(wrong.map(w => w.exercise_id).filter(Boolean)));
        const { data: exes } = await supabase
          .from('exercises')
          .select('id, apostila_id')
          .in('id', exerciseIds);

        const apostilaIds = Array.from(new Set((exes || []).map(e => e.apostila_id).filter(Boolean)));
        const { data: apostilas } = await supabase
          .from('apostilas')
          .select('id, title, category')
          .in('id', apostilaIds);

        const exMap = new Map((exes || []).map(e => [e.id, e.apostila_id]));
        const apMap = new Map((apostilas || []).map(a => [a.id, a]));

        const map = new Map<string, Group>();
        for (const w of wrong) {
          const aid = exMap.get(w.exercise_id);
          if (!aid) continue;
          const ap = apMap.get(aid);
          if (!ap) continue;
          const prev = map.get(aid);
          if (prev) {
            prev.count += 1;
            if (new Date(w.created_at) > new Date(prev.lastAt)) prev.lastAt = w.created_at;
          } else {
            map.set(aid, {
              apostila_id: aid,
              apostila_title: ap.title,
              category: ap.category,
              count: 1,
              lastAt: w.created_at,
            });
          }
        }
        const list = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
        if (active) setGroups(list);
      } catch (e) {
        console.warn('[MistakesNotebook] error', e);
        if (active) setGroups([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookX className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold">Caderno de erros</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
        </div>
      </Card>
    );
  }

  if (groups.length === 0) {
    // Hide silently — no point showing "0 mistakes" to a new user.
    return null;
  }

  const total = groups.reduce((s, g) => s + g.count, 0);

  return (
    <Card className="p-3 sm:p-4 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <BookX className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold">Caderno de erros</h3>
          <Badge variant="outline" className="h-5 text-[10px]">{total}</Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">Refaça e ganhe XP</span>
      </div>
      <div className="space-y-1">
        {groups.map(g => (
          <button
            key={g.apostila_id}
            onClick={() => navigate(`/exercises/${g.apostila_id}`)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
          >
            <span className="h-9 w-9 rounded-md bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
              <RotateCw className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{g.apostila_title}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {g.count} erro{g.count > 1 ? 's' : ''} · {g.category || 'Geral'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </Card>
  );
}
