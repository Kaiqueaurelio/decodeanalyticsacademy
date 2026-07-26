import { useState } from 'react';
import {
  Atom, Type, Wind, Gauge, Database, Server, Cloud, ShieldCheck,
  Cpu, Sparkle, Layers, Headphones, Video, Presentation, BookOpen,
  KeyRound, Lock, RefreshCw, Fingerprint, MessageSquare, Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * "Sob o capô" — explicação transparente da engenharia da plataforma
 * + benefícios pedagógicos. Sem detalhes que exponham superfície de ataque.
 */

type TabId = 'stack' | 'ia' | 'seguranca';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'stack', label: 'Infraestrutura', hint: 'Onde e como roda' },
  { id: 'ia', label: 'Motores de IA', hint: 'O que pensa junto com você' },
  { id: 'seguranca', label: 'Segurança', hint: 'Como protegemos seus dados' },
];

const STACK = [
  { icon: Atom, name: 'React 18', desc: 'Interface reativa' },
  { icon: Type, name: 'TypeScript', desc: '100% tipado' },
  { icon: Wind, name: 'Tailwind CSS', desc: 'Design system' },
  { icon: Gauge, name: 'Vite', desc: 'Build otimizado' },
  { icon: Cloud, name: 'Vercel', desc: 'Deploy e CDN global' },
  { icon: Server, name: 'Edge Functions', desc: 'Lógica no servidor' },
  { icon: Database, name: 'PostgreSQL', desc: 'Banco relacional' },
  { icon: Layers, name: 'PWA', desc: 'Instalável no celular' },
];

const IA = [
  {
    icon: Sparkle,
    name: 'GPT-5.6 Sol',
    role: 'Raciocínio profundo',
    desc: 'Usado na construção e revisão do conteúdo: reescreve a matéria em linguagem simples, sem perder profundidade.',
  },
  {
    icon: Cpu,
    name: 'Gemini (versão de alta capacidade)',
    role: 'Assistente em tempo real',
    desc: 'Responde dúvidas dentro da apostila, gera exercícios e explica passo a passo o que você não entendeu.',
  },
  {
    icon: MessageSquare,
    name: 'Claude',
    role: 'Revisão didática',
    desc: 'Revisa estrutura, clareza e segurança dos conteúdos antes deles chegarem às suas mãos.',
  },
  {
    icon: Wand2,
    name: 'Fable Max',
    role: 'Criação contextual',
    desc: 'Gera exemplos, narrativas e variações de exercícios que conectam a teoria com situações do dia a dia.',
  },
  {
    icon: Cloud,
    name: 'Processamento em nuvem',
    role: 'Escala sob demanda',
    desc: 'Todo o processamento pesado acontece na nuvem — seu celular só recebe o resultado, leve e rápido.',
  },
];

const SEGURANCA = [
  { icon: Lock, title: 'Acesso por conta', desc: 'Cada aluno enxerga apenas o conteúdo liberado para o seu perfil.' },
  { icon: KeyRound, title: 'Regras no banco', desc: 'As permissões são validadas no servidor, não no navegador.' },
  { icon: ShieldCheck, title: 'Tráfego cifrado', desc: 'Toda comunicação acontece por canais criptografados.' },
  { icon: Fingerprint, title: 'Sessão protegida', desc: 'Bloqueio por biometria e marca d\u2019água no conteúdo sensível.' },
  { icon: RefreshCw, title: 'Atualização contínua', desc: 'Correções entram no ar sem você precisar reinstalar nada.' },
  { icon: Server, title: 'Nada de chaves no cliente', desc: 'Credenciais ficam no servidor — nunca no aplicativo.' },
];

