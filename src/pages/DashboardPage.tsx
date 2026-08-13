import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { useExamFocus } from '@/hooks/useExamFocus';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import BuyMeCoffeeButton from '@/components/BuyMeCoffeeButton';
import { HallOfFame } from '@/components/HallOfFame';
import { HeroGreetingCard } from '@/components/dashboard/HeroGreetingCard';
import { ActivitiesToDoSection, RecommendedExercisesSection } from '@/components/dashboard/DashboardSections';
import { ProgressSummaryRow } from '@/components/dashboard/DashboardCarousels';
import { SubjectFolderGrid } from '@/components/dashboard/SubjectFolderGrid';
import { SemesterFilter } from '@/components/dashboard/filters/SemesterFilter';
import { AdBanner } from '@/components/AdBanner';
import { AdSidebar } from '@/components/AdSidebar';
import { Watermark } from '@/components/Watermark';
import { Reveal } from '@/components/Reveal';
import { GamificationWidget } from '@/components/gamification/GamificationWidget';
import { ExamCalendarWidget } from '@/components/ExamCalendarWidget';
import { OnboardingTour } from '@/components/OnboardingTour';
import { TermsFooterLink } from '@/components/TermsFooterLink';
import { ContinueWhereLeftCard } from '@/components/ContinueWhereLeftCard';
import { StudyHeatmap } from '@/components/gamification/StudyHeatmap';
import { useApostilasList, useExerciseCounts, useDashboardStats, type ApostilaSummary } from '@/hooks/queries/useDashboardData';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { BY_SEMESTER, canonicalSubjectKey } from '@/lib/subject-semester-map';
import { BookOpen, Search, X, PenLine, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewUpdatePopup } from '@/components/NewUpdatePopup';




