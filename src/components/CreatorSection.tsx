import {
  GraduationCap,
  Code2,
  Heart,
  Users,
  Quote,
  MessageCircle,
  Mail,
  Cpu,
  Gamepad2,
  Bot,
  Wand2,
  Rocket,
  Building2,
  Package,
  BookOpen,
  Trophy,
} from 'lucide-react';
import kaiqueAvatar from '@/assets/kaique-creator.jpeg';

const WHATSAPP_NUMBER = '5511939222885';
const WHATSAPP_MSG = encodeURIComponent('Olá Kaique! Vim pela Decode Analytics Academy.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const EMAIL_URL = 'mailto:decodeanalytics@outlook.com.br?subject=Contato%20Decode%20Analytics%20Academy';

const STACK = [
  'Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'React', 'Node', 'Supabase', 'Arduino',
];

const JOURNEY = [
  { year: '2018', icon: Rocket, title: 'Fundou a Decode Analytics', desc: 'Início da jornada como criador de soluções digitais.' },
  { year: '2020', icon: Package, title: 'Correios & Mercado Livre', desc: 'Experiência prática em Correios e Mercado Livre.' },
  { year: '2023', icon: BookOpen, title: 'Ciências da Computação', desc: 'Ingresso na graduação — hoje no 5º semestre.' },
  { year: '2024', icon: Cpu, title: 'IC em Realidade Aumentada', desc: 'Merge Cube aplicado à educação de crianças com TDAH.' },
  { year: '2025', icon: Gamepad2, title: 'Liderança & Games Educativos', desc: 'Liderou equipe de 6 pessoas em 4 jogos sobre sustentabilidade.' },
  { year: '2026', icon: Bot, title: 'Decode Analytics Academy', desc: 'Plataforma acadêmica com assistente virtual e gamificação para colegas de curso.' },
];

const PROJECTS = [
  { icon: Bot, title: 'Assistentes Virtuais', desc: 'Copilotos de estudo com contexto e ferramentas.' },
  { icon: Gamepad2, title: 'Jogos Educativos', desc: '4 jogos multiplayer focados em sustentabilidade.' },
  { icon: Wand2, title: 'Realidade Aumentada', desc: 'Iniciação científica com Merge Cube para TDAH.' },
  { icon: Cpu, title: 'Robótica com Arduino', desc: 'Protótipos e projetos acadêmicos aplicados.' },
];

export function CreatorSection() {
  return (
    <section id="criador" className="py-16 sm:py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-lines-bg opacity-20 pointer-events-none" />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-[140px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00f0ff, transparent 60%)' }}
      />

      <div className="container mx-auto max-w-5xl relative">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
            // Sobre o criador
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
            Feito por <span className="text-primary">aluno</span>,
            <br className="sm:hidden" /> para alunos
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma nascida na graduação, combinando código, pesquisa e vivência real de sala de aula.
          </p>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-5 sm:p-8 md:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(168,85,247,0.06))',
            border: '1px solid rgba(0,240,255,0.18)',
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00f0ff 0%, transparent 70%)' }}
          />

          <div className="relative flex flex-col items-center text-center md:grid md:grid-cols-[auto_1fr] md:items-start md:text-left md:gap-8 gap-5">
            {/* Avatar + badges */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div
                className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-full overflow-hidden p-[2px]"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
                  boxShadow: '0 0 40px rgba(0,240,255,0.4)',
                }}
              >
                <img
                  src={kaiqueAvatar}
                  alt="Kaique Aurélio - Criador da Decode Analytics"
                  className="h-full w-full rounded-full object-cover"
                  style={{ background: '#050508' }}
                />
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
                style={{
                  background: 'rgba(0,240,255,0.1)',
                  color: '#00f0ff',
                  border: '1px solid rgba(0,240,255,0.3)',
                }}
              >
                <GraduationCap className="h-3 w-3" />
                Aluno · Criador · Fundador
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  color: '#c084fc',
                  border: '1px solid rgba(168,85,247,0.3)',
                }}
              >
                <Building2 className="h-3 w-3" />
                Decode Analytics · desde 2018
              </div>
            </div>

            {/* Info */}
            <div className="w-full min-w-0">
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl mb-1 leading-tight">
                Kaique Aurélio
              </h3>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4 sm:mb-5">
                5º semestre · Ciência da Computação · UNIP
              </p>

              {/* Quote */}
              <div
                className="relative rounded-xl p-4 sm:p-5 mb-5 text-left"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Quote className="absolute -top-2 -left-2 h-5 w-5 text-primary/60" strokeWidth={2.5} />
                <p className="text-[13px] sm:text-sm md:text-base text-foreground/90 leading-relaxed">
                  Sou aluno de CC, igual vocês. Cansei de perder tempo procurando apostila boa,
                  exercício resolvido e resumo decente espalhado em PDF. Então decidi construir{' '}
                  <span className="text-primary font-semibold">a plataforma que eu queria ter</span> —
                  e abrir pra galera do curso usar comigo.
                </p>
              </div>

              {/* Bio profissional */}
              <p className="text-[13px] sm:text-sm text-foreground/80 leading-relaxed mb-3 text-left">
                Estudante do 5º semestre de Ciências da Computação, com trajetória que combina
                formação acadêmica e experiência profissional diversificada. Desde 2018 é
                fundador da <span className="text-primary/90">Decode Analytics</span> e possui
                experiência prática em operações logísticas
                (<span className="text-primary/90">Correios</span>,{' '}
                <span className="text-primary/90">Mercado Livre</span>) e varejo. Na faculdade,
                vem desenvolvendo conhecimentos básicos e intermediários em linguagens como
                Python, JavaScript, TypeScript, C++ e Java, além de frameworks como React.
              </p>
              <p className="text-[13px] sm:text-sm text-foreground/80 leading-relaxed mb-3 text-left">
                Na área acadêmica, desenvolveu projeto de Iniciação Científica em Realidade
                Aumentada aplicado à educação de crianças com TDAH utilizando Merge Cube, sob
                orientação do Dr. Alexandre Bozolan dos Santos. Também liderou equipe
                multidisciplinar de 6 pessoas na criação de 4 jogos digitais educativos focados
                em sustentabilidade.
              </p>
              <p className="text-[13px] sm:text-sm text-foreground/80 leading-relaxed mb-3 text-left">
                Tem experiência prática em robótica educacional com Arduino e desenvolvimento de
                projetos acadêmicos que abrangem desde dashboards interativos até assistentes
                virtuais e plataformas multiplayer gamificadas.
              </p>
              <p className="text-[13px] sm:text-sm text-foreground/80 leading-relaxed mb-5 text-left">
                Com vivência em liderança de equipes de até 8 pessoas em projetos acadêmicos,
                busca integrar habilidades técnicas com visão crítica, focando em soluções que
                gerem <span className="text-accent font-semibold">impacto social e educacional</span>.
              </p>

              {/* Pilares */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                {[
                  { icon: Code2, label: 'Construído na faculdade' },
                  { icon: Users, label: 'Aberto pra turma' },
                  { icon: Heart, label: 'Sem fins lucrativos' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="p-2 sm:p-3 rounded-lg flex flex-col items-center justify-center text-center min-h-[72px] sm:min-h-[84px]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1.5 text-primary shrink-0" strokeWidth={1.5} />
                    <p className="text-[10px] sm:text-xs font-medium leading-tight text-balance">{label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    boxShadow: '0 4px 20px rgba(37,211,102,0.35)',
                  }}
                  aria-label="Falar com o criador no WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  Falar no WhatsApp
                </a>
                <a
                  href={EMAIL_URL}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  aria-label="Enviar e-mail para o criador"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  Enviar e-mail
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stack */}
        <div className="mt-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3 text-center">
            // stack &amp; ferramentas
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {STACK.map((t) => (
              <span
                key={t}
                className="px-3 py-1.5 rounded-full text-xs font-mono"
                style={{
                  background: 'rgba(0,240,255,0.06)',
                  border: '1px solid rgba(0,240,255,0.18)',
                  color: '#7ee9ff',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-12">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-4 text-center">
            // trajetória
          </p>
          <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-center mb-8">
            Uma jornada entre <span className="text-primary">código</span>, pesquisa e sala de aula
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {JOURNEY.map(({ year, icon: Icon, title, desc }) => (
              <div
                key={year + title}
                className="relative rounded-xl p-4 sm:p-5 flex gap-4"
                style={{
                  background: 'rgba(5,5,8,0.5)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(0,240,255,0.25)',
                  }}
                >
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-accent">{year}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projetos */}
        <div className="mt-12">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-4 text-center">
            // projetos &amp; pesquisa
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROJECTS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'rgba(5,5,8,0.5)',
                  border: '1px solid rgba(168,85,247,0.15)',
                }}
              >
                <div
                  className="h-10 w-10 rounded-lg mx-auto flex items-center justify-center mb-2"
                  style={{
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.25)',
                  }}
                >
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liderança destaque */}
        <div
          className="mt-8 rounded-xl p-5 sm:p-6 flex items-start gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,240,255,0.05))',
            border: '1px solid rgba(168,85,247,0.25)',
          }}
        >
          <Trophy className="h-6 w-6 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-foreground">Liderança &amp; times</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Vivência liderando equipes multidisciplinares de até 8 pessoas em projetos acadêmicos —
              do briefing à entrega, sempre com foco em impacto real para colegas de curso.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
