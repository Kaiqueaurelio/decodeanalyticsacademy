import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
// AppHeader substituído pelo DashboardTopbar dentro do novo layout
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { HeroGreetingCard } from '@/components/dashboard/HeroGreetingCard';
import { ActivitiesToDoSection, RecommendedExercisesSection } from '@/components/dashboard/DashboardSections';
import { ApostilasReadingCarousel, ProgressSummaryRow } from '@/components/dashboard/DashboardCarousels';
import { AdBanner } from '@/components/AdBanner';
import { AdSidebar } from '@/components/AdSidebar';
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
import { CategoryStatsWidget } from '@/components/CategoryStatsWidget';
import { RecentActivity } from '@/components/RecentActivity';
import { WeeklyGoalWidget } from '@/components/WeeklyGoalWidget';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ExamCalendarWidget } from '@/components/ExamCalendarWidget';
import { FlashcardSummaryWidget } from '@/components/FlashcardSummaryWidget';
import { ApostilaProgressWidget } from '@/components/ApostilaProgressWidget';
import { StudyPlanWidget } from '@/components/StudyPlanWidget';
import { ReviewTodayCard } from '@/components/ReviewTodayCard';
import { WeeklySimuladoCard } from '@/components/WeeklySimuladoCard';
import { MobileCarousel } from '@/components/MobileCarousel';
import { MaterialWidget } from '@/components/MaterialWidget';
import { FavoriteMaterialsWidget } from '@/components/FavoriteMaterialsWidget';
import { GradeCalculatorWidget } from '@/components/GradeCalculatorWidget';
import { AnnouncementsBoard } from '@/components/AnnouncementsBoard';
import { TodayExamBanner } from '@/components/TodayExamBanner';
import { PreExamReviewBanner } from '@/components/PreExamReviewBanner';
import { ContinueWhereLeftCard } from '@/components/ContinueWhereLeftCard';
import { MistakesNotebookCard } from '@/components/MistakesNotebookCard';
import { StudyNowDialog } from '@/components/StudyNowDialog';
import { OverallProgressCard } from '@/components/OverallProgressCard';
import { QuickAccessHub } from '@/components/QuickAccessHub';
import { Reveal } from '@/components/Reveal';
import { DashboardMinimalist } from '@/components/DashboardMinimalist';
import { ApostilaCardActions } from '@/components/ApostilaCardActions';
import { SwipeableRow, type SwipeAction } from '@/components/SwipeableRow';
import { useApostilaFavorites } from '@/hooks/useApostilaFavorites';
import { Share2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useExamFocus } from '@/hooks/useExamFocus';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSubjectColor } from '@/lib/subject-colors';
import {
  CANONICAL_GROUPS,
  GROUP_META,
  getCanonicalGroup,
  type CanonicalGroup,
} from '@/lib/subjectGroups';
import {
  BookOpen, CheckCircle, XCircle, TrendingUp, PenLine,
  ChevronRight, BarChart3, User, FileText, Percent, ChevronDown,
  LayoutGrid, List as ListIcon, Brain
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { useApostilasList, useExerciseCounts, useDashboardStats, type ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { semesterShort, semesterLabel } from '@/lib/subject-semester-map';
import { GraduationCap } from 'lucide-react';

type Apostila = ApostilaSummary;

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const showAdmin = isAdmin;
  const isMobile = useIsMobile();
  const apostilaFavorites = useApostilaFavorites();
  const navigate = useNavigate();
  const gamification = useGamification();
  const examFocus = useExamFocus();

  // Perfil do aluno (semestre/curso) — base para filtrar apostilas
  const { data: profile } = useUserProfile(user?.id);
  const studentSemester = profile?.semester ?? null;
  const studentCourse = profile?.course ?? null;

  // Toggle: ver só apostilas do meu semestre OU todas. Persiste em localStorage.
  const [semesterFilter, setSemesterFilter] = useState<'mine' | 'all'>(() => {
    if (typeof window === 'undefined') return 'mine';
    return (localStorage.getItem('apostilas.semesterFilter') as 'mine' | 'all') || 'mine';
  });
  useEffect(() => {
    try { localStorage.setItem('apostilas.semesterFilter', semesterFilter); } catch {}
  }, [semesterFilter]);

  // CORREÇÃO: Removido o filtro por semestre que causava o sumiço das apostilas
  // Agora o dashboard sempre mostra TODAS as apostilas publicadas
  
  // Cache via React Query — navegação volta instantânea (staleTime 5min em App.tsx).
  // CORREÇÃO: Sempre carrega TODAS as apostilas publicadas
  const { data: apostilas = [], isLoading: loadingApostilas } = useApostilasList();
  const { data: exerciseCounts = {} } = useExerciseCounts();
  const { data: statsData, isLoading: loadingStats } = useDashboardStats(user?.id);
  const stats = statsData || { total: 0, hits: 0, errors: 0, byApostila: {} };
  const loading = loadingApostilas || loadingStats;

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMoreWidgets, setShowMoreWidgets] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<CanonicalGroup | 'all'>('all');
  const [disciplinesView, setDisciplinesView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem('decode_onboarding_done');
    if (!seen) setShowOnboarding(true);
    gamification.updateStreak();
    gamification.checkAndAwardBadge('first_login');
  }, [user]);


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
  const allCategories = [...new Set(apostilas.map(a => a.category || 'Geral'))];

  // Progress per category: answered exercises / total exercises
  const categoryProgress = allCategories.reduce((acc, cat) => {
    const catApostilaIds = apostilas.filter(a => (a.category || 'Geral') === cat).map(a => a.id);
    const totalEx = catApostilaIds.reduce((s, id) => s + (exerciseCounts[id] || 0), 0);
    const answeredEx = catApostilaIds.reduce((s, id) => {
      const st = stats.byApostila[id];
      return s + (st ? st.hits + st.errors : 0);
    }, 0);
    acc[cat] = totalEx > 0 ? Math.round((answeredEx / totalEx) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);

  const overallProgress = (() => {
    const totalEx = Object.values(exerciseCounts).reduce((s, c) => s + c, 0);
    const answeredEx = Object.values(stats.byApostila).reduce((s, st) => s + st.hits + st.errors, 0);
    return totalEx > 0 ? Math.round((answeredEx / totalEx) * 100) : 0;
  })();

  const filteredApostilas = apostilas.filter((a) => {
    const groupOk =
      selectedGroup === 'all' || getCanonicalGroup(a.category, a.title) === selectedGroup;
    const catOk =
      selectedCategory === 'all' || (a.category || 'Geral') === selectedCategory;
    return groupOk && catOk;
  });

  // Contadores e progresso por GRUPO canônico
  const groupCounts: Record<CanonicalGroup, number> = {
    Programação: 0, Redes: 0, IA: 0, Segurança: 0, Cloud: 0, Outros: 0,
  };
  const groupExTotals: Record<CanonicalGroup, number> = {
    Programação: 0, Redes: 0, IA: 0, Segurança: 0, Cloud: 0, Outros: 0,
  };
  const groupExAnswered: Record<CanonicalGroup, number> = {
    Programação: 0, Redes: 0, IA: 0, Segurança: 0, Cloud: 0, Outros: 0,
  };
  for (const a of apostilas) {
    const g = getCanonicalGroup(a.category, a.title);
    groupCounts[g] += 1;
    groupExTotals[g] += exerciseCounts[a.id] || 0;
    const st = stats.byApostila[a.id];
    if (st) groupExAnswered[g] += st.hits + st.errors;
  }
  const groupProgress: Record<CanonicalGroup, number> = {
    Programação: 0, Redes: 0, IA: 0, Segurança: 0, Cloud: 0, Outros: 0,
  };
  for (const g of CANONICAL_GROUPS) {
    groupProgress[g] = groupExTotals[g] > 0
      ? Math.round((groupExAnswered[g] / groupExTotals[g]) * 100)
      : 0;
  }

  // Sub-categorias livres dentro do grupo selecionado
  const visibleCategories = selectedGroup === 'all'
    ? allCategories
    : [...new Set(
        apostilas
          .filter((a) => getCanonicalGroup(a.category, a.title) === selectedGroup)
          .map((a) => a.category || 'Geral'),
      )];

  // Identifica matéria foco da prova (matching por substring case-insensitive)
  const focusSubjectLc = examFocus?.subject.toLowerCase() || null;
  const isFocusApostila = (a: Apostila) => {
    if (!focusSubjectLc) return false;
    const cat = (a.category || '').toLowerCase();
    const title = (a.title || '').toLowerCase();
    return cat.includes(focusSubjectLc) || title.includes(focusSubjectLc) ||
           focusSubjectLc.includes(cat) || focusSubjectLc.includes(title);
  };
  const isFocusCategory = (cat: string) =>
    focusSubjectLc ? cat.toLowerCase().includes(focusSubjectLc) || focusSubjectLc.includes(cat.toLowerCase()) : false;

  const grouped = filteredApostilas.reduce((acc, a) => {
    const cat = a.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, Apostila[]>);

  // Reordena: categoria da matéria foco vem primeiro
  const groupedEntries = Object.entries(grouped).sort(([catA], [catB]) => {
    const fa = isFocusCategory(catA) ? -1 : 0;
    const fb = isFocusCategory(catB) ? -1 : 0;
    return fa - fb;
  });

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

  // ============================================================
  // Layout Moderno (mockup): Sidebar fixa + Topbar + grid de seções
  // ============================================================
  const totalApostilas = apostilas.length;
  const apostilasIniciadas = Object.keys(stats.byApostila).length;
  const exerciciosResolvidos = stats.hits + stats.errors;
  const disciplinasAtivas = allCategories.length;
  const disciplinasTotal = Math.max(disciplinasAtivas, 10);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Watermark />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      {/* Sidebar fixa em desktop */}
      <StudentSidebar />

      {/* Área principal */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <DashboardTopbar />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1400px] w-full mx-auto animate-content-show">
          {/* Banners críticos */}
          <TodayExamBanner />
          <PreExamReviewBanner />

          {/* Banner de anúncio (opcional) */}
          <AdBanner position="inline" />

          {/* Hero: saudação + progresso */}
          <Reveal from="bottom" delay={10}>
            <HeroGreetingCard
              name={profile?.full_name || ''}
              overallProgress={overallProgress}
              totalApostilas={totalApostilas}
              totalAnswered={exerciciosResolvidos}
            />
          </Reveal>

          {/* Grid principal: 2/3 conteúdo + 1/3 agenda */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Coluna esquerda (atividades + exercícios) */}
            <div className="lg:col-span-2 space-y-5" id="atividades">
              <Reveal from="bottom" delay={20}>
                <ActivitiesToDoSection
                  apostilas={apostilas}
                  exerciseCounts={exerciseCounts}
                  examFocusSubject={examFocus?.subject || null}
                />
              </Reveal>
              <Reveal from="bottom" delay={30}>
                <RecommendedExercisesSection
                  apostilas={apostilas}
                  exerciseCounts={exerciseCounts}
                />
              </Reveal>
            </div>

            {/* Coluna direita: agenda + prazos */}
            <div className="space-y-5">
              <Reveal from="bottom" delay={20}>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <header className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base">Agenda · Próximos prazos</h3>
                  </header>
                  <ExamCalendarWidget />
                </div>
              </Reveal>
            </div>
          </div>

          {/* Apostilas para leitura */}
          <Reveal from="bottom" delay={40}>
            <ApostilasReadingCarousel
              apostilas={apostilas}
              exerciseCounts={exerciseCounts}
            />
          </Reveal>

          {/* Resumo do progresso */}
          <Reveal from="bottom" delay={50}>
            <ProgressSummaryRow
              disciplinas={{ ativas: disciplinasAtivas, total: disciplinasTotal }}
              atividades={{ concluidas: apostilasIniciadas, total: totalApostilas }}
              exercicios={{ resolvidos: exerciciosResolvidos, total: totalExercises }}
              apostilas={{ lidas: apostilasIniciadas, total: totalApostilas }}
            />
          </Reveal>

          {/* Minhas Disciplinas (mantido — link da sidebar) */}
          <section id="minhas-disciplinas" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5">
            <header className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-base">Minhas Disciplinas</h2>
                <Badge variant="secondary" className="text-[10px] h-5 px-2">
                  {totalApostilas} apostilas
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedGroup === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-[11px] px-3"
                  onClick={() => setSelectedGroup('all')}
                >
                  Todas
                </Button>
                {CANONICAL_GROUPS.map((g) => groupCounts[g] > 0 && (
                  <Button
                    key={g}
                    variant={selectedGroup === g ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[11px] px-3"
                    onClick={() => setSelectedGroup(g)}
                  >
                    {g} <span className="ml-1 opacity-60">{groupCounts[g]}</span>
                  </Button>
                ))}
              </div>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : filteredApostilas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma apostila para esses filtros.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredApostilas.slice(0, 8).map((a) => {
                  const tint = getSubjectColor(a.category || 'Geral');
                  const ex = exerciseCounts[a.id] || 0;
                  const st = stats.byApostila[a.id];
                  const acc = st && st.hits + st.errors > 0 ? Math.round((st.hits / (st.hits + st.errors)) * 100) : 0;
                  return (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/apostila/${a.id}`)}
                      className="text-left rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-primary/40 transition-all p-4 group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 self-stretch rounded-full"
                          style={{ backgroundColor: tint }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: tint }}>
                            {a.category || 'Geral'}
                          </div>
                          <div className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {a.title}
                          </div>
                          {ex > 0 && (
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                              <span>{ex} exercícios</span>
                              {st && <span>· {acc}% acerto</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mais ferramentas — preserva widgets antigos sem poluir o layout */}
          <div className="rounded-2xl border border-border/60 bg-card/40">
            <button
              onClick={() => setShowMoreWidgets(!showMoreWidgets)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-muted/30 transition-colors rounded-2xl"
            >
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                {showMoreWidgets ? 'Ocultar ferramentas avançadas' : 'Mais ferramentas de estudo'}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMoreWidgets ? 'rotate-180' : ''}`} />
            </button>

            {showMoreWidgets && (
              <div className="p-5 pt-0 space-y-5 animate-collapse-open">
                <OverallProgressCard
                  overallProgress={overallProgress}
                  overallAccuracy={pct}
                  groupProgress={groupProgress}
                  groupCounts={groupCounts}
                  totalApostilas={apostilas.length}
                />
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <ContinueWhereLeftCard />
                    <MistakesNotebookCard />
                    <QuickAccessHub />
                    <ReviewTodayCard />
                    <WeeklySimuladoCard />
                    <StudyPlanWidget />
                    <FavoriteMaterialsWidget />
                    <ApostilaProgressWidget data={stats.byApostila} exerciseCounts={exerciseCounts} />
                    <StudyHeatmap />
                    <RecentActivity />
                  </div>
                  <div className="space-y-4">
                    <GamificationWidget
                      level={gamification.xp.level}
                      xpPoints={gamification.xp.xp_points}
                      xpForNext={gamification.xpForNextLevel(gamification.xp.level)}
                      currentStreak={gamification.streak.current_streak}
                      longestStreak={gamification.streak.longest_streak}
                      earnedBadges={earnedBadges}
                    />
                    <PomodoroTimer onComplete={handlePomodoroComplete} />
                    <FlashcardsWidget />
                    <Leaderboard />
                    <EvolutionChart />
                    <GradeCalculatorWidget />
                    <AnnouncementsBoard />
                    <WeeklyGoalWidget />
                    <FlashcardSummaryWidget />
                    <CategoryStatsWidget apostilas={apostilas as any} byApostila={stats.byApostila} exerciseCounts={exerciseCounts} />
                    <CategoryPerformanceChart data={categoryData} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="text-center text-[10px] text-muted-foreground/60 py-6 mt-6 border-t border-border/30">
            Desenvolvido por: Kaique Aurelio &amp; Decode Analytics
          </footer>
        </main>
      </div>

      <AdSidebar />
    </div>
  );
}

/* Compact gamification card for sidebar */
function GamificationSidebarCard({ level, xp, streak, xpForNext }: { level: number; xp: number; streak: number; xpForNext: number }) {
  const progress = xpForNext > 0 ? Math.min((xp / xpForNext) * 100, 100) : 0;

  return (
    <Card className="p-4 hover-lift">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Nível {level}</p>
          <p className="text-[10px] text-muted-foreground">{xp} / {xpForNext} XP</p>
        </div>
        {streak > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-2">
            🔥 {streak} dias
          </Badge>
        )}
      </div>
      <Progress value={progress} className="h-1.5" />
    </Card>
  );
}
