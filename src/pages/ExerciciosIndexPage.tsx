import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PenLine, Search, ChevronRight, Loader2 } from 'lucide-react';

type Row = {
  apostila_id: string;
  title: string;
  subject: string | null;
  count: number;
};

export default function ExerciciosIndexPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: exData } = await supabase
        .from('exercises')
        .select('apostila_id')
        .limit(5000);
      const ids = Array.from(new Set((exData ?? []).map((e: any) => e.apostila_id).filter(Boolean)));
      if (ids.length === 0) {
        if (!cancelled) { setRows([]); setLoading(false); }
        return;
      }
      const counts = new Map<string, number>();
      (exData ?? []).forEach((e: any) => counts.set(e.apostila_id, (counts.get(e.apostila_id) ?? 0) + 1));
      const { data: aps } = await supabase
        .from('apostilas')
        .select('id, title, subject, hidden')
        .in('id', ids);
      const out: Row[] = (aps ?? [])
        .filter((a: any) => !a.hidden)
        .map((a: any) => ({
          apostila_id: a.id,
          title: a.title,
          subject: a.subject ?? null,
          count: counts.get(a.id) ?? 0,
        }))
        .sort((a, b) => (a.subject || '').localeCompare(b.subject || '') || a.title.localeCompare(b.title));
      if (!cancelled) { setRows(out); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const filter = q.trim().toLowerCase();
    const filtered = filter
      ? rows.filter(r => r.title.toLowerCase().includes(filter) || (r.subject ?? '').toLowerCase().includes(filter))
      : rows;
    const map = new Map<string, Row[]>();
    filtered.forEach(r => {
      const key = r.subject || 'Outros';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [rows, q]);

  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-screen-lg px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <PenLine className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Exercícios</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Carregando…' : `${rows.length} apostilas · ${total} exercícios disponíveis`}
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar disciplina ou apostila…"
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Nenhum exercício disponível ainda.
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map(([subject, items]) => (
              <section key={subject}>
                <h2 className="mb-3 font-mono-label text-[11px] font-bold uppercase tracking-[0.25em] text-primary/80">
                  {subject}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map(r => (
                    <Card
                      key={r.apostila_id}
                      className="group flex items-center justify-between gap-3 p-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-[0_0_24px_-12px_hsl(var(--primary)/0.5)]"
                      onClick={() => navigate(`/exercises/${r.apostila_id}`)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground">{r.count} {r.count === 1 ? 'questão' : 'questões'}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 group-hover:text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
