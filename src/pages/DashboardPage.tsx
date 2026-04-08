import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, XCircle, Target, TrendingUp, FileText, Clock, FolderOpen } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [stats, setStats] = useState({ total: 0, hits: 0, errors: 0, byApostila: {} as Record<string, { hits: number; errors: number; title: string }> });
  const [viewMode, setViewMode] = useState<'topic' | 'all'>('topic');
  const [selectedApostila, setSelectedApostila] = useState<Apostila | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: ap } = await supabase.from('apostilas').select('*').eq('published', true).order('created_at', { ascending: false });
    setApostilas(ap || []);

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

  // Group by category
  const grouped = apostilas.reduce((acc, a) => {
    const cat = a.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, Apostila[]>);

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-6 sm:py-8 px-4 relative z-10">
        {/* Content Section */}
        <Card className="glass p-5 sm:p-6 mb-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Conteúdo</p>
            <h2 className="text-lg sm:text-xl font-bold">Apostilas</h2>
          </div>
          <div className="flex gap-2 mb-5">
            <Button
              size="sm"
              variant={viewMode === 'topic' ? 'default' : 'ghost'}
              onClick={() => setViewMode('topic')}
              className="text-xs"
            >
              Por Tópico
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'default' : 'ghost'}
              onClick={() => setViewMode('all')}
              className="text-xs"
            >
              Todas
            </Button>
          </div>

          {viewMode === 'topic' ? (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">{category}</span>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedApostila(a)}
                        className="w-full text-left glass rounded-xl p-4 hover-lift transition-all"
                      >
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {apostilas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma apostila disponível.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {apostilas.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedApostila(a)}
                  className="w-full text-left glass rounded-xl p-4 hover-lift transition-all"
                >
                  <h3 className="font-semibold text-sm">{a.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.category} · {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Reading Panel */}
        {selectedApostila && (
          <Card className="glass p-5 sm:p-6 mb-6 animate-fade-up">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Leitura</p>
              <h2 className="text-lg sm:text-xl font-bold">{selectedApostila.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedApostila.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap mb-4">
              {selectedApostila.content}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate(`/apostila/${selectedApostila.id}`)}>
                Abrir completa
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/exercises/${selectedApostila.id}`)}>
                Exercícios
              </Button>
            </div>
          </Card>
        )}

        {/* Stats */}
        {stats.total > 0 && (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
              {[
                { icon: FileText, label: 'Apostilas', value: apostilas.length, color: 'text-primary' },
                { icon: CheckCircle, label: 'Acertos', value: stats.hits, color: 'text-success' },
                { icon: XCircle, label: 'Erros', value: stats.errors, color: 'text-destructive' },
                { icon: Target, label: 'Aproveitamento', value: `${pct}%`, color: 'text-primary' },
              ].map(s => (
                <Card key={s.label} className="glass p-3 sm:p-4">
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

            {Object.keys(stats.byApostila).length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Desempenho por Apostila
                </h2>
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
          </>
        )}
      </main>
    </div>
  );
}
