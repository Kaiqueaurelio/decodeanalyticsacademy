import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { useExamFocus } from '@/hooks/useExamFocus';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { HeroGreetingCard } from '@/components/dashboard/HeroGreetingCard';
import { ActivitiesToDoSection, RecommendedExercisesSection } from '@/components/dashboard/DashboardSections';
import { ProgressSummaryRow } from '@/components/dashboard/DashboardCarousels';
import { SubjectFolderGrid } from '@/components/dashboard/SubjectFolderGrid';
import { SemesterFilter } from '@/components/dashboard/filters/SemesterFilter';
import { AdBanner } from '@/components/AdBanner';
import { AdSidebar } from '@/components/AdSidebar';
import { Watermark } from '@/components/Watermark';
import { Reveal } from '@/components/Reveal';
import { ExamCalendarWidget } from '@/components/ExamCalendarWidget';
import { OnboardingTour } from '@/components/OnboardingTour';
import { TermsFooterLink } from '@/components/TermsFooterLink';
import { ContinueWhereLeftCard } from '@/components/ContinueWhereLeftCard';
import { useApostilasList, useExerciseCounts, useDashboardStats, type ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { BY_SEMESTER } from '@/lib/subject-semester-map';
import { BookOpen, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';




export default function DashboardPage() {
  const { user } = useAuth();
  const gamification = useGamification();
  const examFocus = useExamFocus();
  const { data: profile } = useUserProfile(user?.id);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedSemestre');
    return saved ? parseInt(saved, 10) : 6; // Agora o 6º semestre é o default
  });
  const { data: apostilasRaw = [], isLoading: loadingApostilas } = useApostilasList();
  const { data: exerciseCounts = {} } = useExerciseCounts();
  const { data: statsData, isLoading: loadingStats } = useDashboardStats(user?.id);
  const stats = statsData || { total: 0, hits: 0, errors: 0, byApostila: {} };
  const loading = loadingApostilas || loadingStats;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleFolders, setVisibleFolders] = useState(12);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Lógica de processamento de apostilas (filtro + placeholders de semestres futuros)
  const apostilas = useMemo(() => {
    // 1. Filtragem por semestre se selecionado
    let list = selectedSemester 
      ? apostilasRaw.filter(a => a.semester === selectedSemester)
      : apostilasRaw;

    // 2. Se for um semestre futuro (6, 7, 8) e não houver conteúdo, gerar placeholders
    if (selectedSemester && [6, 7, 8].includes(selectedSemester) && list.length === 0) {
      const futureSubjects = BY_SEMESTER[selectedSemester] || [];
      return futureSubjects.map((subject, idx) => ({
        id: `placeholder-${selectedSemester}-${idx}`,
        title: `Conteúdo de ${subject}`,
        category: subject,
        semester: selectedSemester,
        isPlaceholder: true,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cover_url: null,
        file_url: null,
        source_type: null,
        course: null
      })) as any as ApostilaSummary[];
    }

    return list;
  }, [apostilasRaw, selectedSemester]);
  
  

  useEffect(() => {
    if (selectedSemester !== null) {
      localStorage.setItem('selectedSemestre', selectedSemester.toString());
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (!user) return;
    
    // Marcar do 1º ao 5º semestre como concluído
    const markCompleted = async () => {
      await supabase.rpc('force_complete_semesters_upto_five', { _user_id: user.id });
      await supabase.rpc('complete_semesters_six_to_eight', { _user_id: user.id });
    };
    markCompleted();

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

  const totalExercises = Object.values(exerciseCounts).reduce((sum, count) => sum + count, 0);
  const answeredExercises = stats.hits + stats.errors;
  const overallProgress = totalExercises > 0 ? Math.round((answeredExercises / totalExercises) * 100) : 0;
  const disciplinesTotal = Math.max(new Set(apostilas.map((a) => a.category || 'Geral')).size, 10);
  const apostilasIniciadas = Object.keys(stats.byApostila).length;

  return (
    <div className="min-h-dvh bg-background relative selection:bg-primary/20">
      <Watermark />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <StudentSidebar />

      <div className="flex flex-col min-h-dvh transition-[padding] duration-300 ease-out">
        <DashboardTopbar />

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1400px] w-full mx-auto animate-content-show overflow-x-hidden">
          <AdBanner position="inline" />

          <Reveal from="bottom" delay={10}>
            <HeroGreetingCard
              name={profile?.full_name || ''}
              overallProgress={overallProgress}
              totalApostilas={apostilas.length}
              totalAnswered={answeredExercises}
            />
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5" id="atividades">
              <Reveal from="bottom" delay={20}>
                <ActivitiesToDoSection
                  apostilas={apostilas}
                  exerciseCounts={exerciseCounts}
                  examFocusSubject={examFocus?.subject || null}
                />
              </Reveal>
              <Reveal from="bottom" delay={30}>
                <RecommendedExercisesSection apostilas={apostilas} exerciseCounts={exerciseCounts} />
              </Reveal>
            </div>

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

          <Reveal from="bottom" delay={50}>
            <ProgressSummaryRow
              disciplinas={{ ativas: new Set(apostilas.map((a) => a.category || 'Geral')).size, total: disciplinesTotal }}
              atividades={{ concluidas: apostilasIniciadas, total: apostilas.length }}
              exercicios={{ resolvidos: answeredExercises, total: totalExercises }}
              apostilas={{ lidas: apostilasIniciadas, total: apostilas.length }}
            />
          </Reveal>

          <section id="minhas-disciplinas" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5">
            <header className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-base">Minhas Disciplinas</h2>
                </div>
                <p className="text-[10px] text-muted-foreground pl-6">
                  {selectedSemester ? `Visualizando ${selectedSemester}º semestre` : 'Visualizando toda a grade curricular'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SemesterFilter 
                  selectedSemester={selectedSemester} 
                  onSelect={(sem) => {
                    setSelectedSemester(sem);
                    if (sem) {
                      toast.success(`Semestre ${sem}º selecionado e salvo.`, {
                        description: "Suas preferências foram sincronizadas.",
                        duration: 2000,
                      });
                    } else {
                      toast.info("Visualizando toda a grade curricular.", {
                        duration: 2000,
                      });
                    }
                  }} 
                />

                <div className="relative w-full md:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value.slice(0, 80))}
                    placeholder="Buscar disciplina..."
                    aria-label="Buscar disciplina ou apostila"
                    className="h-8 pl-8 pr-8 text-xs bg-background/50 border-primary/10"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Limpar busca"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted/30 animate-pulse" />)}
              </div>
            ) : apostilas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma apostila disponível.</p>
            ) : (
              <div className="space-y-6">
                <SubjectFolderGrid
                  apostilas={apostilas.slice(0, visibleFolders)}
                  exerciseCounts={exerciseCounts}
                  stats={stats}
                  query={query}
                />
                
                {visibleFolders < apostilas.length && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary transition-colors gap-2"
                      onClick={() => {
                        setIsFetchingMore(true);
                        setTimeout(() => {
                          setVisibleFolders(prev => prev + 6);
                          setIsFetchingMore(false);
                        }, 400);
                      }}
                      disabled={isFetchingMore}
                    >
                      {isFetchingMore ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {isFetchingMore ? 'Carregando...' : 'Ver mais disciplinas'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>



          <Reveal from="bottom" delay={60}>
            <ContinueWhereLeftCard />
          </Reveal>


          <footer className="flex flex-col items-center justify-center gap-3 py-10 mt-6 border-t border-border/10 text-center text-[10px] text-muted-foreground/60 bg-gradient-to-b from-transparent to-primary/5 rounded-b-3xl">
            <TermsFooterLink variant="inline" />
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium tracking-wide">Desenvolvido por: Kaique Aurelio &amp; Decode Analytics</span>
              <span className="opacity-50">© 2026 Decode Analytics Academy · Todos os direitos reservados</span>
            </div>
          </footer>
        </main>
      </div>

      <AdSidebar />
    </div>
  );
}
