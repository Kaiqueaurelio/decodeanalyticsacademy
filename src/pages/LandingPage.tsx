import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { ScrollReveal } from '@/hooks/useScrollAnimation';
import {
  BookOpen, CheckCircle, BarChart3, ArrowRight, Download, Shield,
  Headphones, Video, FileText, Users, Zap, Clock, Award, Star,
  GraduationCap, TrendingUp, Lock, Code2, Database, Cloud, Cpu,
  Palette, Globe, Smartphone, BrainCircuit
} from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';
import appPreview from '@/assets/app-preview.jpg';

const features = [
  { icon: BookOpen, title: 'Apostilas Completas', desc: 'Conteúdo estruturado por disciplina e semestre, com importação inteligente via IA.' },
  { icon: CheckCircle, title: 'Exercícios com Correção', desc: 'Questões de múltipla escolha com correção instantânea e explicações detalhadas.' },
  { icon: BarChart3, title: 'Dashboard de Desempenho', desc: 'Acompanhe seu progresso com gráficos de acertos, erros e evolução.' },
  { icon: Headphones, title: 'Áudios e Podcasts', desc: 'Player estilo Spotify para ouvir materiais de apoio em qualquer lugar.' },
  { icon: Video, title: 'Videoaulas', desc: 'Assista vídeos com player integrado estilo YouTube, com controles completos.' },
  { icon: FileText, title: 'PDFs e Materiais', desc: 'Visualize PDFs, PowerPoints, imagens e infográficos diretamente na plataforma.' },
];

const benefits = [
  { icon: Zap, title: 'Estude com Foco', desc: 'Todo conteúdo organizado por matéria. Sem distrações.' },
  { icon: Clock, title: 'Economize Tempo', desc: 'Encontre exatamente o que precisa sem perder tempo procurando.' },
  { icon: Shield, title: 'Conteúdo Protegido', desc: 'Marca d\'água personalizada e proteção contra cópia não autorizada.' },
  { icon: Award, title: 'Preparação para Provas', desc: 'Exercícios no formato das provas para você chegar confiante.' },
];

const stats = [
  { value: '8', label: 'Semestres', sub: 'de conteúdo' },
  { value: '48+', label: 'Disciplinas', sub: 'da grade curricular' },
  { value: '100%', label: 'Online', sub: 'acesse de qualquer lugar' },
  { value: '24/7', label: 'Disponível', sub: 'estude quando quiser' },
];

const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastre-se com seu email em segundos.', icon: Users },
  { n: '02', title: 'Acesse o conteúdo', desc: 'Navegue pelas apostilas e materiais da sua disciplina.', icon: BookOpen },
  { n: '03', title: 'Pratique e evolua', desc: 'Faça exercícios, acompanhe seu progresso e melhore a cada dia.', icon: TrendingUp },
];

