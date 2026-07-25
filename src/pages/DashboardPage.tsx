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
import { ApostilaCoverCard } from '@/components/dashboard/ApostilaCoverCard';
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
import { BookOpen, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';




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
    <div className="min-h-dvh bg-background relative selection:bg-primary/20">
      <Watermark />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <StudentSidebar />

      <div className="flex flex-col min-h-dvh transition-[padding] duration-300 ease-out lg:pl-[var(--student-sidebar-width,356px)]">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-52 rounded-xl bg-muted/30 animate-pulse" />)}
              </div>
            ) : apostilas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma apostila disponível.</p>
            ) : (
              (() => {
                const groups = new Map<string, typeof apostilas>();
                for (const a of apostilas) {
                  const key = (a.category?.trim() || 'Geral');
                  const arr = groups.get(key) ?? [];
                  arr.push(a);
                  groups.set(key, arr);
                }
                const sorted = Array.from(groups.entries()).sort(([a], [b]) =>
                  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
                );
                return (
                  <div className="space-y-8">
                    {sorted.map(([category, items]) => (
                      <div key={category}>
                        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-border/50">
                          <h3 className="font-semibold text-sm text-foreground/90">{category}</h3>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {items.length} {items.length === 1 ? 'apostila' : 'apostilas'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                          {items.map((apostila) => (
                            <ApostilaCoverCard key={apostila.id} apostila={apostila} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </section>


          <Reveal from="bottom" delay={60}>
            <ContinueWhereLeftCard />
          </Reveal>


          <footer className="flex flex-col items-center justify-center gap-3 py-10 mt-6 border-t border-border/30 text-center text-[10px] text-muted-foreground/60">
            <TermsFooterLink variant="inline" />
            <span>Desenvolvido por: Kaique Aurelio &amp; Decode Analytics</span>
          </footer>
        </main>
      </div>

      <AdSidebar />
    </div>
  );
}