export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const gamification = useGamification();
  const examFocus = useExamFocus();
  const { data: profile } = useUserProfile(user?.id);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedSemestre');
    if (saved) return parseInt(saved, 10);
    return null; 
  });

  // Sincroniza o semestre inicial com o perfil do aluno
  useEffect(() => {
    if (profile?.semester && selectedSemester === null && !localStorage.getItem('selectedSemestre')) {
      setSelectedSemester(profile.semester);
    } else if (selectedSemester === null && !localStorage.getItem('selectedSemestre')) {
      // Se não houver preferência salva nem semestre no perfil, não filtramos por padrão para mostrar tudo
      setSelectedSemester(null); 
    }
  }, [profile?.semester]);

  const { data: apostilasRaw = [], isLoading: loadingApostilas } = useApostilasList({ semester: selectedSemester });
  const { data: exerciseCounts = {} } = useExerciseCounts();
  const { data: statsData, isLoading: loadingStats } = useDashboardStats(user?.id);
  const stats = statsData || { total: 0, hits: 0, errors: 0, byApostila: {} };
  const loading = loadingApostilas || loadingStats;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [query, setQuery] = useState('');

  // Lógica de processamento de apostilas (filtro + placeholders de semestres futuros)
  const apostilas = useMemo(() => {
    // 1. Filtragem por semestre se selecionado
    // Bônus é transversal e deve continuar acessível em qualquer semestre.
    // Se NÃO selecionado, retorna tudo publicado.
    const list = selectedSemester
      ? apostilasRaw.filter(a => (a.semester === selectedSemester || a.semester === 0 || a.category === 'Bônus' || a.category === 'Canivete Suíço do Estudante' || a.category?.includes('Bônus')) && a.published)
      : apostilasRaw.filter(a => a.published);

    // 2. Placeholder para disciplinas da grade (1º ao 8º)
    const showAcademicPlaceholders = true;
    if (selectedSemester && showAcademicPlaceholders) {
      const canonicalSubjects = BY_SEMESTER[selectedSemester] || [];
      const teacherMap: Record<string, string> = {
        'Logica de Programacao': 'Prof. Dr. Ricardo Silva',
        'Matematica Discreta': 'Profa. Ana Paula',
        'Introducao a Computacao': 'Prof. Anderson Lima',
        'Comunicacao e Expressao': 'Profa. Mariana Costa',
        'Fundamentos de Sistemas de Informacao': 'Prof. Jorge Amaral',
        'Orientada a Objeto (POO)': 'Prof. Luiz Henrique',
        'Calculo Diferencial e Integral I': 'Prof. Valter Braga',
        'Algebra Linear': 'Prof. Fabio Souza',
        'Arquitetura e Organizacao de Computadores': 'Prof. Roberto Santos',
        'Estrutura de Dados': 'Prof. Anderson Lima',
        'Banco de Dados': 'Prof. Carlos Oliveira',
        'Engenharia de Software': 'Profa. Ana Paula',
        'Programacao Web': 'Prof. Sergio Murilo',
        'Analise e Projeto de Sistemas': 'Prof. Andre Luiz',
        'Sistemas Operacionais e Mobile': 'Prof. Anderson Lima',
        'Calculo Numerico Computacional': 'Prof. Jorge Amaral',
        'Pesquisa Operacional': 'Prof. Dr. Ricardo Silva',
        'Aspectos Teoricos da Computacao': 'Profa. Ana Paula',
        'Processamento de Imagem e Visao Computacional': 'Prof. Luiz Henrique',
        'Ciencia de Dados': 'Profa. Mariana Costa',
        'Metodos de Pesquisa': 'Profa. Clarisse Lispector',
        'Interdisciplinar de Ciencia da Computacao': 'Coordenacao CC',
        'Engenharia de Software II': 'Profa. Ana Paula',
        'Mineracao de Dados': 'Profa. Mariana Costa',
        'Analise de Algoritmos': 'Prof. Luiz Henrique',
        'Seguranca da Informacao': 'Prof. Carlos Oliveira',
        'Computacao em Nuvem': 'Prof. Roberto Santos',
        'Aprendizado de Maquina (Machine Learning)': 'Prof. Fabiano Gomes',
        'Topicos Especiais de Computacao': 'Prof. Sergio Murilo',
        'Sistemas Digitais': 'Prof. Fabio Souza',
        'Trabalho de Conclusao de Curso (TCC)': 'Coordenacao CC',
        'Empreendedorismo': 'Prof. Marcos Viana',
        'Gestao de Projetos': 'Prof. Andre Luiz',
        'Etica Profissional': 'Profa. Clarisse Lispector',
        'Computacao de Alto Desempenho': 'Prof. Valter Braga',
      };

      // Criar lista de disciplinas (materias) que já existem no banco para este semestre
      const existingCategoriesKeys = new Set(list.map(a => canonicalSubjectKey(a.category)));

      // Gerar placeholders apenas para as disciplinas da grade que NÃO possuem nenhum conteúdo vinculado
      const placeholders = canonicalSubjects
        .filter(subject => !existingCategoriesKeys.has(canonicalSubjectKey(subject)))
        .map((subject, idx) => ({
          id: `placeholder-${selectedSemester}-${idx}`,
          title: `Caderno de ${subject}`,
          category: subject,
          semester: selectedSemester,
          isPlaceholder: true,
          published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cover_url: null,
          file_url: null,
          source_type: null,
          course: null,
          teacher: teacherMap[subject] || 'Professor da Disciplina'
        }));

      return [...list, ...placeholders] as any as ApostilaSummary[];
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
    
    // Marcar do 1º ao 5º semestre como concluído e maximizar gamificação para admin
    const markCompleted = async () => {
      try {
        await supabase.rpc('force_complete_semesters_upto_five', { _user_id: user.id });
        // RPC para o 6º ao 8º semestre removida para permitir progresso real nessas apostilas
        // await (supabase.rpc as any)('complete_semesters_six_to_eight', { _user_id: user.id });
        
        // Maximizar para administrador
        if (profile?.is_admin || user.email === 'decoanalytics@outlook.com.br') {
          // Maximizar para administrador (XP real: 9900/Lv99/365d)
          await (supabase.rpc as any)('maximize_user_gamification', { _user_id: user.id });
          gamification.loadAll();
        }
      } catch (e) {
        console.error("Erro ao sincronizar progresso acadêmico:", e);
      }
    };
    markCompleted();

    const seen = localStorage.getItem('decode_onboarding_done');
    if (!seen) setShowOnboarding(true);
    gamification.updateStreak();
    gamification.checkAndAwardBadge('first_login');

    // Notificação persistente para perfis incompletos
    if (profile && (!profile.full_name || profile.full_name.length < 3 || (profile.account_type === 'ra' && (!profile.email || (profile.email && profile.email.endsWith('@ra.unip.local')))))) {
      toast.info("Perfil Incompleto", {
        description: "Por favor, preencha seu nome e e-mail no perfil para habilitar todas as funções da comunidade.",
        duration: 8000,
        action: {
          label: "Completar",
          onClick: () => {
            const btn = document.querySelector('[data-ra-prompt-trigger]') as HTMLButtonElement;
            if (btn) btn.click();
            else navigate('/profile');
          }
        }
      });
    }
  }, [user, profile?.is_admin, profile?.full_name]);

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
  const heatmapData = stats.byApostila ? Object.entries(stats.byApostila).map(([_, s]: any) => ({
    date: new Date().toISOString().split('T')[0], // Fallback para data atual se não houver timestamp no stats
    count: (s.hits || 0) + (s.errors || 0)
  })) : [];
  
  const disciplinesTotal = Math.max(new Set(apostilas.map((a) => a.category || 'Geral')).size, 10);
  const apostilasIniciadas = Object.keys(stats.byApostila).length;

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 overflow-x-hidden">
      <Watermark />
      <NewUpdatePopup />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      <StudentSidebar />

      <div className="flex flex-col min-h-screen transition-[padding] duration-300 ease-out">
        <DashboardTopbar hideSearchOnMobile />

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-6 space-y-8 max-w-[1600px] w-full mx-auto animate-content-show pt-12 pb-24">
          {isAdmin && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 border border-accent/20">
              <ShieldCheck className="h-3 w-3 text-accent" />
              <span className="text-[9px] font-black uppercase tracking-wider text-accent">Modo Administrador Ativo</span>
              <div className="h-1 w-1 rounded-full bg-accent animate-pulse ml-1" />
            </div>
          )}

          <ContinueWhereLeftCard />

          {/* Dashboard Summary Bar */}
          <div className="flex flex-wrap items-center gap-4 pb-2 border-b border-border/10 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Disciplinas</span>
                <span className="text-xs font-bold">{disciplinesTotal} Ativas</span>
              </div>
            </div>
            
            <div className="h-4 w-px bg-border/40" />

            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <PenLine className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 leading-none">Exercícios</span>
                <span className="text-xs font-bold">{answeredExercises} Resolvidos</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-primary uppercase leading-none">Progresso Geral</span>
                <span className="text-xs font-black">{overallProgress}%</span>
              </div>
              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden hidden sm:block">
                <div 
                  className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)] transition-all duration-1000" 
                  style={{ width: `${overallProgress}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <AdBanner position="inline" />
            </div>
            <div className="flex shrink-0 items-center justify-center p-2 rounded-2xl bg-primary/5 border border-primary/10">
              <BuyMeCoffeeButton variant="minimal" size="small" showText={false} />
            </div>
          </div>

          <Reveal from="bottom" delay={10}>
            <HeroGreetingCard
              name={profile?.full_name || ''}
              overallProgress={overallProgress}
              totalApostilas={Array.isArray(apostilas) ? apostilas.length : 0}
              totalAnswered={answeredExercises}
            />
          </Reveal>

          <Reveal from="bottom" delay={15}>
            <GamificationWidget />
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 space-y-5">
              <Reveal from="bottom" delay={20}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StudyHeatmap data={heatmapData} />
                </div>
              </Reveal>

              <div id="atividades">
                <Reveal from="bottom" delay={25}>
                  <ActivitiesToDoSection
                    apostilas={Array.isArray(apostilas) ? apostilas : []}
                    exerciseCounts={exerciseCounts || {}}
                    examFocusSubject={examFocus?.subject || null}
                  />
                </Reveal>
              </div>

              <Reveal from="bottom" delay={30}>
                <RecommendedExercisesSection 
                  apostilas={Array.isArray(apostilas) ? apostilas : []} 
                  exerciseCounts={exerciseCounts || {}} 
                />
              </Reveal>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <Reveal from="bottom" delay={20}>
                <div className="space-y-5">
                  <HallOfFame />
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <header className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-base">Agenda · Próximos prazos</h3>
                    </header>
                    <ExamCalendarWidget />
                  </div>
                </div>
              </Reveal>
              
              <Reveal from="bottom" delay={40}>
                <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-accent/5 p-5">
                  <header className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Busca Rápida</h3>
                      <p className="text-[10px] text-muted-foreground">Pule direto para uma aula</p>
                    </div>
                  </header>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Pressione '/' para buscar..."
                      className="h-9 pl-9 text-xs bg-background/40"
                      onFocus={(e) => {
                        e.target.blur();
                        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                        if (searchInput) {
                          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          searchInput.focus();
                        }
                      }}
                    />
                  </div>
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

          <section id="minhas-disciplinas" className="scroll-mt-24 rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-500">
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
              <DashboardSkeleton />
            ) : apostilas.length === 0 ? (

              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma apostila disponível.</p>
            ) : (
              <div className="space-y-6">
                <SubjectFolderGrid
                  apostilas={apostilas}
                  exerciseCounts={exerciseCounts}
                  stats={stats}
                  query={query}
                />
              </div>
            )}
          </section>





          <footer className="flex flex-col items-center justify-center gap-3 py-10 mt-6 border-t border-border/10 text-center text-[10px] text-muted-foreground/60 bg-gradient-to-b from-transparent to-primary/5 rounded-b-3xl">
            <TermsFooterLink variant="inline" />
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium tracking-wide">Desenvolvido por: Kaique Aurelio &amp; Decode Analytics</span>
            </div>
          </footer>
        </main>
      </div>

      <AdSidebar />
    </div>
  );
}