const testimonials = [
  { name: 'Ana Silva', course: '3º Semestre', text: 'A plataforma me ajudou muito nas revisões. Os exercícios são muito parecidos com os da prova!', rating: 5 },
  { name: 'Carlos Santos', course: '5º Semestre', text: 'Ter tudo organizado num só lugar faz toda a diferença. Recomendo para todos da turma.', rating: 5 },
  { name: 'Juliana Costa', course: '2º Semestre', text: 'Os áudios e vídeos são excelentes para revisar no ônibus. Muito prático!', rating: 5 },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallPWA = () => {
    const deferredPrompt = (window as any).__pwaInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        (window as any).__pwaInstallPrompt = null;
      });
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-primary/8 blur-3xl" />

        <div className="container relative py-20 md:py-28 lg:py-40 px-4">
          <div className="max-w-2xl space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-2">
                <GraduationCap className="h-3.5 w-3.5" />
                Plataforma de Estudos · Ciência da Computação
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Suas revisões, <span className="text-gradient">organizadas</span> e prontas para a prova.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                Apostilas por tópicos, exercícios corrigidos em tempo real, materiais multimídia e dashboard de desempenho — tudo em um só lugar.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" className="gradient-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" onClick={() => navigate('/login')}>
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-border/60" onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ver recursos
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-4 transition-colors"
              >
                <Download className="h-4 w-4" /> Instalar no celular
              </button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container px-4 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100} direction="scale">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-extrabold text-gradient">{s.value}</p>
                  <p className="text-sm font-semibold mt-1">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-16 md:py-24">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Recursos</p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Tudo que você precisa para revisar</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm md:text-base">
                Uma plataforma completa com ferramentas pensadas para maximizar seu desempenho acadêmico.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className="glass rounded-2xl p-6 hover-lift group h-full">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <ScrollReveal direction="left">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Por que escolher</p>
                <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl mb-4">
                  Benefícios de estudar com a <span className="text-gradient">Decode Analytics</span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Nossa plataforma foi criada para alunos de Ciência da Computação que querem se preparar de forma eficiente e organizada.
                </p>
              </ScrollReveal>
            </div>

            <div className="space-y-4">
              {benefits.map((b, i) => (
                <ScrollReveal key={b.title} delay={i * 100} direction="right">
                  <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/40 hover-lift">
                    <div className="shrink-0 mt-0.5">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <b.icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{b.title}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Como funciona</p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Três passos simples</h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            {steps.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 150} direction="scale">
                <div className="text-center group">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-3xl font-extrabold text-gradient">{s.n}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-1.5">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Veja na prática</p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Como funciona a área do aluno</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm md:text-base">
                Dashboard intuitivo com apostilas, exercícios, materiais multimídia e acompanhamento de desempenho.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="scale">
            <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40">
              <img
                src={appPreview}
                alt="Preview da área do aluno - Dashboard com apostilas, exercícios e progresso"
                className="w-full h-auto"
                loading="lazy"
                width={1280}
                height={720}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-10">
              {[
                { icon: BookOpen, label: 'Apostilas por semestre' },
                { icon: CheckCircle, label: 'Exercícios corrigidos' },
                { icon: Headphones, label: 'Player estilo Spotify' },
                { icon: BarChart3, label: 'Gráficos de progresso' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-center p-3 rounded-xl bg-card border border-border/30">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Tecnologia</p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Construído com tecnologia de ponta</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm md:text-base">
                Utilizamos as melhores ferramentas do mercado para entregar performance, segurança e uma experiência incrível.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Code2, name: 'React + TypeScript', desc: 'Interface moderna e tipada' },
              { icon: Palette, name: 'Tailwind CSS', desc: 'Design responsivo e elegante' },
              { icon: Database, name: 'Supabase', desc: 'Banco de dados em tempo real' },
              { icon: Cloud, name: 'Cloud Storage', desc: 'Arquivos seguros na nuvem' },
              { icon: BrainCircuit, name: 'IA Generativa', desc: 'Importação inteligente de conteúdo' },
              { icon: Shield, name: 'RLS & Auth', desc: 'Segurança por linha de dado' },
              { icon: Smartphone, name: 'PWA', desc: 'Instale como app no celular' },
              { icon: Globe, name: 'Edge Functions', desc: 'Backend serverless global' },
            ].map((tech, i) => (
              <ScrollReveal key={tech.name} delay={i * 80} direction="scale">
                <div className="glass rounded-xl p-5 text-center hover-lift h-full flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <tech.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Depoimentos</p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">O que nossos alunos dizem</h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="glass rounded-2xl p-6 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.course}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl mb-3">Conteúdo Protegido</h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Todo o conteúdo é protegido com marca d'água personalizada contendo nome de usuário, IP, data e hora.
                Bloqueio de PrintScreen e clique direito garantem a segurança do material.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container px-4">
          <ScrollReveal direction="scale">
            <div className="max-w-xl mx-auto text-center glass rounded-3xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-3 sm:text-3xl">Pronto para revisar?</h2>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Entre para acessar suas apostilas, estudar com foco e chegar preparado para a prova.
              </p>
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-lg shadow-primary/25" onClick={() => navigate('/login')}>
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col items-center gap-3 text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <img src={logoDark} alt="Decode Analytics" className="h-6 w-6 rounded object-cover" />
            <span className="font-semibold text-foreground text-sm">Decode Analytics</span>
          </div>
          <p className="text-xs text-center">Desenvolvido por Kaique Aurelio · © {new Date().getFullYear()} · Todos os direitos reservados</p>
        </div>
      </footer>

      {/* Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInstallGuide(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Instalar o App
            </h3>
            <p className="text-sm text-muted-foreground">
              Para instalar, abra o site publicado no navegador do seu celular e siga as instruções:
            </p>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">Abra este link no celular:</p>
              <a
                href="https://decodeanalyticsacademy.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary underline break-all"
              >
                decodeanalyticsacademy.lovable.app
              </a>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold text-foreground mb-1">📱 iPhone / iPad (Safari)</p>
                <p>1. Abra o link acima no <strong>Safari</strong></p>
                <p>2. Toque em <strong>Compartilhar</strong> (ícone ↑)</p>
                <p>3. Toque em <strong>Adicionar à Tela de Início</strong></p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold text-foreground mb-1">🤖 Android (Chrome)</p>
                <p>1. Abra o link acima no <strong>Chrome</strong></p>
                <p>2. Toque no <strong>menu ⋮</strong> (canto superior)</p>
                <p>3. Toque em <strong>Instalar app</strong></p>
              </div>
            </div>
            <Button onClick={() => setShowInstallGuide(false)} className="w-full">Entendi</Button>
          </div>
        </div>
      )}
    </div>
  );
}
