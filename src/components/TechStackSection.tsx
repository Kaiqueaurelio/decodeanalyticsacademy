import {
  Code2, Atom, Type, Wind, Database, Activity, Smartphone, GitBranch,
  BookOpen, Brain, Trophy, Users, Calendar, Lock, Bell, Timer,
  Lightbulb, Hammer, Rocket,
} from 'lucide-react';

const TIMELINE = [
  {
    icon: Lightbulb,
    phase: 'Ideia',
    title: 'O problema',
    desc: 'Apostilas espalhadas, links quebrados e exercícios perdidos no meio das conversas da turma.',
  },
  {
    icon: Hammer,
    phase: 'Construção',
    title: 'Mãos à obra',
    desc: 'Construído em paralelo com as aulas, transformando necessidades reais em recursos úteis.',
  },
  {
    icon: Rocket,
    phase: 'Hoje',
    title: 'No ar pra turma',
    desc: 'Uma plataforma mobile-first que reúne estudo, prática e acompanhamento em um só lugar.',
  },
];

const STACK = [
  { icon: Atom, name: 'React 18', desc: 'Interface' },
  { icon: Type, name: 'TypeScript', desc: 'Tipagem' },
  { icon: Wind, name: 'Tailwind CSS', desc: 'Estilo' },
  { icon: Activity, name: 'Vite', desc: 'Build' },
  { icon: Database, name: 'PostgreSQL', desc: 'Banco' },
  { icon: Lock, name: 'Auth + RLS', desc: 'Segurança' },
  { icon: Smartphone, name: 'PWA', desc: 'App mobile' },
  { icon: GitBranch, name: 'Edge Functions', desc: 'Backend' },
];

const FEATURES = [
  { icon: BookOpen, title: 'Apostilas', desc: 'Conteúdo organizado por curso, semestre e disciplina' },
  { icon: Code2, title: 'Exercícios', desc: 'Questões para praticar com correção e explicações' },
  { icon: Brain, title: 'Flashcards', desc: 'Revisão espaçada para reforçar a memória' },
  { icon: Timer, title: 'Pomodoro', desc: 'Timer de foco integrado à rotina de estudos' },
  { icon: Trophy, title: 'Gamificação', desc: 'XP, níveis, ofensivas e ranking entre alunos' },
  { icon: Calendar, title: 'Calendário', desc: 'Datas de avaliações e lembretes de estudo' },
  { icon: Users, title: 'Comunidade', desc: 'Espaço para conversar e trocar experiências' },
  { icon: Bell, title: 'Avisos', desc: 'Comunicados importantes da plataforma' },
];

export function TechStackSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0 grid-lines-bg opacity-20" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-xs">
            // como foi construído
          </p>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl">
            Por trás da <span className="text-primary">plataforma</span>
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Da ideia ao produto: tecnologia, história e recursos apresentados de forma simples.
          </p>
        </div>

        <div className="mb-14">
          <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            01 / a história
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {TIMELINE.map(({ icon: Icon, phase, title, desc }, i) => (
              <article
                key={title}
                className="relative rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/30"
              >
                <span className="absolute -top-2.5 left-4 rounded border border-primary/20 bg-background px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                  0{i + 1} · {phase}
                </span>
                <Icon className="mb-3 mt-1 h-6 w-6 text-primary" strokeWidth={1.75} />
                <h3 className="mb-1.5 font-display text-base">{title}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mb-14">
          <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            02 / o stack técnico
          </p>
          <div className="rounded-2xl border border-border/60 bg-card/30 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STACK.map(({ icon: Icon, name, desc }) => (
                <div
                  key={name}
                  className="rounded-xl border border-border/50 bg-background/30 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25"
                >
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center font-mono text-[10px] text-muted-foreground/70">
              Stack moderno · TypeScript · Mobile-first · PWA instalável
            </p>
          </div>
        </div>

        <div>
          <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            03 / recursos da plataforma
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="group rounded-xl border border-border/60 bg-card/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{title}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
