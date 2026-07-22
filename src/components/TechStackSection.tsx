import {
  Code2, Atom, Type, Wind, Database, Zap, Smartphone, GitBranch,
  BookOpen, Brain, Trophy, Users, Calendar, Lock, Bell, Timer,
  Lightbulb, Hammer, Rocket,
} from 'lucide-react';

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
  { icon: Zap, name: 'Vite', desc: 'Build' },
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
    <section className="py-20 px-4 relative overflow-hidden bg-black">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.05] pointer-events-none" style={{ background: '#ffffff' }} />
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
            // Como foi construído
          </p>
          <h2
            className="text-3xl md:text-5xl mb-3 text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Por trás da plataforma
          </h2>
          <p className="text-sm text-white/60 max-w-2xl mx-auto">
            Da ideia ao deploy: a história, o stack técnico e tudo que esta plataforma faz.
          </p>
        </div>

        {/* ─── TIMELINE ─── */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 text-center mb-6">
            01 / a história
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {TIMELINE.map(({ icon: Icon, phase, title, desc }, i) => (
              <div
                key={title}
                className="liquid-glass relative rounded-2xl p-5 hover:scale-[1.02] transition-transform"
              >
                <span className="liquid-glass absolute -top-2.5 left-4 px-2 py-0.5 text-[9px] uppercase tracking-wider rounded text-white/80">
                  0{i + 1} · {phase}
                </span>
                <Icon className="h-6 w-6 text-white mb-3 mt-1" strokeWidth={1.5} />
                <h3 className="text-base mb-1.5 text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── STACK ─── */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 text-center mb-6">
            02 / o stack técnico
          </p>
          <div className="liquid-glass-strong rounded-2xl p-5 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STACK.map(({ icon: Icon, name, desc }) => (
                <div
                  key={name}
                  className="liquid-glass rounded-xl p-3 text-center hover:scale-[1.03] transition-transform"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-semibold leading-tight text-white">{name}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center text-white/50 mt-5">
              Stack moderno · 100% TypeScript · Mobile-first · PWA instalável
            </p>
          </div>
        </div>

        {/* ─── FEATURES ─── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 text-center mb-6">
            03 / o que o app faz
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="liquid-glass rounded-2xl p-4 hover:scale-[1.03] transition-transform group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                  <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold mb-1 text-white">{title}</h3>
                <p className="text-[11px] text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
