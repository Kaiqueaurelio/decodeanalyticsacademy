import {
  Code2, Atom, Type, Wind, Database, Activity, Smartphone, GitBranch,
  BookOpen, Brain, Trophy, Users, Calendar, Lock, Bell, Timer,
  Lightbulb, Hammer, Rocket,
} from 'lucide-react';

/**
 * "Como foi construído" — História + Stack + Recursos
 * Mostra as tecnologias e capacidades da plataforma de forma clara.
 */

const TIMELINE = [
  {
    icon: Lightbulb,
    phase: 'Ideia',
    title: 'O problema',
    desc: 'Apostilas espalhadas, links quebrados, exercícios perdidos no WhatsApp da turma.',
  },
  {
    icon: Hammer,
    phase: 'Construção',
    title: 'Mãos à obra',
    desc: 'Construído em paralelo com as aulas — cada feature nasceu de uma dor real do dia a dia.',
  },
  {
    icon: Rocket,
    phase: 'Hoje',
    title: 'No ar pra turma',
    desc: 'Uma plataforma única, rápida, mobile-first e sempre evoluindo com o feedback dos alunos.',
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
  { icon: BookOpen, title: 'Apostilas', desc: 'Conteúdo das 48 disciplinas organizado por semestre' },
  { icon: Code2, title: 'Exercícios', desc: 'Banco de questões com correção automática e XP' },
  { icon: Brain, title: 'Flashcards', desc: 'Revisão espaçada para memorização de longo prazo' },
  { icon: Timer, title: 'Pomodoro', desc: 'Timer de foco integrado às sessões de estudo' },
  { icon: Trophy, title: 'Gamificação', desc: 'XP, níveis, ofensivas diárias e leaderboard' },
  { icon: Calendar, title: 'Calendário de provas', desc: 'Datas de avaliação com lembretes automáticos' },
  { icon: Users, title: 'Comunidade', desc: 'Mural e canais para conversar com a turma' },
  { icon: Bell, title: 'Avisos', desc: 'Comunicados importantes em tempo real' },
];

export function TechStackSection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-lines-bg opacity-20 pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-mono-label uppercase tracking-[0.2em] text-primary mb-3">
            // Como foi construído
          </p>
          <h2 className="font-display text-3xl md:text-5xl mb-3">
            Por trás da <span className="text-primary">plataforma</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Da ideia ao deploy: a história, o stack técnico e tudo que esta plataforma faz.
          </p>
        </div>

        {/* ─── TIMELINE / HISTÓRIA ─── */}
        <div className="mb-16">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
            01 / a história
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {TIMELINE.map(({ icon: Icon, phase, title, desc }, i) => (
              <div
                key={title}
                className="relative rounded-xl p-5"
                style={{
                  background: '#0a0a12',
                  border: '1px solid rgba(0,240,255,0.1)',
                }}
              >
                <span
                  className="absolute -top-2.5 left-4 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded"
                  style={{ background: '#050508', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.3)' }}
                >
                  0{i + 1} · {phase}
                </span>
                <Icon className="h-6 w-6 text-primary mb-3 mt-1" />
                <h3 className="font-display text-base mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── STACK TÉCNICO ─── */}
        <div className="mb-16">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
            02 / o stack técnico
          </p>
          <div
            className="rounded-2xl p-5 md:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.04), rgba(168,85,247,0.04))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STACK.map(({ icon: Icon, name, desc }) => (
                <div
                  key={name}
                  className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5 duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="mx-auto h-9 w-9 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)' }}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center text-muted-foreground/70 mt-5 font-mono">
              Stack moderno · 100% TypeScript · Mobile-first · PWA instalável
            </p>
          </div>
        </div>

        {/* ─── O QUE O APP FAZ ─── */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
            03 / o que o app faz
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-4 transition-all hover:-translate-y-1 duration-300 group"
                style={{
                  background: '#0a0a12',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.18)' }}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
