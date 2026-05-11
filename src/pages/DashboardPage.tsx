import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
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

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Watermark />
      <AppHeader />
      <AdSidebar />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <main className="container py-6 sm:py-8 px-4 sm:px-6 relative z-10 max-w-6xl animate-content-show">
        {/* Banner de anúncio (topo do dashboard) */}
        <div className="mb-4">
          <AdBanner position="inline" />
        </div>

        {/* 🚨 Aviso de prova HOJE */}
        <TodayExamBanner />

        {/* 📚 Modo Revisão Pré-Prova (≤7 dias) */}
        <div className="mb-4">
          <PreExamReviewBanner />
        </div>

        {/* Dashboard Minimalista - Temporariamente desativado para teste de estabilidade */}
        {/* 
        <div className="mb-12 animate-content-show">
          <DashboardMinimalist
            userName={profile?.full_name || 'Aluno'}
            weeklyGoal={30}
            weeklyProgress={gamification?.weeklyProgress || 0}
            totalXP={gamification?.totalXP || 0}
            level={gamification?.level || 1}
            streak={gamification?.currentStreak || 0}
          />
        </div>
        */}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-content-show">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Meu Painel</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Bem-vindo de volta! Continue de onde parou.</p>
          </div>
          <div className="flex gap-2">
            <StudyNowDialog />
            <Button size="sm" variant="outline" onClick={() => navigate('/profile')} className="text-xs gap-1.5 h-8 hidden sm:inline-flex">
              <User className="h-3.5 w-3.5" /> Perfil
            </Button>
            {showAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate('/admin')} className="text-xs gap-1.5 h-8 hidden sm:inline-flex">
                <BarChart3 className="h-3.5 w-3.5" /> Admin
              </Button>
            )}
          </div>
        </div>

        {/* 📊 Indicador de progresso geral + por grupo (visão rápida) */}
        <Reveal from="bottom" delay={10}>
          <OverallProgressCard
            overallProgress={overallProgress}
            overallAccuracy={pct}
            groupProgress={groupProgress}
            groupCounts={groupCounts}
            totalApostilas={apostilas.length}
          />
        </Reveal>

        {/* Continue de onde parou + Caderno de erros */}
        <Reveal from="bottom" delay={20}>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <ContinueWhereLeftCard />
            <MistakesNotebookCard />
          </div>
        </Reveal>

        {/* Quick Access Hub - estilo AVA */}
        <QuickAccessHub />

        {/* Flashcards & Revisão Ativa */}
        <Reveal from="bottom" delay={35}>
          <div className="mt-4">
            <Card 
              className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group shadow-sm"
              onClick={() => navigate('/flashcards')}
            >
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="p-3 bg-primary/20 rounded-2xl text-primary group-hover:scale-110 transition-transform shadow-inner">
                  <Brain size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1 flex items-center justify-center sm:justify-start gap-2">
                    Revisão Ativa com Flashcards
                    <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary font-mono text-[10px] h-4">NOVO</Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">Pratique com cartões inteligentes gerados por IA para fixar o conteúdo das apostilas.</p>
                </div>
              </div>
              <Button size="sm" className="w-full sm:w-auto gap-2 shadow-md">
                Estudar Agora <ChevronRight size={14} />
              </Button>
            </Card>
          </div>
        </Reveal>

        {/* Plano de Estudos Inteligente */}
        <Reveal from="bottom" delay={40}>
          <div className="mt-4 space-y-3">
            <ReviewTodayCard />
            <WeeklySimuladoCard />
          </div>
        </Reveal>
        <Reveal from="bottom" delay={50}>
          <div className="mt-4">
            <StudyPlanWidget />
          </div>
        </Reveal>

        {/* Carrossel de favoritos da Biblioteca */}
        <Reveal from="bottom" delay={100}>
          <div className="mt-4">
            <FavoriteMaterialsWidget />
          </div>
        </Reveal>

        {/* Search */}
        <div className="mb-6 animate-content-show delay-1">
          <GlobalSearch />
        </div>

        {/* Compact Stats Bar */}
        <div className="mb-6">
          <MobileCarousel desktopClassName="grid grid-cols-4 gap-3">
            {statCards.map((s, i) => (
              <Card key={s.label} className={`p-3 sm:p-4 hover-lift animate-card-enter delay-${i + 1}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-lg ${s.bg} p-2`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold tracking-tight leading-none">
                      <AnimatedCounter end={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </MobileCarousel>
        </div>

        {/* Main Grid: Content (2/3) + Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Disciplines */}
          <div className="lg:col-span-2 space-y-6">
            {/* Minhas Disciplinas */}
            <div id="minhas-disciplinas" className="animate-content-show delay-3 scroll-mt-24">
              <div className="section-heading flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Minhas Disciplinas</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle Meu semestre / Todos — só aparece se o aluno tem semestre definido */}
                  {studentSemester && (
                    <div className="flex items-center gap-1 rounded-full border border-border/60 p-0.5 bg-card">
                      <button
                        onClick={() => setSemesterFilter('mine')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          semesterFilter === 'mine'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title={`Mostrar apenas apostilas do ${semesterLabel(studentSemester)}`}
                      >
                        <GraduationCap className="h-3 w-3" />
                        Meu sem. ({studentSemester}º)
                      </button>
                      <button
                        onClick={() => setSemesterFilter('all')}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          semesterFilter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Todos
                      </button>
                    </div>
                  )}
                  {/* Banner discreto se o aluno não tem semestre cadastrado */}
                  {!studentSemester && (
                    <button
                      onClick={() => navigate('/profile')}
                      className="text-[11px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                      title="Complete seu perfil para filtrar apostilas pelo seu semestre"
                    >
                      Definir meu semestre →
                    </button>
                  )}
                  <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5 bg-card">
                    <button
                      onClick={() => setDisciplinesView('grid')}
                      className={`p-1.5 rounded transition-colors ${disciplinesView === 'grid' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label="Visualização em grade"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDisciplinesView('list')}
                      className={`p-1.5 rounded transition-colors ${disciplinesView === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label="Visualização em lista"
                    >
                      <ListIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* === Filtro principal: GRUPOS canônicos === */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 hide-scrollbar">
                <button
                  onClick={() => { setSelectedGroup('all'); setSelectedCategory('all'); }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 pb-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border overflow-hidden ${
                    selectedGroup === 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                      : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30'
                  }`}
                >
                  <span>📚</span>
                  Todas
                  <span className={`ml-0.5 px-1.5 rounded-full text-[10px] ${
                    selectedGroup === 'all' ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}>{apostilas.length}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border/30 rounded-b-full overflow-hidden">
                    <div className="h-full transition-all duration-500 rounded-b-full" style={{ width: `${overallProgress}%`, backgroundColor: selectedGroup === 'all' ? 'hsl(var(--primary-foreground) / 0.5)' : 'hsl(var(--primary) / 0.5)' }} />
                  </div>
                </button>
                {CANONICAL_GROUPS.map((g) => {
                  const meta = GROUP_META[g];
                  const count = groupCounts[g];
                  if (count === 0) return null;
                  const prog = groupProgress[g];
                  const active = selectedGroup === g;
                  return (
                    <button
                      key={g}
                      onClick={() => { setSelectedGroup(g); setSelectedCategory('all'); }}
                      title={meta.description}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 pb-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border overflow-hidden ${
                        active
                          ? 'border-current text-foreground shadow-md'
                          : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30'
                      }`}
                      style={active ? { backgroundColor: `${meta.color.replace('hsl(', 'hsla(').replace(')', ', 0.15)')}`, borderColor: meta.color, color: meta.color } : {}}
                    >
                      <span>{meta.icon}</span>
                      {g}
                      <span className={`ml-0.5 px-1.5 rounded-full text-[10px] ${
                        active ? 'bg-current/10' : 'bg-muted'
                      }`}>{count}</span>
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-full overflow-hidden" style={{ backgroundColor: `${meta.color.replace('hsl(', 'hsla(').replace(')', ', 0.25)')}` }}>
                        <div className="h-full transition-all duration-500 rounded-b-full" style={{ width: `${prog}%`, backgroundColor: meta.color }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* === Sub-filtro: categorias livres dentro do grupo === */}
              {visibleCategories.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 hide-scrollbar pl-1 border-l-2" style={{ borderColor: selectedGroup !== 'all' ? GROUP_META[selectedGroup as CanonicalGroup].color + '40' : 'hsl(var(--border))' }}>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${
                      selectedCategory === 'all'
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent text-muted-foreground border-border/40 hover:border-primary/30'
                    }`}
                  >
                    Todas as disciplinas
                  </button>
                  {visibleCategories.map((cat) => {
                    const color = getSubjectColor(cat);
                    const count = apostilas.filter(
                      (a) => (a.category || 'Geral') === cat &&
                        (selectedGroup === 'all' || getCanonicalGroup(a.category, a.title) === selectedGroup),
                    ).length;
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${
                          active
                            ? 'border-current text-foreground'
                            : 'bg-transparent text-muted-foreground border-border/40 hover:border-primary/30'
                        }`}
                        style={active ? { backgroundColor: `${color}20`, borderColor: color, color } : {}}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {cat}
                        <span className="text-[9px] opacity-70">·{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton-shimmer h-36 rounded-xl" />
                  ))}
                </div>
              ) : groupedEntries.length > 0 ? (
                disciplinesView === 'list' ? (
                  <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                    {groupedEntries.map(([category, items]) => {
                      const color = getSubjectColor(category);
                      return items.map((a, idx) => {
                        const exCount = exerciseCounts[a.id] || 0;
                        const answered = stats.byApostila[a.id];
                        const totalEx = exCount;
                        const answeredCount = answered ? answered.hits + answered.errors : 0;
                        const prog = totalEx > 0 ? Math.round((answeredCount / totalEx) * 100) : 0;
                        const swipeActions: SwipeAction[] = [
                          {
                            id: 'open',
                            label: 'Ler',
                            icon: BookOpen,
                            variant: 'primary',
                            onSelect: () => navigate(`/apostila/${a.id}`),
                          },
                          ...(exCount > 0 ? [{
                            id: 'exercises',
                            label: 'Exerc.',
                            icon: PenLine,
                            background: color,
                            color: 'hsl(20 14% 10%)',
                            onSelect: () => navigate(`/exercises/${a.id}`),
                          } as SwipeAction] : []),
                          {
                            id: 'share',
                            label: 'Enviar',
                            icon: Share2,
                            onSelect: async () => {
                              const url = `${window.location.origin}/apostila/${a.id}`;
                              try {
                                if (navigator.share) await navigator.share({ title: a.title, url });
                                else {
                                  await navigator.clipboard.writeText(url);
                                  toast.success('Link copiado');
                                }
                              } catch { /* cancelado */ }
                            },
                          },
                        ];
                        return (
                          <ApostilaCardActions key={a.id} apostila={a} exerciseCount={exCount}>
                            <SwipeableRow
                              rightActions={swipeActions}
                              leftActions={[{
                                id: 'fav',
                                label: apostilaFavorites.isFavorite(a.id) ? 'Remover' : 'Favorito',
                                icon: Star,
                                variant: 'warning',
                                onSelect: async () => {
                                  const nowFav = await apostilaFavorites.toggle(a.id);
                                  toast.success(nowFav ? '⭐ Favoritada' : 'Removida dos favoritos');
                                },
                              }]}
                              disabled={!isMobile}
                              className="rounded-none border-b border-border/40 last:border-b-0"
                            >
                              <button
                                onClick={() => navigate(`/apostila/${a.id}`)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-card hover:bg-muted/30 transition-colors animate-fade-in"
                                style={{ animationDelay: `${idx * 30}ms` }}
                              >
                                <span className="font-mono-label text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                                  {category.slice(0, 6)}
                                </span>
                                <span className="text-sm font-medium text-foreground flex-1 truncate flex items-center gap-1.5">
                                  {apostilaFavorites.isFavorite(a.id) && (
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                  )}
                                  <span className="truncate">{a.title}</span>
                                </span>
                                <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                                  <Progress value={prog} className="h-1 flex-1" />
                                  <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{prog}%</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              </button>
                            </SwipeableRow>
                          </ApostilaCardActions>
                        );
                      });
                    })}
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groupedEntries.map(([category, items], catIdx) => {
                    const color = getSubjectColor(category);
                    return items.map((a, idx) => {
                      const exCount = exerciseCounts[a.id] || 0;
                      const answered = stats.byApostila[a.id];
                      const correctPct = answered ? Math.round((answered.hits / (answered.hits + answered.errors)) * 100) : 0;
                      const initial = category.charAt(0).toUpperCase();
                      const isFocus = isFocusApostila(a) || isFocusCategory(category);

                      return (
                        <ApostilaCardActions key={a.id} apostila={a} exerciseCount={exCount}>
                          <div
                            className={`discipline-card animate-card-enter relative ${isFocus ? 'ring-2 ring-destructive/60 shadow-[0_0_25px_hsl(var(--destructive)/0.25)]' : ''}`}
                            style={{ animationDelay: `${(catIdx * items.length + idx) * 60}ms` }}
                          >
                            {isFocus && examFocus && (
                              <div className="absolute -top-2 left-3 z-10 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
                                🔥 Prova {examFocus.daysUntil === 0 ? 'HOJE' : 'AMANHÃ'}
                              </div>
                            )}
                            {/* Colored header */}
                            <div
                              className="discipline-card-header"
                              style={{ backgroundColor: `${color}15` }}
                            >
                              <div
                                className="discipline-icon"
                                style={{ backgroundColor: `${color}25`, color }}
                              >
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color }}>
                                  {category}
                                </p>
                                <h3 className="text-sm font-semibold truncate text-foreground leading-snug">
                                  {a.title}
                                </h3>
                              </div>
                            </div>

                            {/* Card body */}
                            <div className="discipline-card-body">
                              {/* Progress info */}
                              <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                                {exCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <PenLine className="h-3 w-3" /> {exCount} exercícios
                                  </span>
                                )}
                                {answered && (
                                  <span className="flex items-center gap-1 text-success">
                                    <CheckCircle className="h-3 w-3" /> {correctPct}% acerto
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              {answered && (
                                <Progress value={correctPct} className="h-1.5 mb-3" />
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/apostila/${a.id}`); }}
                                  className="flex-1 text-xs h-8 gap-1.5"
                                  style={{ backgroundColor: color, color: '#000' }}
                                >
                                  <BookOpen className="h-3.5 w-3.5" /> Ler Apostila
                                </Button>
                                {exCount > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/exercises/${a.id}`); }}
                                    className="text-xs h-8 gap-1.5"
                                  >
                                    <PenLine className="h-3.5 w-3.5" /> Exercícios
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </ApostilaCardActions>
                      );
                    });
                  })}
                </div>
                )
              ) : (
                <div className="text-center py-16 text-muted-foreground animate-fade-in">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma apostila disponível</p>
                  <p className="text-xs mt-1">As apostilas aparecerão aqui quando publicadas.</p>
                </div>
              )}
            </div>

            {/* Charts */}
            <Reveal from="bottom" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EvolutionChart />
              <CategoryPerformanceChart data={categoryData} />
            </Reveal>

            {/* Category Stats */}
            <Reveal from="bottom" delay={80}>
              <CategoryStatsWidget
                apostilas={apostilas}
                byApostila={stats.byApostila}
                exerciseCounts={exerciseCounts}
              />
            </Reveal>

            {/* Gamification + Pomodoro */}
            <Reveal from="bottom" delay={120}>
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
            </Reveal>

            {/* Performance Section */}
            {stats.total > 0 && Object.keys(stats.byApostila).length > 0 && (
              <Reveal from="bottom" delay={80}>
              <Card className="p-5">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Desempenho Detalhado
                </h2>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Aproveitamento geral</span>
                  <span className="text-sm font-bold text-primary">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2 mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {Object.entries(stats.byApostila).map(([id, s], idx) => {
                    const total = s.hits + s.errors;
                    const p = total > 0 ? Math.round((s.hits / total) * 100) : 0;
                    return (
                      <div key={id} className="animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium truncate flex-1">{s.title}</p>
                          <span className="text-xs font-bold ml-2">{p}%</span>
                        </div>
                        <Progress value={p} className="h-1.5" />
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-success" /> {s.hits}</span>
                          <span className="flex items-center gap-1"><XCircle className="h-2.5 w-2.5 text-destructive" /> {s.errors}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              </Reveal>
            )}
          </div>

          {/* Right Sidebar — Priority Order */}
          <div className="space-y-4">
            {/* Priority widgets always visible */}
            <Reveal from="right"><GradeCalculatorWidget /></Reveal>
            <Reveal from="right" delay={40}><WeeklyGoalWidget /></Reveal>
            <Reveal from="right" delay={60}>
              <div id="calendario" className="scroll-mt-24">
                <ExamCalendarWidget />
              </div>
            </Reveal>
            <Reveal from="right" delay={120}>
              <GamificationSidebarCard
                level={gamification.xp.level}
                xp={gamification.xp.xp_points}
                streak={gamification.streak.current_streak}
                xpForNext={gamification.xpForNextLevel(gamification.xp.level)}
              />
            </Reveal>
            <Reveal from="right" delay={180}><FlashcardSummaryWidget /></Reveal>

            {/* Material de Apoio Widget */}
            <Reveal from="right" delay={240}><MaterialWidget /></Reveal>

            {/* Mural de Avisos */}
            <Reveal from="right" delay={300}>
              <div id="comunidade" className="scroll-mt-24">
                <AnnouncementsBoard />
              </div>
            </Reveal>
            <div id="mural" className="scroll-mt-24" />

            {/* Materials shortcut */}
            <Card className="p-4 hover-lift">
              <button onClick={() => navigate('/materials')} className="w-full flex items-center gap-3 text-left group">
                <div className="rounded-lg bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/20">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Ver Todos os Materiais</p>
                  <p className="text-[10px] text-muted-foreground">PDFs, vídeos e mais</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </Card>

            {/* Collapsible "Ver mais" section */}
            <div>
              <button
                onClick={() => setShowMoreWidgets(!showMoreWidgets)}
                className="w-full flex items-center justify-between py-2 px-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-medium">
                  {showMoreWidgets ? 'Mostrar menos' : 'Ver mais ferramentas'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMoreWidgets ? 'rotate-180' : ''}`} />
              </button>

              {showMoreWidgets && (
                <div className="space-y-4 animate-collapse-open">
                  <ApostilaProgressWidget data={stats.byApostila} exerciseCounts={exerciseCounts} />
                  <StudyHeatmap />
                  <RecentActivity />
                  <Leaderboard />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
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
