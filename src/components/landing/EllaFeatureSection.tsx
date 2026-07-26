import { motion } from 'framer-motion';
import { MessageSquare, Brain, BookOpen, Target, Sparkles, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import ellaAvatar from '@/assets/ella-avatar.jpg';

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: 'Tira dúvidas',
    desc: 'Respostas claras sobre qualquer ponto da apostila, sem precisar sair do app.',
  },
  {
    icon: Brain,
    title: 'Explica passo a passo',
    desc: 'Quando um conceito não entra, ela reformula até você entender.',
  },
  {
    icon: BookOpen,
    title: 'Gera exercícios',
    desc: 'Cria questões extras contextualizadas no conteúdo que você está vendo.',
  },
  {
    icon: Target,
    title: 'Modo ENEM',
    desc: 'Adapta o tom e o foco quando você estuda para o vestibular.',
  },
];

function CapabilityCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.45,
        delay: 0.1 + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm',
        'transition-all duration-200',
        'hover:border-primary/30 hover:bg-card/70 hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10',
          'transition-transform duration-200 group-hover:scale-105',
        )}
      >
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <h4 className="mt-3 text-sm font-semibold leading-tight text-foreground">{title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

export function EllaFeatureSection() {
  return (
    <section id="ella" className="relative py-24 md:py-32 px-5 overflow-hidden">
      {/* Ambient glow — usando primary/accent do tema, sem cores hardcoded */}
      <div
        className="pointer-events-none absolute -left-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full blur-[140px] opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 60%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-1/3 h-[360px] w-[360px] rounded-full blur-[140px] opacity-16"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left — Avatar / identity */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div
              className={cn(
                'relative mx-auto w-fit rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm',
                'sm:p-8',
              )}
            >
              {/* Avatar with ring */}
              <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48">
                <div
                  className="absolute -inset-3 rounded-full opacity-40 blur-xl"
                  style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
                  aria-hidden="true"
                />
                <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-primary/30 bg-card">
                  <img
                    src={ellaAvatar}
                    alt="Ella Ribeiro"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-[11px] font-mono-label uppercase tracking-[0.22em] text-primary">
                  Assistente de estudos
                </p>
                <h3 className="font-display mt-2 text-3xl leading-[1.1] text-foreground sm:text-4xl">
                  Ella Ribeiro
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Nossa própria inteligência artificial de aprendizado. Ela acompanha o aluno dentro
                  das apostilas, tira dúvidas e adapta a didática para cada momento.
                </p>
              </div>

              {/* Creator credit */}
              <div className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-secondary/40 px-4 py-3">
                <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-xs leading-snug text-secondary-foreground">
                  Criada e desenvolvida por{' '}
                  <span className="font-semibold text-foreground">Kaique Aurélio</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — Content */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-mono-label uppercase tracking-[0.22em] text-primary">
                Inteligência própria
              </p>
              <h2 className="font-display mt-3 text-3xl leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
                Uma tutora que{' '}
                <span
                  className="text-gradient"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                  }}
                >
                  pensa com você
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Dentro do app, a Ella Ribeiro está presente em cada etapa do estudo: ela explica a
                matéria, cria exercícios extras, ajuda na revisão e mantém o aluno no ritmo. Tudo
                feito sob medida para a realidade de quem estuda com a gente.
              </p>
            </motion.div>

            {/* Capabilities grid */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {CAPABILITIES.map((cap, i) => (
                <CapabilityCard key={cap.title} {...cap} index={i} />
              ))}
            </div>

            {/* Highlight quote */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 rounded-xl border-l-2 border-primary bg-card/40 p-5 backdrop-blur-sm"
            >
              <p className="text-sm leading-relaxed text-foreground">
                “A Ella não substitui o professor — ela amplia o estudo fora da sala de aula, com
                paciência infinita e sempre no contexto do que você está lendo.”
              </p>
              <p className="mt-2 text-xs text-muted-foreground">— Kaique Aurélio, criador da plataforma</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
