import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Reveal, RevealStagger } from '@/components/Reveal';
import { cn } from '@/lib/utils';
import {
  Star,
  Quote,
  Presentation,
  Headphones,
  Video,
  BookOpen,
  TrendingUp,
  Users,
  School,
  GraduationCap,
  Play,
  Volume2,
  MonitorPlay,
} from 'lucide-react';

interface Testimonial {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  course: string | null;
  semester: number | null;
  created_at: string;
  profile?: { full_name: string };
}

interface CaseStudy {
  id: string;
  icon: React.ElementType;
  category: string;
  title: string;
  result: string;
  description: string;
  tags: { label: string; icon: React.ElementType }[];
  stat: string;
  statLabel: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-escola',
    icon: School,
    category: 'Escola parceira',
    title: 'Conteúdo multimídia no ensino médio',
    result: 'Aulas mais dinâmicas e retenção de atenção maior',
    description:
      'Uma escola parceira integrou as apostilas em formato de slides e vídeos curtos nas revisões de Matemática e Ciências. Os alunos passaram a revisar o conteúdo fora da sala, liberando tempo para debates em aula.',
    tags: [
      { label: 'Slides', icon: Presentation },
      { label: 'Vídeos', icon: Video },
    ],
    stat: '+34%',
    statLabel: 'engajamento nas revisões',
  },
  {
    id: 'case-aluno-cc',
    icon: GraduationCap,
    category: 'Aluno de CC',
    title: 'Estudar no trajeto com audiocast',
    result: 'Mais horas de estudo sem aumentar o tempo sentado',
    description:
      'Aluno do 4º semestre de Ciência da Computação passou a ouvir os resumos em áudio no ônibus. Combinou audiocast com exercícios práticos e viu a nota em Algoritmos subir consistentemente.',
    tags: [
      { label: 'Audiocast', icon: Headphones },
      { label: 'Exercícios', icon: BookOpen },
    ],
    stat: '2h',
    statLabel: 'de estudo extra por dia',
  },
  {
    id: 'case-turma-si',
    icon: Users,
    category: 'Turma de SI',
    title: 'Slides + vídeos para fixação em grupo',
    result: 'Melhor desempenho coletivo em provas de Banco de Dados',
    description:
      'Turma de Sistemas de Informação usou os slides da apostila em encontros de estudo e os vídeos explicativos para esclarecer dúvidas antes das provas. O resultado foi uma média mais alta e menos reprovações.',
    tags: [
      { label: 'Slides', icon: Presentation },
      { label: 'Vídeos', icon: MonitorPlay },
      { label: 'Áudio', icon: Volume2 },
    ],
    stat: '87%',
    statLabel: 'de aprovação na disciplina',
  },
];

const getInitials = (name: string) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'AL';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const displayName = (name: string) => {
  const trimmed = (name || '').trim();
  return trimmed || 'Aluno';
};

const formatRole = (course: string | null, semester: number | null) => {
  if (!course && !semester) return 'Aluno · Decode Analytics';
  const c = course === 'OUTRO' ? 'Aluno' : `Aluno de ${course || ''}`.trim();
  const s = semester ? ` · ${semester}º sem.` : '';
  return `${c}${s}`;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Avaliação ${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-3.5 w-3.5 transition-colors duration-200',
            n <= rating ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground/40'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const Icon = study.icon;

  return (
    <Reveal delay={index * 120}>
      <Card
        className={cn(
          'group h-full overflow-hidden bg-card/80 backdrop-blur-sm',
          'border-border/60 transition-all duration-200',
          'hover:border-primary/30 hover:bg-card hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.08)]',
          'focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20'
        )}
      >
        <CardContent className="flex h-full flex-col p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  'bg-primary/10 text-primary',
                  'transition-colors duration-200 group-hover:bg-primary/15'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] font-mono-label tracking-wider">
                  {study.category}
                </Badge>
                <h3 className="mt-1 text-base font-semibold leading-tight text-foreground">
                  {study.title}
                </h3>
              </div>
            </div>
            <Quote className="h-5 w-5 shrink-0 text-muted-foreground/30" aria-hidden="true" />
          </div>

          {/* Result highlight */}
          <p className="mt-4 text-sm font-medium leading-relaxed text-primary">{study.result}</p>

          {/* Description */}
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {study.description}
          </p>

          {/* Media tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {study.tags.map((tag) => {
              const TagIcon = tag.icon;
              return (
                <span
                  key={tag.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
                    'bg-secondary text-secondary-foreground',
                    'transition-colors duration-200 group-hover:bg-secondary/80'
                  )}
                >
                  <TagIcon className="h-3 w-3" aria-hidden="true" />
                  {tag.label}
                </span>
              );
            })}
          </div>

          {/* Stat */}
          <div className="mt-5 flex items-center gap-3 border-t border-border/40 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-foreground">{study.stat}</p>
              <p className="text-[11px] text-muted-foreground">{study.statLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Reveal>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const name = displayName(testimonial.profile?.full_name || '');
  const initials = getInitials(testimonial.profile?.full_name || '');

  return (
    <Reveal delay={index * 80}>
      <Card
        className={cn(
          'group h-full bg-card/60 backdrop-blur-sm',
          'border-border/50 transition-all duration-200',
          'hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_-6px_hsl(var(--foreground)/0.06)]',
          'focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/15'
        )}
      >
        <CardContent className="flex h-full flex-col p-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-border/60 bg-secondary text-secondary-foreground transition-colors duration-200 group-hover:border-primary/30">
              <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {formatRole(testimonial.course, testimonial.semester)}
              </p>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
            "{testimonial.content}"
          </blockquote>

          {/* Rating */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <StarRating rating={testimonial.rating} />
          </div>
        </CardContent>
      </Card>
    </Reveal>
  );
}

function CaseStudiesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-80 animate-pulse bg-card/40 border-border/30" />
      ))}
    </div>
  );
}

function TestimonialsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-56 animate-pulse bg-card/40 border-border/30" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from('testimonials' as any)
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(9);

        const list = (data as any[]) || [];
        if (list.length) {
          const userIds = [...new Set(list.map((t) => t.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          const map = new Map((profiles || []).map((p) => [p.user_id, p]));
          if (!cancelled) {
            setItems(
              list.map((t) => ({
                ...t,
                profile: map.get(t.user_id) || { full_name: '' },
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load testimonials:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="depoimentos" className="relative overflow-hidden py-24 md:py-32">
      {/* Subtle background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mb-14 text-center md:mb-16">
          <p className="text-[11px] font-mono-label uppercase tracking-[0.22em] text-primary">
            Resultados reais
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
            Quem usa, <span className="text-primary">aprende mais</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Estudos de caso e depoimentos de alunos e escolas que transformaram a rotina de estudos
            com apostilas, slides, audiocast e vídeos.
          </p>
        </Reveal>

        {/* Case studies */}
        <div className="mb-20 md:mb-24">
          <Reveal delay={80}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Play className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Estudos de caso</h3>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CASE_STUDIES.map((study, i) => (
              <CaseStudyCard key={study.id} study={study} index={i} />
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div>
          <Reveal delay={80}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Quote className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Depoimentos</h3>
              </div>
              {!loading && items.length > 0 && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px]">
                  {items.length} avaliações
                </Badge>
              )}
            </div>
          </Reveal>

          {loading ? (
            <TestimonialsSkeleton />
          ) : items.length === 0 ? (
            <Reveal>
              <Card className="border-border/50 bg-card/40 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Ainda não há depoimentos aprovados. Os primeiros relatos aparecerão aqui em breve.
                </p>
              </Card>
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
