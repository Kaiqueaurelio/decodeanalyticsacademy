import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, XCircle, Target, TrendingUp, Clock, FolderOpen, PenLine, ChevronRight, BarChart3 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, hits: 0, errors: 0, byApostila: {} as Record<string, { hits: number; errors: number; title: string }> });
  const [viewMode, setViewMode] = useState<'topic' | 'all'>('topic');
  const [selectedApostila, setSelectedApostila] = useState<Apostila | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: ap } = await supabase.from('apostilas').select('*').eq('published', true).order('category').order('created_at', { ascending: false });
    setApostilas(ap || []);

    // Count exercises per apostila
    const { data: exs } = await supabase.from('exercises').select('apostila_id');
    const counts: Record<string, number> = {};
    exs?.forEach(e => { counts[e.apostila_id] = (counts[e.apostila_id] || 0) + 1; });
    setExerciseCounts(counts);

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

        {/* Quick Stats Bar */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="glass p-3 text-center">
              <p className="text-xl font-bold text-primary">{apostilas.length}</p>
              <p className="text-[10px] text-muted-foreground">Apostilas</p>
            </Card>
            <Card className="glass p-3 text-center">
              <p className="text-xl font-bold text-success">{stats.hits}</p>
              <p className="text-[10px] text-muted-foreground">Acertos</p>
            </Card>
            <Card className="glass p-3 text-center">
              <p className="text-xl font-bold">{pct}%</p>
              <p className="text-[10px] text-muted-foreground">Aproveit.</p>
            </Card>
          </div>
        )}

        {/* Content Section */}
        <Card className="glass p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Conteúdo</p>
              <h2 className="text-lg sm:text-xl font-bold">Apostilas</h2>
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate('/admin')} className="text-xs">
                <BarChart3 className="mr-1 h-3.5 w-3.5" /> Admin
              </Button>
            )}
          </div>
          <div className="flex gap-2 mb-5">
            <Button size="sm" variant={viewMode === 'topic' ? 'default' : 'ghost'} onClick={() => setViewMode('topic')} className="text-xs">
              Por Tópico
            </Button>
            <Button size="sm" variant={viewMode === 'all' ? 'default' : 'ghost'} onClick={() => setViewMode('all')} className="text-xs">
              Todas
            </Button>
          </div>

          {viewMode === 'topic' ? (
            <div className="space-y-5">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">{category}</span>
                    <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map(a => {
                      const exCount = exerciseCounts[a.id] || 0;
                      const answered = stats.byApostila[a.id];
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelectedApostila(selectedApostila?.id === a.id ? null : a)}
                          className={`w-full text-left glass rounded-xl p-4 hover-lift transition-all ${selectedApostila?.id === a.id ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {exCount > 0 && (
                                  <span className="text-[10px] text-primary flex items-center gap-0.5">
                                    <PenLine className="h-3 w-3" /> {exCount} exercícios
                                  </span>
                                )}
                                {answered && (
                                  <span className="text-[10px] text-success flex items-center gap-0.5">
                                    <CheckCircle className="h-3 w-3" /> {Math.round((answered.hits / (answered.hits + answered.errors)) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedApostila?.id === a.id ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                      );
                    })}
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
              {apostilas.map(a => {
                const exCount = exerciseCounts[a.id] || 0;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedApostila(selectedApostila?.id === a.id ? null : a)}
                    className={`w-full text-left glass rounded-xl p-4 hover-lift transition-all ${selectedApostila?.id === a.id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.category} · {exCount} exercícios</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedApostila?.id === a.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Expanded Reading Panel */}
        {selectedApostila && (
          <Card className="glass p-5 sm:p-6 mb-6 animate-fade-up">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px]">{selectedApostila.category}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(selectedApostila.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold">{selectedApostila.title}</h2>
            </div>
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap mb-5 max-h-[400px] overflow-y-auto">
              {selectedApostila.content}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate(`/apostila/${selectedApostila.id}`)} className="gradient-primary text-primary-foreground">
                <BookOpen className="mr-1.5 h-4 w-4" /> Ler completa
              </Button>
              {(exerciseCounts[selectedApostila.id] || 0) > 0 && (
                <Button size="sm" variant="outline" onClick={() => navigate(`/exercises/${selectedApostila.id}`)}>
                  <PenLine className="mr-1.5 h-4 w-4" /> Exercícios ({exerciseCounts[selectedApostila.id]})
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Performance Section */}
        {stats.total > 0 && Object.keys(stats.byApostila).length > 0 && (
          <Card className="glass p-5 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Meu Desempenho
            </h2>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Aproveitamento geral</span>
              <span className="text-sm font-bold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 mb-4" />

            <div className="space-y-3">
              {Object.entries(stats.byApostila).map(([id, s]) => {
                const total = s.hits + s.errors;
                const p = total > 0 ? Math.round((s.hits / total) * 100) : 0;
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium truncate flex-1">{s.title}</p>
                      <span className="text-xs font-bold ml-2">{p}%</span>
                    </div>
                    <Progress value={p} className="h-1.5" />
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><CheckCircle className="h-3 w-3 text-success" /> {s.hits}</span>
                      <span className="flex items-center gap-0.5"><XCircle className="h-3 w-3 text-destructive" /> {s.errors}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
