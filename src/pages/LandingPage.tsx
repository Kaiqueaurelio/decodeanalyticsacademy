import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppHeader } from '@/components/AppHeader';
import { ScrollReveal } from '@/hooks/useScrollAnimation';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { FloatingParticles } from '@/components/FloatingParticles';
import {
  BookOpen, CheckCircle, BarChart3, ArrowRight, Download, Shield,
  Headphones, Video, FileText, Users, Zap, Clock, Award, Star,
  GraduationCap, TrendingUp, Lock, Code2, Database, Cloud, Cpu,
  Palette, Globe, Smartphone, BrainCircuit, ChevronDown, Play,
  Layers, Target, Sparkles, MessageCircle, HelpCircle
} from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';
import appPreview from '@/assets/app-preview.jpg';
import demoShowcase from '@/assets/demo-showcase.jpg';

const features = [
  { icon: BookOpen, title: 'Apostilas Completas', desc: 'Conteúdo estruturado por disciplina e semestre, com importação inteligente via IA que organiza automaticamente o material.', highlight: true },
  { icon: CheckCircle, title: 'Exercícios com Correção', desc: 'Questões de múltipla escolha com correção instantânea, explicações detalhadas e acompanhamento de acertos.' },
  { icon: BarChart3, title: 'Dashboard de Desempenho', desc: 'Gráficos interativos de evolução, acertos por matéria, streaks de estudo e ranking entre alunos.' },
  { icon: Headphones, title: 'Áudios e Podcasts', desc: 'Player estilo Spotify integrado para ouvir materiais de apoio em qualquer lugar, mesmo offline.' },
  { icon: Video, title: 'Videoaulas HD', desc: 'Assista vídeos com player integrado, controles completos e reprodução otimizada para mobile.' },
  { icon: FileText, title: 'Materiais Multimídia', desc: 'PDFs, PowerPoints, imagens, GIFs e infográficos — tudo acessível diretamente na plataforma.' },
];

const benefits = [
  { icon: Zap, title: 'Estude com Foco', desc: 'Todo conteúdo organizado por matéria e semestre. Zero distrações, máxima produtividade.' },
  { icon: Clock, title: 'Economize Tempo', desc: 'Encontre exatamente o que precisa em segundos. Busca global inteligente em todo o conteúdo.' },
  { icon: Shield, title: 'Conteúdo Protegido', desc: 'Marca d\'água personalizada com nome, IP e horário. Proteção contra cópia não autorizada.' },
  { icon: Award, title: 'Preparação para Provas', desc: 'Exercícios no formato das provas reais. Simule condições de prova e chegue confiante.' },
  { icon: Target, title: 'Gamificação', desc: 'Ganhe XP, suba de nível, conquiste badges e mantenha seu streak de estudos.' },
  { icon: BrainCircuit, title: 'IA Integrada', desc: 'Importação automática de conteúdo do Notion, Perplexity e URLs com formatação inteligente.' },
];

const stats = [
  { value: 8, label: 'Semestres', sub: 'de conteúdo completo', suffix: '' },
  { value: 48, label: 'Disciplinas', sub: 'da grade curricular', suffix: '+' },
  { value: 100, label: 'Online', sub: 'acesse de qualquer lugar', suffix: '%' },
  { value: 24, label: 'Disponível', sub: 'estude quando quiser', suffix: '/7' },
];

const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastre-se com email e senha em menos de 30 segundos. Verificação rápida por email.', icon: Users },
  { n: '02', title: 'Explore o conteúdo', desc: 'Navegue por apostilas, vídeos, áudios e materiais organizados por semestre e disciplina.', icon: BookOpen },
  { n: '03', title: 'Pratique e evolua', desc: 'Faça exercícios, acompanhe seu progresso no dashboard e suba no ranking da turma.', icon: TrendingUp },
];

const testimonials = [
  { name: 'Ana Silva', course: '3º Semestre - CC', text: 'A plataforma me ajudou muito nas revisões. Os exercícios são muito parecidos com os da prova! Minha nota subiu 2 pontos.', rating: 5, avatar: '👩‍💻' },
  { name: 'Carlos Santos', course: '5º Semestre - CC', text: 'Ter tudo organizado num só lugar faz toda a diferença. Recomendo para todos da turma. O player de áudio é sensacional.', rating: 5, avatar: '👨‍🎓' },
  { name: 'Juliana Costa', course: '2º Semestre - CC', text: 'Os áudios e vídeos são excelentes para revisar no ônibus. Muito prático! A gamificação me motiva a estudar todo dia.', rating: 5, avatar: '👩‍🎓' },
];

