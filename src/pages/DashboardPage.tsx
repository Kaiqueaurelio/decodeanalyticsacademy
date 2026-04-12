import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GamificationWidget } from '@/components/GamificationWidget';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { FlashcardsWidget } from '@/components/FlashcardsWidget';
import { Leaderboard } from '@/components/Leaderboard';
import { EvolutionChart } from '@/components/EvolutionChart';
import { GlobalSearch } from '@/components/GlobalSearch';
import { OnboardingTour } from '@/components/OnboardingTour';
import { StudyHeatmap } from '@/components/StudyHeatmap';
import { CategoryPerformanceChart } from '@/components/CategoryPerformanceChart';
import { RecentActivity } from '@/components/RecentActivity';
import { WeeklyGoalWidget } from '@/components/WeeklyGoalWidget';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ExamCalendarWidget } from '@/components/ExamCalendarWidget';
import { FlashcardSummaryWidget } from '@/components/FlashcardSummaryWidget';
import { ApostilaProgressWidget } from '@/components/ApostilaProgressWidget';
import { MobileCarousel } from '@/components/MobileCarousel';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  BookOpen, CheckCircle, XCircle, TrendingUp, FolderOpen, PenLine,
  ChevronRight, BarChart3, User, FileText, Zap, Target, Percent
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Apostila = Tables<'apostilas'>;

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const gamification = useGamification();
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, hits: 0, errors: 0, byApostila: {} as Record<string, { hits: number; errors: number; title: string }> });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
    const seen = localStorage.getItem('decode_onboarding_done');
    if (!seen) setShowOnboarding(true);
    gamification.updateStreak();
    gamification.checkAndAwardBadge('first_login');
  }, [user]);

  const loadData = async () => {
    const { data: ap } = await supabase.from('apostilas').select('*').eq('published', true).order('category').order('created_at', { ascending: false });
    setApostilas(ap || []);

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

  const handleOnboardingComplete = () => {
    localStorage.setItem('decode_onboarding_done', 'true');
    setShowOnboarding(false);
  };

  const handlePomodoroComplete = async () => {
    if (!user) return;
    await supabase.from('pomodoro_sessions').insert({ user_id: user.id, duration: 25, completed: true });
    gamification.addXP(15);
  };

  const pct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const grouped = apostilas.reduce((acc, a) => {
    const cat = a.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, Apostila[]>);

  const earnedBadges = gamification.badges
    .filter(b => gamification.earnedBadgeIds.includes(b.id))
    .map(b => ({ icon: b.icon, name: b.name }));

  const categoryData = Object.entries(stats.byApostila).map(([, s]) => ({
    name: s.title,
    hits: s.hits,
    errors: s.errors,
  }));

  const totalExercises = Object.values(exerciseCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <main className="container py-6 px-4 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-content-show">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Seu painel de estudos</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/profile')} className="text-xs gap-1.5">
              <User className="h-3.5 w-3.5" /> Perfil
            </Button>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate('/admin')} className="text-xs gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Admin
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 animate-content-show">
          <GlobalSearch />
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-content-show delay-1">
          <Card className="p-4 bg-card border border-border/50 hover-lift">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold"><AnimatedCounter end={apostilas.length} /></p>
                <p className="text-[10px] text-muted-foreground">Apostilas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border border-border/50 hover-lift">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2.5">
                <PenLine className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold"><AnimatedCounter end={totalExercises} /></p>
                <p className="text-[10px] text-muted-foreground">Exercícios</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border border-border/50 hover-lift">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold"><AnimatedCounter end={stats.hits} /></p>
                <p className="text-[10px] text-muted-foreground">Acertos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border border-border/50 hover-lift">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5">
                <Percent className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold"><AnimatedCounter end={pct} suffix="%" /></p>
                <p className="text-[10px] text-muted-foreground">Aproveit.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid: Left (2/3) + Right Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Gamification + Pomodoro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-content-show delay-1">
              <GamificationWidget
                xpPoints={gamification.xp.xp_points}
                level={gamification.xp.level}
                currentStreak={gamification.streak.current_streak}
                longestStreak={gamification.streak.longest_streak}
                xpForNext={gamification.xpForNextLevel(gamification.xp.level)}
                earnedBadges={earnedBadges}
              />
              <div className="space-y-3">
                <PomodoroTimer onComplete={handlePomodoroComplete} />
                <FlashcardsWidget />
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-content-show delay-2">
              <EvolutionChart />
              <CategoryPerformanceChart data={categoryData} />
            </div>

            {/* Apostilas by Category */}
            <div className="space-y-4 animate-content-show delay-2">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">{category}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map(a => {
                      const exCount = exerciseCounts[a.id] || 0;
                      const answered = stats.byApostila[a.id];
                      const isExpanded = expandedId === a.id;
                      return (
                        <div key={a.id}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : a.id)}
                            className={`w-full text-left bg-card rounded-xl p-4 border smooth-all ${isExpanded ? 'border-primary/30 shadow-md' : 'border-border/40 hover:border-border hover:shadow-sm'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm truncate">{a.title}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                  {exCount > 0 && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <PenLine className="h-3 w-3" /> {exCount} exercícios
                                    </span>
                                  )}
                                  {answered && (
                                    <span className="text-[10px] text-success flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" /> {Math.round((answered.hits / (answered.hits + answered.errors)) * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className={`h-4 w-4 text-muted-foreground smooth-all ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </button>
                          <div className={`overflow-hidden smooth-all ${isExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-accent/30 rounded-xl p-4 flex flex-col sm:flex-row gap-2">
                              <Button size="sm" onClick={() => navigate(`/apostila/${a.id}`)} className="gradient-primary text-primary-foreground text-xs">
                                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Ler apostila
                              </Button>
                              {exCount > 0 && (
                                <Button size="sm" variant="outline" onClick={() => navigate(`/exercises/${a.id}`)} className="text-xs">
                                  <PenLine className="mr-1.5 h-3.5 w-3.5" /> Exercícios ({exCount})
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {apostilas.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma apostila disponível.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 animate-content-show delay-2">
            <WeeklyGoalWidget />
            <ExamCalendarWidget />
            <FlashcardSummaryWidget />
            <ApostilaProgressWidget data={stats.byApostila} exerciseCounts={exerciseCounts} />
            <StudyHeatmap />
            <RecentActivity />
            <Leaderboard />

            {/* Materials Link */}
            <Card className="p-4 bg-card border border-border/50">
              <button onClick={() => navigate('/materials')} className="w-full flex items-center gap-3 text-left hover:opacity-80 smooth-all">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Materiais de Apoio</p>
                  <p className="text-[10px] text-muted-foreground">PDFs, vídeos, áudios e mais</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </Card>
          </div>
        </div>

        {/* Performance Section */}
        {stats.total > 0 && Object.keys(stats.byApostila).length > 0 && (
          <Card className="p-5 bg-card border border-border/50 animate-content-show delay-3">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Desempenho Detalhado
            </h2>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Aproveitamento geral</span>
              <span className="text-sm font-bold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
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
