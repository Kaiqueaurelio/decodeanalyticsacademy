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
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const gamification = useGamification();
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, hits: 0, errors: 0, byApostila: {} as Record<string, { hits: number; errors: number; title: string }> });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
    const seen = localStorage.getItem('decode_onboarding_done');
    if (!seen) setShowOnboarding(true);
    gamification.updateStreak();
    gamification.checkAndAwardBadge('first_login');
  }, [user]);

  const loadData = async () => {
    setLoading(true);
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
    setLoading(false);
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

  const statCards = [
    { icon: BookOpen, label: 'Apostilas', value: apostilas.length, bg: 'bg-primary/10', color: 'text-primary' },
    { icon: PenLine, label: 'Exercícios', value: totalExercises, bg: 'bg-accent/10', color: 'text-accent' },
    { icon: CheckCircle, label: 'Acertos', value: stats.hits, bg: 'bg-success/10', color: 'text-success' },
    { icon: Percent, label: 'Aproveitamento', value: pct, suffix: '%', bg: 'bg-warning/10', color: 'text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <main className="container py-8 px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-content-show">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe seu progresso de estudos</p>
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
        <div className="mb-8 animate-content-show delay-1">
          <GlobalSearch />
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <MobileCarousel desktopClassName="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <Card key={s.label} className={`p-5 hover-lift animate-card-enter delay-${i + 1}`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl ${s.bg} p-3`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">
                      <AnimatedCounter end={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </MobileCarousel>
        </div>

        {/* Main Grid: Left (2/3) + Right Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gamification + Pomodoro */}
            <div className="animate-content-show delay-3">
              <MobileCarousel desktopClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GamificationWidget
                  xpPoints={gamification.xp.xp_points}
                  level={gamification.xp.level}
                  currentStreak={gamification.streak.current_streak}
                  longestStreak={gamification.streak.longest_streak}
                  xpForNext={gamification.xpForNextLevel(gamification.xp.level)}
                  earnedBadges={earnedBadges}
                />
                <div className="space-y-4">
                  <PomodoroTimer onComplete={handlePomodoroComplete} />
                  <FlashcardsWidget />
                </div>
              </MobileCarousel>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-content-show delay-4">
              <EvolutionChart />
              <CategoryPerformanceChart data={categoryData} />
            </div>

            {/* Apostilas by Category */}
            <div className="space-y-6 animate-content-show delay-5">
              <div className="section-heading">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">Suas Apostilas</h2>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-shimmer h-16 rounded-xl" />
                  ))}
                </div>
              ) : Object.entries(grouped).length > 0 ? (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">{category}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-2">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((a, idx) => {
                        const exCount = exerciseCounts[a.id] || 0;
                        const answered = stats.byApostila[a.id];
                        const isExpanded = expandedId === a.id;
                        return (
                          <div
                            key={a.id}
                            className="animate-card-enter"
                            style={{ animationDelay: `${idx * 60}ms` }}
                          >
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : a.id)}
                              className={`w-full text-left bg-card rounded-xl p-4 border transition-all duration-250 ease-out ${
                                isExpanded
                                  ? 'border-primary/30 shadow-md bg-card'
                                  : 'border-border/40 hover:border-primary/20 hover:shadow-sm hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-sm truncate">{a.title}</h3>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {exCount > 0 && (
                                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <PenLine className="h-3 w-3" /> {exCount} exercícios
                                      </span>
                                    )}
                                    {answered && (
                                      <span className="text-[11px] text-success flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> {Math.round((answered.hits / (answered.hits + answered.errors)) * 100)}% acerto
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                              <div className="bg-muted/30 rounded-xl p-4 flex flex-col sm:flex-row gap-2 border border-border/20">
                                <Button size="sm" onClick={() => navigate(`/apostila/${a.id}`)} className="gradient-primary text-primary-foreground text-xs gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5" /> Ler Apostila
                                </Button>
                                {exCount > 0 && (
                                  <Button size="sm" variant="outline" onClick={() => navigate(`/exercises/${a.id}`)} className="text-xs gap-1.5">
                                    <PenLine className="h-3.5 w-3.5" /> Fazer Exercícios ({exCount})
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground animate-fade-in">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma apostila disponível</p>
                  <p className="text-xs mt-1">As apostilas aparecerão aqui quando publicadas.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="animate-content-show delay-4">
            <MobileCarousel desktopClassName="space-y-4">
              <WeeklyGoalWidget />
              <ExamCalendarWidget />
              <FlashcardSummaryWidget />
              <ApostilaProgressWidget data={stats.byApostila} exerciseCounts={exerciseCounts} />
              <StudyHeatmap />
              <RecentActivity />
              <Leaderboard />
              <Card className="p-5 hover-lift">
                <button onClick={() => navigate('/materials')} className="w-full flex items-center gap-3 text-left group">
                  <div className="rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Materiais de Apoio</p>
                    <p className="text-[11px] text-muted-foreground">PDFs, vídeos, áudios e mais</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              </Card>
            </MobileCarousel>
          </div>
        </div>

        {/* Performance Section */}
        {stats.total > 0 && Object.keys(stats.byApostila).length > 0 && (
          <Card className="p-6 animate-content-show delay-6">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Desempenho Detalhado
            </h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Aproveitamento geral</span>
              <span className="text-sm font-bold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2.5 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {Object.entries(stats.byApostila).map(([id, s], idx) => {
                const total = s.hits + s.errors;
                const p = total > 0 ? Math.round((s.hits / total) * 100) : 0;
                return (
                  <div key={id} className="animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium truncate flex-1">{s.title}</p>
                      <span className="text-xs font-bold ml-2">{p}%</span>
                    </div>
                    <Progress value={p} className="h-1.5" />
                    <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-success" /> {s.hits} acertos</span>
                      <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> {s.errors} erros</span>
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
