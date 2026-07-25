import { useEffect, useRef, useState } from 'react';
import { UserPlus, BookOpenCheck, LineChart } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Cadastre-se em 30s',
    desc: 'Entre com RA ou e-mail. Sessão persistente, sem precisar logar toda hora.',
  },
  {
    n: '02',
    icon: BookOpenCheck,
    title: 'Estude com o que importa',
    desc: 'Apostilas por disciplina, exercícios resolvidos, flashcards, resumos e Ella — sua tutora virtual.',
  },
  {
    n: '03',
    icon: LineChart,
    title: 'Acompanhe sua evolução',
    desc: 'XP, streaks, ranking e desempenho por matéria. Você vê o progresso semana a semana.',
  },
];

const STATS = [
  { value: 48, suffix: '+', label: 'Disciplinas cobertas' },
  { value: 300, suffix: '+', label: 'Apostilas & conteúdos' },
  { value: 1500, suffix: '+', label: 'Exercícios resolvidos' },
  { value: 24, suffix: '/7', label: 'Ella tutora ativa' },
];

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const duration = 1400;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {n.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-16 sm:py-24 px-4 relative overflow-hidden">
      <div
        className="absolute -top-24 right-0 h-[360px] w-[360px] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent 60%)' }}
      />
      <div className="container mx-auto max-w-5xl relative">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
            // como funciona
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
            Do <span className="text-primary">cadastro</span> ao <span className="text-accent">domínio</span> da matéria
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Três passos, sem burocracia, sem plano pago escondido.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-14">
          {STEPS.map(({ n, icon: Icon, title, desc }) => (
            <div
              key={n}
              className="relative rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.05), rgba(168,85,247,0.05))',
                border: '1px solid rgba(0,240,255,0.15)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(0,240,255,0.3)',
                  }}
                >
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <span
                  className="font-display text-3xl leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {n}
                </span>
              </div>
              <p className="text-base font-semibold text-foreground mb-1.5">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          className="rounded-2xl p-5 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          style={{
            background: 'rgba(5,5,8,0.6)',
            border: '1px solid rgba(0,240,255,0.15)',
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="font-display text-3xl sm:text-4xl md:text-5xl leading-none mb-1.5"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
