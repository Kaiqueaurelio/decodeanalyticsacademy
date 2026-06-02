import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { AdBanner } from '@/components/AdBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { COURSE_AREAS, COURSES_PAGE_STATS, FREE_COURSES } from '@/data/free-courses';
import { cn } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, ExternalLink, GraduationCap, Info, PlusCircle } from 'lucide-react';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState('Todos');

  const courses = useMemo(() => {
    if (selectedArea === 'Todos') return FREE_COURSES;
    return FREE_COURSES.filter((course) => course.area === selectedArea);
  }, [selectedArea]);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Watermark />
      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Cursos gratuitos
          </Badge>
        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <GraduationCap className="h-3.5 w-3.5" /> Cursos validos pela faculdade
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                  Cursos gratuitos para horas complementares e reforco academico
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Uma area separada para publicar cursos gratuitos, links oficiais e observacoes de validade antes do aluno enviar certificado para a faculdade.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-muted-foreground">
                  Antes de divulgar como valido, confirme carga horaria, certificado e regra atual da faculdade. A tela ja deixa essa observacao visivel para evitar confusao.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {COURSES_PAGE_STATS.map((stat) => (
            <Card key={stat.label} className="rounded-xl border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xl font-bold leading-none">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {COURSE_AREAS.map((area) => (
            <Button
              key={area}
              type="button"
              size="sm"
              variant={selectedArea === area ? 'default' : 'outline'}
              className="h-8 shrink-0 rounded-full px-4 text-xs"
              onClick={() => setSelectedArea(area)}
            >
              {area}
            </Button>
          ))}
        </div>

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {courses.map((course) => {
            const isReady = course.status === 'available' && course.linkUrl !== '#';
            return (
              <article key={course.id} className="rounded-2xl border border-border bg-card/80 p-3 shadow-sm transition-colors hover:border-primary/30 sm:p-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <course.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                          {course.area}
                        </Badge>
                        {course.featured && (
                          <Badge className="h-5 rounded-full px-2 text-[10px]">Destaque</Badge>
                        )}
                        <Badge variant={isReady ? 'secondary' : 'outline'} className={cn('h-5 rounded-full px-2 text-[10px]', !isReady && 'text-muted-foreground')}>
                          {isReady ? 'Disponivel' : 'Aguardando link'}
                        </Badge>
                      </div>
                      <h2 className="text-sm font-bold leading-snug text-foreground sm:text-lg">{course.title}</h2>
                      <p className="text-[11px] sm:text-xs font-medium text-primary/90">{course.provider}</p>
                    </div>

                    <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground line-clamp-3 sm:line-clamp-none">{course.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-muted-foreground">
                      <div className="rounded-lg bg-muted/30 px-2.5 py-1.5">
                        <span className="font-semibold text-foreground">Carga:</span> {course.workload}
                      </div>
                      <div className="rounded-lg bg-muted/30 px-2.5 py-1.5">
                        <span className="font-semibold text-foreground">Cert.:</span> sim
                      </div>
                    </div>

                    <div className="hidden sm:block rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
                      {course.validityNote}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <Button
                        size="sm"
                        disabled={!isReady}
                        className="h-8 gap-1.5 text-xs flex-1 sm:flex-none"
                        onClick={() => window.open(course.linkUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Abrir
                      </Button>
                      {!isReady && (
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs flex-1 sm:flex-none" disabled>
                          <PlusCircle className="h-3.5 w-3.5" /> Aguardando link
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <div className="mt-8">
          <AdBanner position="inline" />
        </div>
      </main>
    </div>
  );
}
