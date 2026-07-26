import { motion } from 'framer-motion';
import {
  MessageSquare,
  Brain,
  BookOpen,
  Target,
  Bot,
  GraduationCap,
  ListChecks,
  Highlighter,
  CalendarClock,
  ShieldCheck,
  MousePointerClick,
  Quote,
} from 'lucide-react';
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
  {
    icon: Highlighter,
    title: 'Resume e destaca',
    desc: 'Transforma um capítulo longo em resumo objetivo e lista o que mais cai na prova.',
  },
  {
    icon: CalendarClock,
    title: 'Organiza a revisão',
    desc: 'Sugere o que revisar hoje com base no seu progresso, flashcards e provas próximas.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Abra a apostila',
    desc: 'A Ella lê o mesmo capítulo que você está lendo — ela já entra na conversa com contexto.',
  },
  {
    step: '02',
    title: 'Pergunte do seu jeito',
    desc: 'Texto, dúvida solta, foto do exercício ou "explica de novo mais simples". Ela entende.',
  },
  {
    step: '03',
    title: 'Pratique na hora',
    desc: 'Peça exercícios, flashcards ou um mini-simulado do tópico e resolva sem trocar de tela.',
  },
];

const EXAMPLE_PROMPTS = [
  'Explica esse conceito como se eu tivesse 15 anos',
  'Faz 5 questões estilo ENEM sobre esse capítulo',
  'Resume esse capítulo em 10 tópicos',
  'Onde eu errei nessa resolução?',
  'Monta um plano de revisão até a prova',
];

const TRUST_POINTS = [
  {
    icon: BookOpen,
    title: 'Responde com base no material',
    desc: 'A resposta parte da apostila da plataforma, não de um palpite genérico da internet.',
  },
  {
    icon: ListChecks,
    title: 'Mostra o raciocínio',
    desc: 'Passo a passo visível, para você conferir a lógica em vez de decorar o resultado.',
  },
  {
    icon: ShieldCheck,
    title: 'Sem custo para o aluno',
    desc: 'Ilimitada e gratuita dentro do app — faz parte da plataforma, não é um extra pago.',
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
    <section
      id="ella"
      className="relative overflow-hidden px-5 py-24 md:py-32"
      style={{
        background:
          'linear-gradient(180deg, hsl(var(--background) / 0.45) 0%, hsl(var(--card) / 0.25) 50%, hsl(var(--background) / 0.45) 100%)',
      }}
    >
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
                  <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
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
                  A assistente de estudos da plataforma. Ela acompanha o aluno dentro das
                  apostilas, tira dúvidas, cobra prática e adapta a didática para cada momento —
                  disponível a qualquer hora, inclusive na madrugada antes da prova.
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
              <h2 className="font-display mt-3 text-3xl leading-[1.1] text-foreground sm:text-4xl md:text-5xl text-balance">
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
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-balance">
                A Ella não é um chat solto colado no canto da tela. Ela vive dentro do conteúdo:
                sabe qual capítulo você abriu, o que você já concluiu e quais provas estão
                chegando. A partir disso ela explica a matéria, cria exercícios extras, corrige seu
                raciocínio e organiza a revisão — do primeiro parágrafo até a véspera da prova.
              </p>
            </motion.div>

            {/* Capabilities grid */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {CAPABILITIES.map((cap, i) => (
                <CapabilityCard key={cap.title} {...cap} index={i} />
              ))}
            </div>

            {/* Como funciona */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <p className="text-[11px] font-mono-label uppercase tracking-[0.22em] text-muted-foreground">
                Como funciona na prática
              </p>
              <ol className="mt-4 space-y-3">
                {HOW_IT_WORKS.map((s) => (
                  <li
                    key={s.step}
                    className="flex gap-4 rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-sm"
                  >
                    <span className="font-mono-label text-sm font-semibold text-primary">{s.step}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-foreground">{s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>

            {/* Exemplos de pergunta */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <p className="flex items-center gap-2 text-[11px] font-mono-label uppercase tracking-[0.22em] text-muted-foreground">
                <MousePointerClick className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                O que os alunos costumam pedir
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((q) => (
                  <li
                    key={q}
                    className="rounded-full border border-border/60 bg-secondary/40 px-3.5 py-1.5 text-xs leading-snug text-secondary-foreground"
                  >
                    “{q}”
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Por que confiar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
              {TRUST_POINTS.map((t) => (
                <div
                  key={t.title}
                  className="rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-sm"
                >
                  <t.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="mt-2.5 text-sm font-semibold leading-tight text-foreground">{t.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Highlight quote */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 rounded-xl border-l-2 border-primary bg-card/40 p-5 backdrop-blur-sm"
            >
              <Quote className="h-4 w-4 text-primary/70" aria-hidden="true" />
              <p className="mt-2 text-sm leading-relaxed text-foreground">
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
