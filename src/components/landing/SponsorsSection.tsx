import { Handshake, Target, BarChart3, ShieldCheck, MessageCircle, Mail, Check } from 'lucide-react';

const WHATSAPP_NUMBER = '5511939222885';
const WHATSAPP_MSG = encodeURIComponent(
  'Olá Kaique! Tenho interesse em anunciar/patrocinar a Decode Analytics Academy. Pode me enviar os pacotes?',
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const EMAIL_URL =
  'mailto:decodeanalytics@outlook.com.br?subject=Quero%20anunciar%20na%20Decode%20Analytics%20Academy&body=Ol%C3%A1%20Kaique%2C%20tenho%20interesse%20em%20patrocinar%20a%20plataforma.%20Segue%20meu%20contato%3A';

const WHY = [
  {
    icon: Target,
    title: 'Público em modo estudo',
    desc: 'Estudantes de ENEM e de tecnologia com intenção real de aprender — atenção alta, não scroll distraído.',
  },
  {
    icon: BarChart3,
    title: 'Resultado mensurável',
    desc: 'Cada anúncio tem impressões, cliques e período registrados. Você recebe o relatório, não uma promessa.',
  },
  {
    icon: ShieldCheck,
    title: 'Marca em contexto positivo',
    desc: 'Sem rastreamento de terceiros, sem venda de dados e sem anúncio no meio da aula. Sua marca aparece apoiando, não atrapalhando.',
  },
];

const PLANS = [
  {
    name: 'Apoiador',
    kicker: 'presença institucional',
    pitch: 'Para quem quer estar junto da causa.',
    items: ['Logo na página de apoiadores', 'Menção nas redes da Decode', 'Relatório mensal simples'],
    featured: false,
  },
  {
    name: 'Patrocinador de matéria',
    kicker: 'mais escolhido',
    pitch: '"Matemática apresentada por sua marca."',
    items: [
      'Selo de patrocínio na disciplina escolhida',
      'Anúncio fixo na lateral do app',
      'Relatório com impressões, cliques e CTR',
    ],
    featured: true,
  },
  {
    name: 'Master',
    kicker: 'máxima exposição',
    pitch: 'Para quem quer ser lembrado como quem mantém isso de pé.',
    items: [
      'Destaque na página inicial e no app',
      'Espaço lateral + comunicado aos alunos',
      'Conteúdo ou vaga divulgada na aba Cursos',
      'Relatório completo e reunião de resultados',
    ],
    featured: false,
  },
];

export function SponsorsSection() {
  return (
    <section id="anuncie" className="relative overflow-hidden px-4 py-16 sm:py-24">
      <div className="grid-lines-bg pointer-events-none absolute inset-0 opacity-10" />

      <div className="container relative mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-xs">
            // para empresas e patrocinadores
          </p>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">
            O aluno nunca paga. <span className="text-primary">Alguém precisa pagar.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            A Decode Analytics Academy é e continuará 100% gratuita — nenhum estudante vai deixar de
            estudar por falta de dinheiro. Servidor, conteúdo e manutenção, no entanto, têm custo. É aí
            que entra a sua marca: você banca o acesso à educação de quem precisa e, em troca, aparece
            para um público jovem, qualificado e no momento em que ele mais presta atenção.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {WHY.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm sm:p-6"
            >
              <item.icon className="mb-3 h-5 w-5 text-primary" strokeWidth={1.75} />
              <h3 className="font-display text-lg leading-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h3 className="mb-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
            formatos de patrocínio
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-5 backdrop-blur-sm sm:p-6 ${
                  plan.featured
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/60 bg-card/40'
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  {plan.kicker}
                </p>
                <h4 className="mt-1 font-display text-xl leading-tight">{plan.name}</h4>
                <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
                  {plan.pitch}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.items.map((li) => (
                    <li key={li} className="flex gap-2 text-sm leading-relaxed">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      <span className="text-muted-foreground">{li}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Valores e formatos são combinados caso a caso — inclusive para projetos sociais e empresas locais.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-center backdrop-blur-sm sm:p-8">
          <Handshake className="mx-auto mb-3 h-6 w-6 text-primary" strokeWidth={1.75} />
          <h3 className="font-display text-2xl leading-tight sm:text-3xl">
            Coloque sua marca onde ela faz diferença
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Fale direto comigo, sem intermediário. Em uma conversa a gente define o formato certo para o
            seu objetivo e o seu orçamento.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar sobre patrocínio no WhatsApp"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              Falar no WhatsApp
            </a>
            <a
              href={EMAIL_URL}
              aria-label="Enviar e-mail sobre patrocínio"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 px-5 py-3 text-sm font-medium transition-colors hover:bg-muted/40 sm:w-auto"
            >
              <Mail className="h-4 w-4" strokeWidth={1.75} />
              decodeanalytics@outlook.com.br
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
