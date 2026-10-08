import { useState } from 'react';
import {
  GraduationCap, MessageCircle, Mail, FlaskConical, Users, Cpu, Code2,
  ChevronDown,
} from 'lucide-react';
import kaiqueAvatar from '@/assets/kaique-creator.jpeg';

const WHATSAPP_NUMBER = '5511939222885';
const WHATSAPP_MSG = encodeURIComponent('Olá Kaique! Vim pela Decode Analytics Academy.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const EMAIL_URL = 'mailto:decodeanalytics@outlook.com.br?subject=Contato%20Decode%20Analytics%20Academy';

const highlights = [
  { icon: GraduationCap, title: 'Formação & atuação', text: 'Graduando em Ciência da Computação, com foco em tecnologia aplicada à educação e IA.' },
  { icon: FlaskConical, title: 'Projetos de impacto', text: 'Pesquisa em Realidade Aumentada na educação e desenvolvimento de ferramentas com foco em inclusão e sustentabilidade.' },
  { icon: Code2, title: 'Propósito', text: 'Criar soluções educacionais diretas, funcionais e úteis para quem está aprendendo tecnologia.' },
];

const tags = [
  'Estudante de Ciência da Computação',
  'Fundador da Decode Analytics',
  'Desenvolvedor & pesquisador',
];

const details = [
  {
    icon: Users,
    title: 'Experiência e liderança',
    text: 'Experiência prática em tecnologia desde 2018 e liderança de equipes em projetos acadêmicos e digitais.',
  },
  {
    icon: Cpu,
    title: 'Tecnologia na prática',
    text: 'Projetos com Arduino, dashboards, assistentes virtuais, plataformas gamificadas e aplicações web.',
  },
];

export function CreatorSection() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <section id="criador" className="relative overflow-hidden px-4 py-16 sm:py-24">
      <div className="grid-lines-bg pointer-events-none absolute inset-0 opacity-10" />

      <div className="container relative mx-auto max-w-5xl">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-xs">
            // quem mantém a plataforma
          </p>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl">
            Feito por <span className="text-primary">aluno</span>, para alunos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Conheça quem está por trás da Decode Analytics Academy e por que a plataforma foi criada.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 justify-center sm:justify-start">
              <div className="rounded-full bg-gradient-to-br from-primary to-accent p-[2px] shadow-lg shadow-primary/10">
                <img
                  src={kaiqueAvatar}
                  alt="Kaique Aurélio, criador da Decode Analytics Academy"
                  className="h-24 w-24 rounded-full bg-background object-cover sm:h-28 sm:w-28"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="font-display text-2xl leading-tight sm:text-3xl">Kaique Aurélio</h3>
              <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.75} />
                Ciência da Computação · fundador da Decode Analytics
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-medium text-foreground/90 sm:text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:mx-0 sm:text-[15px]">
                Desenvolvi a plataforma para resolver dores reais que encontrei como estudante:
                encontrar conteúdo confiável, praticar sem perder tempo e acompanhar a evolução em um
                único lugar.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {highlights.map(({ icon: Icon, title, text }) => (
                  <article
                    key={title}
                    className="rounded-xl border border-border/50 bg-background/40 p-4 text-left transition-colors hover:border-primary/30"
                  >
                    <Icon className="mb-3 h-5 w-5 text-primary" strokeWidth={1.75} />
                    <h4 className="text-sm font-semibold leading-tight">{title}</h4>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border/50 bg-background/30">
                <button
                  type="button"
                  onClick={() => setDetailsOpen((open) => !open)}
                  aria-expanded={detailsOpen}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-semibold"
                >
                  <span>Conheça um pouco mais da trajetória</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-primary transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {detailsOpen && (
                  <div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2">
                    {details.map(({ icon: Icon, title, text }) => (
                      <div key={title} className="flex gap-3 text-left">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                        <div>
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                  aria-label="Falar com o criador no WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  Falar no WhatsApp
                </a>
                <a
                  href={EMAIL_URL}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                  aria-label="Enviar e-mail para o criador"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  Enviar e-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
