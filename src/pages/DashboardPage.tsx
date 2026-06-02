import { useEffect, useMemo, useState } from 'react';
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
import { useApostilasList, useExerciseCounts, useDashboardStats, type ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { ArrowRight, BookOpen, ClipboardList, Layers3, Library, PenLine, Sparkles } from 'lucide-react';

function buildCategoryGroups(apostilas: ApostilaSummary[]) {
  return apostilas.reduce((acc, apostila) => {
    const category = apostila.category || 'Geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(apostila);
    return acc;
  }, {} as Record<string, ApostilaSummary[]>);
}

function StudyFeedSection({ apostilas, exerciseCounts }: { apostilas: ApostilaSummary[]; exerciseCounts: Record<string, number> }) {
  const feedItems = apostilas.slice(0, 9);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold leading-tight">Continue rolando e estudando</h2>
            <p className="text-xs text-muted-foreground">Materiais recentes organizados como feed para manter o fluxo.</p>
          </div>
        </div>
        <a href="/biblioteca" className="hidden text-xs font-bold text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1">
          Biblioteca <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </header>

      {feedItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Nenhum material disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {feedItems.map((apostila, index) => (
            <a
              key={`${apostila.id}-${index}`}
              href={`/apostila/${apostila.id}`}
              className="group rounded-xl border border-border/60 bg-background/45 p-4 transition-all hover:border-primary/45 hover:bg-muted/20"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {apostila.category || 'Geral'}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">#{index + 1}</span>
              </div>
              <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug group-hover:text-primary">{apostila.title}</h3>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{exerciseCounts[apostila.id] || 0} exercícios</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function DisciplineFlowSection({ groups }: { groups: Record<string, ApostilaSummary[]> }) {
  const entries = Object.entries(groups).slice(0, 6);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Layers3 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold leading-tight">Trilhas por disciplina</h2>
          <p className="text-xs text-muted-foreground">Blocos em sequência para a página continuar rendendo no estudo.</p>
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Sem disciplinas carregadas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {entries.map(([category, items]) => (
            <div key={category} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-bold">{category}</h3>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{items.length} itens</span>
              </div>
              <div className="space-y-2">
                {items.slice(0, 3).map((apostila) => (
                  <a
                    key={apostila.id}
                    href={`/apostila/${apostila.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border/45 bg-muted/10 px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-muted/25"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold group-hover:text-primary">{apostila.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickPracticeSection({ apostilas, exerciseCounts }: { apostilas: ApostilaSummary[]; exerciseCounts: Record<string, number> }) {
  const items = apostilas.filter((apostila) => (exerciseCounts[apostila.id] || 0) > 0).slice(0, 6);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <ClipboardList className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold leading-tight">Revisão rápida</h2>
          <p className="text-xs text-muted-foreground">Mais exercícios para a rolagem não terminar cedo.</p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Sem exercícios vinculados ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((apostila) => (
            <a
              key={apostila.id}
              href={`/apostila/${apostila.id}#exercicios`}
              className="group flex min-h-24 items-center gap-3 rounded-xl border border-border/60 bg-background/45 p-4 transition-all hover:border-warning/45 hover:bg-muted/20"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <PenLine className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold group-hover:text-primary">{apostila.category || 'Geral'}</span>
                <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{apostila.title}</span>
              </span>
              <span className="shrink-0 rounded-full border border-warning/30 px-2 py-1 text-[10px] font-bold text-warning">
                {exerciseCounts[apostila.id] || 0}
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function EndlessHintSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/35 bg-card p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Library className="h-3.5 w-3.5" />
            Fluxo contínuo
          </div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">A página agora termina convidando a continuar.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            O dashboard fica com aparência de feed: ao rolar, o aluno encontra novos blocos de estudo, revisão e biblioteca sem sentir que a tela acabou de repente.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {['Estudar', 'Revisar', 'Avançar'].map((label) => (
            <div key={label} className="rounded-xl border border-border/60 bg-background/45 px-3 py-4">
              <div className="mx-auto mb-2 h-2 w-12 rounded-full bg-primary" />
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
  const categoryGroups = useMemo(() => buildCategoryGroups(apostilas), [apostilas]);

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

      <div className="flex flex-col min-h-screen transition-[padding] duration-300 ease-out lg:pl-[var(--student-sidebar-width,356px)]">
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

          <Reveal from="bottom" delay={60}>
            <StudyFeedSection apostilas={apostilas} exerciseCounts={exerciseCounts} />
          </Reveal>

          <Reveal from="bottom" delay={70}>
            <DisciplineFlowSection groups={categoryGroups} />
          </Reveal>

          <Reveal from="bottom" delay={80}>
            <QuickPracticeSection apostilas={apostilas} exerciseCounts={exerciseCounts} />
          </Reveal>

          <Reveal from="bottom" delay={90}>
            <EndlessHintSection />
          </Reveal>

          <footer className="text-center text-[10px] text-muted-foreground/60 py-10 mt-6 border-t border-border/30">
            Desenvolvido por: Kaique Aurelio &amp; Decode Analytics
          </footer>
        </main>
      </div>

      <AdSidebar />
    </div>
  );
}