const BENEFICIOS = [
  {
    icon: BookOpen,
    title: 'Apostila segmentada',
    desc: 'A matéria é quebrada em módulos e aulas curtas, com linguagem facilitada — você estuda em blocos de 10 minutos.',
  },
  {
    icon: Presentation,
    title: 'Slides que explicam',
    desc: 'Cada assunto vem com slides visuais que descomplicam o conteúdo: qualquer pessoa entende, em qualquer idade.',
  },
  {
    icon: Headphones,
    title: 'Audiocast da matéria',
    desc: 'Ouça a explicação completa no trajeto, na academia ou na cozinha. Estudar sem precisar olhar a tela.',
  },
  {
    icon: Video,
    title: 'Vídeos em debate',
    desc: 'Vídeos discutindo o assunto por ângulos diferentes, para fixar o que a leitura sozinha não fixa.',
  },
];

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6',
        'transition-all duration-200',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PlatformEngineSection() {
  const [tab, setTab] = useState<TabId>('stack');

  return (
    <section id="engenharia" className="relative py-24 md:py-32 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="max-w-2xl">
          <p className="text-[11px] font-mono-label uppercase tracking-[0.22em] text-primary">
            Sob o capô
          </p>
          <h2 className="font-display mt-3 text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
            Como a plataforma foi{' '}
            <span className="text-primary">construída</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Transparência total sobre a engenharia: as tecnologias, os motores de inteligência
            artificial e as camadas de proteção que sustentam cada aula que você abre.
          </p>
        </header>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Detalhes técnicos da plataforma"
          className="mt-10 flex flex-col gap-2 sm:flex-row sm:gap-3"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`engine-tab-${t.id}`}
                aria-selected={active}
                aria-controls={`engine-panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'active:scale-[0.99]',
                  active
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70',
                )}
              >
                <span
                  className={cn(
                    'block text-sm font-semibold',
                    active ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {t.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{t.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Panels */}
        <div className="mt-6">
          {tab === 'stack' && (
            <div role="tabpanel" id="engine-panel-stack" aria-labelledby="engine-tab-stack">
              <Panel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {STACK.map(({ icon: Icon, name, desc }) => (
                    <div
                      key={name}
                      className="rounded-xl border border-border/50 bg-background/40 p-4 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold leading-tight">{name}</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  O aplicativo é publicado na{' '}
                  <span className="font-semibold text-foreground">Vercel</span>, distribuído por CDN
                  global: o conteúdo sai do servidor mais próximo de você. O banco de dados é
                  PostgreSQL gerenciado, e toda regra sensível roda em funções no servidor — nunca
                  no navegador.
                </p>
              </Panel>
            </div>
          )}

          {tab === 'ia' && (
            <div
              role="tabpanel"
              id="engine-panel-ia"
              aria-labelledby="engine-tab-ia"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {IA.map(({ icon: Icon, name, role, desc }) => (
                <Panel key={name} className="hover:border-primary/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-[10px] font-mono-label uppercase tracking-[0.18em] text-muted-foreground">
                    {role}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-tight">{name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </Panel>
              ))}
            </div>
          )}

          {tab === 'seguranca' && (
            <div
              role="tabpanel"
              id="engine-panel-seguranca"
              aria-labelledby="engine-tab-seguranca"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SEGURANCA.map(({ icon: Icon, title, desc }) => (
                <Panel key={title} className="hover:border-primary/40">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </Panel>
              ))}
            </div>
          )}
        </div>

        {/* Benefícios */}
        <div className="mt-20 md:mt-28">
          <header className="max-w-2xl">
            <p className="text-[11px] font-mono-label uppercase tracking-[0.22em] text-primary">
              Por que estudar aqui
            </p>
            <h2 className="font-display mt-3 text-3xl leading-[1.1] sm:text-4xl">
              Uma apostila que <span className="text-primary">fala com você</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Cada matéria chega em quatro formatos diferentes. Você escolhe como aprende — lendo,
              ouvindo, assistindo ou vendo em slides.
            </p>
          </header>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {BENEFICIOS.map(({ icon: Icon, title, desc }, i) => (
              <Panel key={title} className="group hover:-translate-y-0.5 hover:border-primary/40">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 transition-transform duration-200 group-hover:scale-105">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono-label uppercase tracking-[0.2em] text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold leading-tight">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
