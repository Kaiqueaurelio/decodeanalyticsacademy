import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, XCircle, Target, TrendingUp, FileText } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;

const CATEGORIES = ['Redes', 'IA', 'Segurança', 'Cloud', 'Programação', 'Outros'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [stats, setStats] = useState({ total: 0, hits: 0, errors: 0, byApostila: {} as Record<string, { hits: number; errors: number; title: string }> });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: ap } = await supabase.from('apostilas').select('*').eq('published', true);
    setApostilas(ap || []);

    // Load stats
    const { data: answers } = await supabase.from('answers').select('*, exercises(apostila_id, apostilas:apostila_id(title))');
    if (answers) {
      const hits = answers.filter(a => a.is_correct).length;
      const errors = answers.filter(a => !a.is_correct).length;
      const byApostila: Record<string, { hits: number; errors: number; title: string }> = {};
      answers.forEach((a: any) => {
        const apId = a.exercises?.apostila_id;
        const apTitle = a.exercises?.apostilas?.title || 'Sem título';
        if (!apId) return;
        if (!byApostila[apId]) byApostila[apId] = { hits: 0, errors: 0, title: apTitle };
        if (a.is_correct) byApostila[apId].hits++;
        else byApostila[apId].errors++;
      });
      setStats({ total: answers.length, hits, errors, byApostila });
    }
  };

  const pct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const filtered = selectedCategory ? apostilas.filter(a => a.category === selectedCategory) : apostilas;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-6 sm:py-8 px-4 relative z-10">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          {[
            { icon: FileText, label: 'Apostilas', value: apostilas.length, color: 'text-primary' },
            { icon: CheckCircle, label: 'Acertos', value: stats.hits, color: 'text-success' },
            { icon: XCircle, label: 'Erros', value: stats.errors, color: 'text-destructive' },
            { icon: Target, label: 'Aproveitamento', value: `${pct}%`, color: 'text-primary' },
          ].map(s => (
            <Card key={s.label} className="glass p-3 sm:p-4 animate-fade-up">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-accent p-2 sm:p-2.5"><s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Performance by Apostila */}
        {Object.keys(stats.byApostila).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Desempenho por Apostila</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(stats.byApostila).map(([id, s]) => {
                const total = s.hits + s.errors;
                const p = total > 0 ? Math.round((s.hits / total) * 100) : 0;
                return (
                  <Card key={id} className="glass p-4">
                    <p className="font-medium text-sm mb-2 truncate">{s.title}</p>
                    <Progress value={p} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{s.hits} acertos / {s.errors} erros</span>
                      <span className="font-semibold text-foreground">{p}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Apostilas</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant={!selectedCategory ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>Todas</Button>
            {CATEGORIES.map(c => (
              <Button key={c} variant={selectedCategory === c ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(c)}>{c}</Button>
            ))}
          </div>
        </div>

        {/* Apostilas Grid */}
        {filtered.length === 0 ? (
          <Card className="glass p-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma apostila disponível{selectedCategory ? ` em "${selectedCategory}"` : ''}.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(a => (
              <Card key={a.id} className="glass p-5 hover-lift cursor-pointer animate-fade-up" onClick={() => navigate(`/apostila/${a.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium rounded-full bg-accent px-2.5 py-1 text-accent-foreground">{a.category}</span>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{a.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.content?.substring(0, 120)}...</p>
                <div className="mt-3 sm:mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={(e) => { e.stopPropagation(); navigate(`/apostila/${a.id}`); }}>Estudar</Button>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={(e) => { e.stopPropagation(); navigate(`/exercises/${a.id}`); }}>Exercícios</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