const techStack = [
  { icon: Code2, name: 'React + TypeScript', desc: 'Interface moderna, tipada e de alta performance' },
  { icon: Palette, name: 'Tailwind CSS', desc: 'Design responsivo, elegante e com dark mode' },
  { icon: Database, name: 'Banco em Tempo Real', desc: 'Dados sincronizados instantaneamente' },
  { icon: Cloud, name: 'Cloud Storage', desc: 'Arquivos seguros e CDN global' },
  { icon: BrainCircuit, name: 'IA Generativa', desc: 'Importação e organização inteligente de conteúdo' },
  { icon: Shield, name: 'Segurança Avançada', desc: 'RLS, autenticação e proteção por linha' },
  { icon: Smartphone, name: 'PWA Nativo', desc: 'Instale como app no celular com 1 toque' },
  { icon: Globe, name: 'Edge Functions', desc: 'Backend serverless com latência mínima' },
];

const faqs = [
  { q: 'A plataforma é gratuita?', a: 'O acesso é exclusivo para alunos cadastrados. Entre em contato para saber como participar e ter acesso completo a todo o conteúdo.' },
  { q: 'Posso acessar pelo celular?', a: 'Sim! A plataforma é um PWA (Progressive Web App) que funciona como um app nativo. Você pode instalar no seu celular e acessar mesmo sem conexão.' },
  { q: 'O conteúdo é atualizado?', a: 'Sim, o conteúdo é atualizado regularmente com novos materiais, exercícios e apostilas importadas automaticamente via IA.' },
  { q: 'Como funciona a proteção do conteúdo?', a: 'Todo material possui marca d\'água personalizada com seu nome, IP e horário de acesso. Além disso, bloqueamos PrintScreen e clique direito.' },
  { q: 'Quais formatos de material são suportados?', a: 'Suportamos PDFs, vídeos (MP4), áudios (MP3), PowerPoints, imagens, GIFs, links externos e documentos Word/Excel.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleInstallPWA = async () => {
    try {
      const deferredPrompt = (window as any).__pwaInstallPrompt;
      if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          (window as any).__pwaInstallPrompt = null;
        }
        return;
      }
    } catch (e) {
      console.warn('PWA prompt failed:', e);
    }
    setShowInstallGuide(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center grid-lines-bg">
        <div className="absolute inset-0 gradient-hero" />
        <FloatingParticles count={25} />
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float-particle" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-primary/8 blur-3xl animate-float-particle" style={{ animationDuration: '15s', animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[100px]" />

        <div className="container relative py-20 md:py-28 lg:py-36 px-4">
          <div className="max-w-3xl space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-3 animate-pulse-glow">
                <Sparkles className="h-3.5 w-3.5" />
                Plataforma de Estudos · Ciência da Computação
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Suas revisões,{' '}
                <span className="text-gradient-animated">organizadas</span>
                {' '}e prontas para a prova.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Apostilas estruturadas por IA, exercícios com correção instantânea, videoaulas, podcasts e dashboard de desempenho — tudo em um PWA que funciona como app nativo no seu celular.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => navigate('/login')}
                >
                  <Play className="mr-2 h-4 w-4" /> Começar agora
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/60 hover:bg-primary/5 transition-all"
                  onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explorar recursos <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex items-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Instalar no celular
                </button>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex -space-x-2">
                    {['👩‍💻', '👨‍🎓', '👩‍🎓'].map((e, i) => (
                      <span key={i} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border-2 border-background text-sm">{e}</span>
                    ))}
                  </div>
                  <span>Alunos já estudando</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
        </div>
      </section>

      {/* Stats Bar with animated counters */}
      <section className="border-y border-border/40 bg-card/50 backdrop-blur-sm relative overflow-hidden grid-lines-bg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.02]" />
        <div className="container relative px-4 py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100} direction="scale">
                <div className="text-center group">
                  <p className="text-3xl md:text-4xl font-extrabold text-gradient animate-text-glow">
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm font-semibold mt-1.5 group-hover:text-primary transition-colors">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="py-20 md:py-28">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-14 md:mb-18">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <Layers className="h-3.5 w-3.5" /> Recursos
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Tudo que você precisa para <span className="text-gradient">revisar</span></h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                Uma plataforma completa com ferramentas pensadas para maximizar seu desempenho acadêmico e tornar o estudo mais eficiente.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className={`glass rounded-2xl p-6 hover-lift group h-full transition-all duration-300 ${f.highlight ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}>
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits with visual improvements */}
      <section className="py-20 md:py-28 bg-accent/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div className="md:sticky md:top-24">
              <ScrollReveal direction="left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                  <Target className="h-3.5 w-3.5" /> Vantagens
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl mb-4">
                  Por que estudar com a <span className="text-gradient-animated">Decode Analytics</span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
                  Nossa plataforma foi criada por alunos de Ciência da Computação que sabem exatamente o que você precisa para se preparar de forma eficiente.
                </p>
                <div className="hidden md:flex gap-3">
                  <Button className="gradient-primary text-primary-foreground" onClick={() => navigate('/login')}>
                    Experimentar grátis <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-3">
              {benefits.map((b, i) => (
                <ScrollReveal key={b.title} delay={i * 80} direction="right">
                  <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/40 hover-lift group transition-all duration-300 hover:border-primary/20">
                    <div className="shrink-0 mt-0.5">
                      <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                        <b.icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{b.title}</h3>
                      <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 relative grid-lines-bg">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-14 md:mb-18">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <Play className="h-3.5 w-3.5" /> Como funciona
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Três passos <span className="text-gradient">simples</span></h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
                Comece a estudar em menos de 1 minuto. Sem complicação.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto relative">
            {/* Connection line */}
            <div className="hidden sm:block absolute top-[4.5rem] left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {steps.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 150} direction="scale">
                <div className="text-center group relative">
                  <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <s.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-4xl font-extrabold text-gradient">{s.n}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview with better context */}
      <section className="py-20 md:py-28 bg-accent/30 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <Smartphone className="h-3.5 w-3.5" /> Preview
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Conheça a <span className="text-gradient">área do aluno</span></h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                Dashboard intuitivo com apostilas, exercícios, materiais multimídia, gamificação e acompanhamento de desempenho em tempo real.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="scale">
            <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40 relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-end justify-center pb-8">
                <Button className="gradient-primary text-primary-foreground shadow-lg" onClick={() => navigate('/login')}>
                  Acessar plataforma <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <img
                src={appPreview}
                alt="Preview da area do aluno - Dashboard com apostilas, exercicios e progresso"
                className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                loading="lazy"
                width={1280}
                height={720}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-10">
              {[
                { icon: BookOpen, label: 'Apostilas por semestre', desc: '8 semestres completos' },
                { icon: CheckCircle, label: 'Exercícios corrigidos', desc: 'Correção em tempo real' },
                { icon: Headphones, label: 'Player de áudio', desc: 'Estilo Spotify integrado' },
                { icon: BarChart3, label: 'Gráficos interativos', desc: 'Evolução detalhada' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-card border border-border/30 hover-lift transition-all duration-300 hover:border-primary/20">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Demo Video / Showcase Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
        <div className="container relative px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <Play className="h-3.5 w-3.5" /> Demonstracao
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Veja a plataforma <span className="text-gradient-animated">em acao</span></h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                Explore as funcionalidades da Decode Analytics em detalhes. Dashboard interativo, materiais organizados e muito mais.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="scale">
            <div className="max-w-4xl mx-auto relative group">
              {/* Browser chrome mockup */}
              <div className="rounded-t-2xl bg-card border border-border/40 border-b-0 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    decodeanalyticsacademy.lovable.app
                  </div>
                </div>
              </div>
              <div className="rounded-b-2xl overflow-hidden border border-border/40 border-t-0 shadow-2xl shadow-primary/10 relative">
                <img
                  src={demoShowcase}
                  alt="Demonstracao da plataforma Decode Analytics em uso"
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                  loading="lazy"
                  width={1280}
                  height={720}
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-500">
                  <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse-glow">
                    <Play className="h-8 w-8 text-primary-foreground ml-1" />
                  </div>
                </div>
              </div>

              {/* Floating feature badges */}
              <div className="absolute -left-2 sm:-left-4 top-1/3 animate-float-particle" style={{ animationDuration: '8s' }}>
                <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                  <div className="rounded-md bg-success/20 p-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">Exercicio correto!</span>
                </div>
              </div>
              <div className="absolute -right-2 sm:-right-4 top-1/2 animate-float-particle" style={{ animationDuration: '10s', animationDelay: '2s' }}>
                <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                  <div className="rounded-md bg-warning/20 p-1.5">
                    <Award className="h-3.5 w-3.5 text-warning" />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">+50 XP</span>
                </div>
              </div>
              <div className="absolute -right-1 sm:-right-3 bottom-1/4 animate-float-particle" style={{ animationDuration: '12s', animationDelay: '4s' }}>
                <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                  <div className="rounded-md bg-primary/20 p-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">Streak: 7 dias</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Feature highlights below demo */}
          <ScrollReveal delay={400}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-10">
              {[
                { icon: BarChart3, label: 'Analytics em tempo real', color: 'text-primary' },
                { icon: BrainCircuit, label: 'IA para importacao', color: 'text-primary' },
                { icon: Award, label: 'Sistema de gamificacao', color: 'text-warning' },
                { icon: Shield, label: 'Conteudo protegido', color: 'text-success' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-card/60 border border-border/30">
                  <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tech Stack with marquee */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <Cpu className="h-3.5 w-3.5" /> Tecnologia
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Construído com <span className="text-gradient">tecnologia de ponta</span></h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                As melhores ferramentas do mercado para performance, segurança e experiência excepcional.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {techStack.map((tech, i) => (
              <ScrollReveal key={tech.name} delay={i * 60} direction="scale">
                <div className="glass rounded-xl p-5 text-center hover-lift h-full flex flex-col items-center gap-3 group transition-all duration-300 hover:border-primary/20">
                  <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <tech.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tech.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-accent/30 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <MessageCircle className="h-3.5 w-3.5" /> Depoimentos
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">O que nossos alunos <span className="text-gradient">dizem</span></h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
                Feedback real de quem já usa a plataforma no dia a dia.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="glass rounded-2xl p-6 h-full flex flex-col hover-lift transition-all duration-300 hover:border-primary/20">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-lg">{t.avatar}</span>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.course}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary mb-3">
                <HelpCircle className="h-3.5 w-3.5" /> FAQ
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Perguntas <span className="text-gradient">frequentes</span></h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
                Tire suas dúvidas sobre a plataforma.
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="glass rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/20">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-sm font-semibold pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}
                  >
                    <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 md:py-28 bg-accent/30">
        <div className="container px-4">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl mb-4">Conteúdo <span className="text-gradient">Protegido</span></h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
                Todo o conteúdo é protegido com marca d'água personalizada contendo nome de usuário, IP, data e hora.
                Bloqueio de PrintScreen e clique direito garantem a segurança do material exclusivo.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Marca d\'água dinâmica', 'Anti-PrintScreen', 'Anti-clique direito', 'Log de acessos'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    <Shield className="h-3 w-3" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <FloatingParticles count={15} />
        <div className="container relative px-4">
          <ScrollReveal direction="scale">
            <div className="max-w-xl mx-auto text-center glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-primary/[0.08]" />
              <div className="relative">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3 sm:text-3xl">Pronto para <span className="text-gradient-animated">revisar</span>?</h2>
                <p className="text-muted-foreground mb-6 text-sm md:text-base leading-relaxed">
                  Entre para acessar suas apostilas, estudar com foco e chegar preparado para a prova. Sua jornada começa agora.
                </p>
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground shadow-lg shadow-primary/25 animate-pulse-glow hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  onClick={() => navigate('/login')}
                >
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="container flex flex-col items-center gap-4 text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <img src={logoDark} alt="Decode Analytics" className="h-7 w-7 rounded-lg object-cover" />
            <span className="font-bold text-foreground">Decode Analytics</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <button onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">Recursos</button>
            <button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">Entrar</button>
          </div>
          <p className="text-xs text-center">Desenvolvido por Kaique Aurelio &middot; &copy; {new Date().getFullYear()} &middot; Todos os direitos reservados</p>
        </div>
      </footer>

      {/* Install Guide Modal */}
      <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Instalar o App
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para instalar, abra o site publicado no navegador do seu celular e siga as instrucoes:
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
                <p>2. Toque em <strong>Compartilhar</strong> (icone ↑)</p>
                <p>3. Toque em <strong>Adicionar a Tela de Inicio</strong></p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
