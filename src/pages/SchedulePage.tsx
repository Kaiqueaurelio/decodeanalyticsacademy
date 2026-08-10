import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarRange } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ScheduleGrid, type ScheduleSlot, type CoordinatorSlot } from '@/components/dashboard/ScheduleGrid';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { PageTransition } from '@/components/PageTransition';

export default function SchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const semester = profile?.semester || 6; // Default to 6 as requested by current context

  // Mock data based on the provided image/prompt for the 6th semester
  const slots: ScheduleSlot[] = [
    {
      dayNumber: 1,
      startTime: '19:10',
      endTime: '20:25',
      subject: 'Sist Operac Abertos e Mobile',
      professor: 'Prof. Anderson Lima'
    },
    {
      dayNumber: 1,
      startTime: '20:45',
      endTime: '22:00',
      subject: 'Sist Operac Abertos e Mobile',
      professor: 'Prof. Anderson Lima'
    },
    {
      dayNumber: 2,
      startTime: '19:10',
      endTime: '20:25',
      subject: 'Calculo Numerico Computacional',
      professor: 'Prof. Jorge Amaral',
      isQuinzenal: true
    },
    {
      dayNumber: 2,
      startTime: '20:45',
      endTime: '22:00',
      subject: 'Calculo Numerico Computacional',
      professor: 'Prof. Jorge Amaral',
      isQuinzenal: true
    },
    {
      dayNumber: 3,
      startTime: '19:10',
      endTime: '20:25',
      subject: 'Pesquisa Operacional',
      professor: 'Prof. Dr. Ricardo Silva'
    },
    {
      dayNumber: 3,
      startTime: '20:45',
      endTime: '22:00',
      subject: 'Gestão de Projetos',
      professor: 'Prof. Andre Luiz'
    },
    {
      dayNumber: 4,
      startTime: '19:10',
      endTime: '20:25',
      subject: 'Aspct Teóricos da Computacao',
      professor: 'Profa. Ana Paula'
    },
    {
      dayNumber: 4,
      startTime: '20:45',
      endTime: '22:00',
      subject: 'Procs de Imagem e Visao Comp',
      professor: 'Prof. Luiz Henrique'
    }
  ];

  const coordinators: CoordinatorSlot[] = [
    {
      name: 'Alexandre Bezolan',
      day: 'Segunda',
      startTime: '18:30',
      endTime: '21:00'
    },
    {
      name: 'Alexandre Bezolan',
      day: 'Quinta',
      startTime: '18:30',
      endTime: '21:00'
    }
  ];

  const specialDisciplines = [
    'Avaliência de Dados',
    'Métodos de Pesquisa',
    'Ciência da Computação Interdis'
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-primary" />
                  <h1 className="font-display font-black text-2xl tracking-tight uppercase">Horário de Aula</h1>
                </div>
                <p className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase mt-0.5">
                  Grade Curricular · Ciências da Computação
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Background elements for high-tech look */}
            <div className="absolute -top-24 -right-24 h-96 w-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <ScheduleGrid
              semester={semester}
              year={2026}
              campus="Alphaville"
              period="Noite"
              courseCode="CCG/CCGQ"
              slots={slots}
              coordinators={coordinators}
              specialDisciplines={specialDisciplines}
            />
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
