import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { useExamFocus } from '@/hooks/useExamFocus';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { HeroGreetingCard } from '@/components/dashboard/HeroGreetingCard';
import { ActivitiesToDoSection, RecommendedExercisesSection } from '@/components/dashboard/DashboardSections';
import { ApostilasReadingCarousel, ProgressSummaryRow } from '@/components/dashboard/DashboardCarousels';
import { AdBanner } from '@/components/AdBanner';
import { AdSidebar } from '@/components/AdSidebar';
import { Watermark } from '@/components/Watermark';
import { Reveal } from '@/components/Reveal';
import { ExamCalendarWidget } from '@/components/ExamCalendarWidget';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useApostilasList, useExerciseCounts, useDashboardStats } from '@/hooks/queries/useDashboardData';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const gamification = useGamification();
  const examFocus = useExamFocus();
  const { data: profile } = useUserProfile(user?.id);
  const { data: apostilas = [], isLoading: loadingApostilas } = useApostilasList();
  const { data: exerciseCounts = {} } = useExerciseCounts();
  const { data: statsData, isLoading: loadingStats } = useDashboardStats(user?.id);
  const stats = statsData || { total: 0, hits: 0, errors: 0, byApostila: {} };
  const loading = loadingApostilas || loadingStats;
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  const totalExercises = Object.values(exerciseCounts).reduce((sum, count) => sum + count, 0);
  const answeredExercises = stats.hits + stats.errors;
  const overallProgress = totalExercises > 0 ? Math.round((answeredExercises / totalExercises) * 100) : 0;
  const disciplinesTotal = Math.max(new Set(apostilas.map((a) => a.category || 'Geral')).size, 10);
  const apostilasIniciadas = Object.keys(stats.byApostila).length;

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Watermark />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <StudentSidebar />

      <div className="lg:pl-[324px] flex flex-col min-h-screen">
        <DashboardTopbar />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1400px] w-full mx-auto animate-content-show">
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

          <Reveal from="bottom" delay={40}>
            <ApostilasReadingCarousel apostilas={apostilas} exerciseCounts={exerciseCounts} />
          </Reveal>

          <Reveal from="bottom" delay={50}>
            <ProgressSummaryRow
              disciplinas={{ ativas: new Set(apostilas.map((a) => a.category || 'Geral')).size, total: disciplinesTotal }}
              atividades={{ concluidas: apostilasIniciadas, total: apostilas.length }}
              exercicios={{ resolvidos: answeredExercises, total: totalExercises }}
              apostilas={{ lidas: apostilasIniciadas, total: apostilas.length }}
            />
          </Reveal>

          <section id="minhas-disciplinas" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5">
            <header className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-base">Minhas Disciplinas</h2>
            </header>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />)}
              </div>
            ) : apostilas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma apostila disponível.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apostilas.slice(0, 8).map((apostila) => (
                  <a
                    key={apostila.id}
                    href={`/apostila/${apostila.id}`}
                    className="text-left rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-primary/40 transition-all p-4 group"
                  >
                    <div className="text-[10px] uppercase tracking-widest font-bold mb-1 text-primary">
                      {apostila.category || 'Geral'}
                    </div>
                    <div className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {apostila.title}
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {(exerciseCounts[apostila.id] || 0)} exercícios
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          <footer className="text-center text-[10px] text-muted-foreground/60 py-6 mt-6 border-t border-border/30">
            Desenvolvido por: Kaique Aurelio &amp; Decode Analytics
          </footer>
        </main>
      </div>

      <AdSidebar />
    </div>
  );
}
