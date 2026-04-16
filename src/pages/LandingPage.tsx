import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowRight, BookOpen, GraduationCap, Cpu, Brain, Award,
  ChevronRight, Download, Smartphone, Star, MessageCircle,
  Layers, Zap, Target, BarChart3, FileText, Users, PenLine,
  Flame, TrendingUp, Clock, CheckCircle,
} from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { CreatorSection } from '@/components/CreatorSection';
import { TechStackSection } from '@/components/TechStackSection';
import { LiveAppSection } from '@/components/LiveAppSection';
import { SocialAndProjectsSection } from '@/components/SocialAndProjectsSection';

/* ─── SECTION WRAPPER: Fade + slide on scroll ─── */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── PARALLAX IMAGE ─── */
function ParallaxBlock({ children, speed = 0.3, className = '' }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── GLOW ORB ─── */
function GlowOrb({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} style={style} />;
}

/* ─── GRID BG ─── */
function CyberGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
    </div>
  );
}

/* ─── DATA ─── */
const features = [
  { icon: BookOpen, name: 'Apostilas Interativas', desc: 'Conteúdo estruturado por disciplina com anotações', color: '#00f0ff' },
  { icon: PenLine, name: 'Exercícios de Fixação', desc: 'Questões com gabarito e explicação detalhada', color: '#a855f7' },
  { icon: Brain, name: 'Flashcards Inteligentes', desc: 'Revisão espaçada para memorização eficiente', color: '#22c55e' },
  { icon: Flame, name: 'Gamificação & XP', desc: 'Pontos, badges, streaks e ranking entre alunos', color: '#f59e0b' },
];

const roadmap = [
  { phase: '01', title: 'Fundamentos', desc: 'Lógica de programação, matemática discreta e introdução à computação.', icon: Cpu },
  { phase: '02', title: 'Desenvolvimento', desc: 'Estrutura de dados, algoritmos, banco de dados e engenharia de software.', icon: Layers },
  { phase: '03', title: 'Especialização', desc: 'Redes, segurança, inteligência artificial e computação em nuvem.', icon: Brain },
  { phase: '04', title: 'Prática & Projetos', desc: 'Projetos integradores, estágio supervisionado e TCC.', icon: Target },
];

const testimonials = [
  { name: 'Ana Silva', role: 'Aluna de CC - 4º Sem.', text: 'As apostilas e exercícios me ajudaram muito nas provas. Consegui aumentar minha média de 6 para 9!', initials: 'AS', color: '#00f0ff' },
  { name: 'Carlos Santos', role: 'Aluno de SI - 6º Sem.', text: 'O sistema de flashcards é incrível para revisar antes das provas. Melhor plataforma de estudos.', initials: 'CS', color: '#a855f7' },
  { name: 'Juliana Costa', role: 'Aluna de EC - 3º Sem.', text: 'A gamificação me motiva a estudar todos os dias. Já tenho um streak de 30 dias!', initials: 'JC', color: '#22c55e' },
];

const faqs = [
  { q: 'Para quais cursos a plataforma é voltada?', a: 'Ciência da Computação, Sistemas de Informação e Engenharia da Computação — do 1º ao 8º semestre.' },
  { q: 'Como funcionam os exercícios?', a: 'Questões de múltipla escolha com gabarito comentado e explicação detalhada para cada alternativa.' },
  { q: 'Posso acessar pelo celular?', a: 'Sim! A plataforma é um PWA — funciona no navegador e pode ser instalada como app no celular.' },
  { q: 'O conteúdo é gratuito?', a: 'Todo o conteúdo disponível na plataforma é acessível para alunos cadastrados.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 0.5], [0, -80]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 0.95]);

  const handleInstallPWA = async () => {
    try {
      const deferredPrompt = (window as any).__pwaInstallPrompt;
      if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') (window as any).__pwaInstallPrompt = null;
        return;
      }
    } catch (e) { console.warn('PWA prompt failed:', e); }
    setShowInstallGuide(true);
  };

  return (
    <div className="min-h-screen font-cyber overflow-x-hidden" style={{ background: '#050508', color: '#e2e8f0' }}>

      {/* ═══ NAV ═══ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(5,5,8,0.85)', borderBottom: '1px solid rgba(0,240,255,0.08)' }}
      >
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <img src={logoDark} alt="Decode Analytics" className="h-7 w-7 rounded object-cover" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#00f0ff' }}>
              Decode Analytics
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#recursos" className="text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors no-underline">Recursos</a>
            <a href="#roadmap" className="text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors no-underline">Trilha</a>
            <a href="#depoimentos" className="text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors no-underline">Depoimentos</a>
          </nav>
          <Button
            size="sm"
            onClick={() => navigate('/login')}
            className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider border-0 rounded-md"
            style={{ background: '#00f0ff', color: '#050508' }}
          >
            Acessar <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      </motion.header>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-14">
        <CyberGrid />
        <GlowOrb className="w-[500px] h-[400px] top-1/4 left-0" style={{ background: 'rgba(0,240,255,0.06)' } as any} />
        <GlowOrb className="w-[400px] h-[300px] bottom-0 right-0" style={{ background: 'rgba(168,85,247,0.05)' } as any} />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="max-w-7xl mx-auto px-5 py-24 md:py-0 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)', color: '#00f0ff' }}
              >
                <GraduationCap className="h-3 w-3" /> Plataforma de Estudos
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.8rem] font-bold leading-[1.05] tracking-tight"
              >
                Sua plataforma
                <br />
                <span style={{ color: '#00f0ff' }}>de estudos</span>
                <br />
                <span className="text-gray-500">completa.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="text-base md:text-lg leading-relaxed max-w-lg"
                style={{ color: '#94a3b8' }}
              >
                Apostilas, exercícios, flashcards e acompanhamento de progresso.
                Tudo que você precisa para dominar suas disciplinas.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <button
                  onClick={() => navigate('/login')}
                  className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.25)]"
                  style={{ background: '#00f0ff', color: '#050508' }}
                >
                  Começar agora
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                className="flex items-center gap-8 pt-4"
              >
                {[
                  { val: '48', label: 'Disciplinas' },
                  { val: '+100', label: 'Alunos Ativos' },
                  { val: '24/7', label: 'Acesso Total' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold" style={{ color: '#00f0ff' }}>{s.val}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Dashboard preview mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="rounded-xl overflow-hidden" style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.12)', boxShadow: '0 0 60px rgba(0,240,255,0.08)' }}>
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] ml-2 uppercase tracking-wider" style={{ color: '#475569' }}>Decode Analytics Dashboard</span>
                </div>
                {/* Dashboard content */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Apostilas', value: '12', icon: '📚' },
                      { label: 'XP Total', value: '2,450', icon: '⚡' },
                      { label: 'Streak', value: '7 dias', icon: '🔥' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg p-3" style={{ background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.06)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>{m.icon} {m.label}</p>
                        <p className="text-lg font-bold" style={{ color: '#00f0ff' }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Progress bars */}
                  <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#64748b' }}>Progresso por Disciplina</p>
                    {[
                      { name: 'Estrutura de Dados', pct: 85 },
                      { name: 'Banco de Dados', pct: 60 },
                      { name: 'Redes de Computadores', pct: 40 },
                    ].map(d => (
                      <div key={d.name} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span style={{ color: '#94a3b8' }}>{d.name}</span>
                          <span style={{ color: '#00f0ff' }}>{d.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(0,240,255,0.1)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${d.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(to right, rgba(0,240,255,0.5), rgba(0,240,255,0.9))' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5" style={{ border: '1px solid rgba(0,240,255,0.3)' }}>
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-1.5 rounded-full"
              style={{ background: '#00f0ff' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ═══ RECURSOS ═══ */}
      <section id="recursos" className="relative py-28 md:py-36">
        <CyberGrid />
        <GlowOrb className="w-[400px] h-[300px] top-20 right-0" style={{ background: 'rgba(168,85,247,0.06)' } as any} />

        <div className="max-w-7xl mx-auto px-5 relative">
          <ScrollReveal>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#00f0ff' }}>
              <Zap className="h-3 w-3 inline mr-2" />Recursos da Plataforma
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 leading-tight">
              Tudo para você
              <br />
              <span style={{ color: '#64748b' }}>estudar melhor.</span>
            </h2>
          </ScrollReveal>

          {/* Irregular grid: 1 large + rest small */}
          <div className="grid lg:grid-cols-3 gap-4 mt-14">
            {/* Featured card */}
            <ScrollReveal className="lg:col-span-2 lg:row-span-2" delay={0.1}>
              <div
                className="h-full rounded-xl p-8 md:p-10 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,240,255,0.1)]"
                style={{ background: 'linear-gradient(135deg, #0a0a14, #0f0f1a)', border: '1px solid rgba(0,240,255,0.1)' }}
              >
                <div className="absolute top-0 right-0 w-60 h-60 rounded-full blur-[100px] opacity-20" style={{ background: '#00f0ff' }} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.15)' }}>
                      <BookOpen className="h-6 w-6" style={{ color: '#00f0ff' }} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>
                      Em Destaque
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Apostilas Completas</h3>
                  <p className="text-sm md:text-base leading-relaxed max-w-md" style={{ color: '#94a3b8' }}>
                    Conteúdo estruturado e organizado por semestre e disciplina.
                    48 disciplinas do 1º ao 8º semestre — com exercícios, resumos e material de apoio.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-6">
                    {['CC', 'SI', 'EC', '1º-8º Sem.', '48 Disciplinas'].map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(0,240,255,0.06)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.12)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8">
                    <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: '#00f0ff' }}>
                      Acessar apostilas <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature cards */}
            {features.map((feat, i) => (
              <ScrollReveal key={feat.name} delay={0.15 + i * 0.08}>
                <div
                  className="rounded-xl p-5 h-full group transition-all duration-500 hover:translate-y-[-4px]"
                  style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg" style={{ background: `${feat.color}10`, border: `1px solid ${feat.color}20` }}>
                      <feat.icon className="h-4 w-4" style={{ color: feat.color }} />
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold mb-1 group-hover:text-white transition-colors" style={{ color: '#cbd5e1' }}>{feat.name}</h4>
                  <p className="text-xs" style={{ color: '#475569' }}>{feat.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROADMAP / TRILHA ACADÊMICA ═══ */}
      <section id="roadmap" className="relative py-28 md:py-36" style={{ background: 'linear-gradient(180deg, #050508 0%, #0a0a14 50%, #050508 100%)' }}>
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — sticky text */}
            <ScrollReveal>
              <div className="lg:sticky lg:top-28">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#a855f7' }}>
                  <Layers className="h-3 w-3 inline mr-2" />Trilha Acadêmica
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-5 leading-tight">
                  Do básico ao
                  <br />
                  <span style={{ color: '#a855f7' }}>avançado.</span>
                </h2>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: '#94a3b8' }}>
                  Um roadmap estruturado que acompanha sua jornada acadêmica.
                  Cada fase constrói sobre a anterior com apostilas e exercícios práticos.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                  style={{ background: '#a855f7', color: '#fff' }}
                >
                  Iniciar trilha <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </ScrollReveal>

            {/* Right — roadmap cards */}
            <div className="space-y-4">
              {roadmap.map((step, i) => (
                <ScrollReveal key={step.phase} delay={i * 0.1}>
                  <div
                    className="rounded-xl p-6 relative group transition-all duration-500 hover:translate-x-2"
                    style={{ background: '#0a0a12', border: '1px solid rgba(168,85,247,0.08)' }}
                  >
                    <div className="flex items-start gap-5">
                      <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <step.icon className="h-5 w-5" style={{ color: '#a855f7' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: '#a855f7' }}>{step.phase}</span>
                          <h4 className="text-sm font-bold">{step.title}</h4>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{step.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#a855f7' }} />
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW — Sticky Apple-style ═══ */}
      <section className="relative py-28 md:py-36">
        <GlowOrb className="w-[500px] h-[400px] top-1/3 left-1/2 -translate-x-1/2" style={{ background: 'rgba(0,240,255,0.04)' } as any} />

        <div className="max-w-7xl mx-auto px-5">
          <ScrollReveal className="text-center mb-16">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#00f0ff' }}>
              <BarChart3 className="h-3 w-3 inline mr-2" />Dashboard
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              Acompanhe sua
              <br />
              <span style={{ color: '#00f0ff' }}>evolução.</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <ParallaxBlock speed={0.15}>
              <div
                className="rounded-2xl overflow-hidden mx-auto max-w-4xl"
                style={{ background: '#0a0a12', border: '1px solid rgba(0,240,255,0.1)', boxShadow: '0 20px 80px rgba(0,240,255,0.08)' }}
              >
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[10px] ml-2 uppercase tracking-wider" style={{ color: '#475569' }}>Decode Analytics Dashboard</span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Apostilas Lidas', value: '12', change: '+3 esta semana' },
                      { label: 'XP Total', value: '2,450', change: 'Nível 8' },
                      { label: 'Streak', value: '7 dias', change: 'Recorde: 14' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg p-4" style={{ background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.06)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>{m.label}</p>
                        <p className="text-xl font-bold" style={{ color: '#00f0ff' }}>{m.value}</p>
                        <p className="text-[10px] mt-1" style={{ color: '#475569' }}>{m.change}</p>
                      </div>
                    ))}
                  </div>
                  {/* Fake chart */}
                  <div className="rounded-lg p-4 h-32 flex items-end gap-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 rounded-sm"
                        style={{ background: `linear-gradient(to top, rgba(0,240,255,0.3), rgba(0,240,255,0.8))` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ParallaxBlock>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ POR QUE DECODE ═══ */}
      <section className="relative py-28 md:py-36" style={{ background: 'linear-gradient(180deg, #050508 0%, #0d0d16 50%, #050508 100%)' }}>
        <div className="max-w-7xl mx-auto px-5">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Estude com
              <br />
              <span style={{ color: '#64748b' }}>inteligência.</span>
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <ScrollReveal delay={0.1}>
              <div
                className="rounded-xl p-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,240,255,0.1)]"
                style={{ background: 'linear-gradient(135deg, #0a0a12, #0a0f14)', border: '1px solid rgba(0,240,255,0.1)' }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-10" style={{ background: '#00f0ff' }} />
                <div className="relative">
                  <div className="p-3 rounded-lg inline-flex mb-5" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.15)' }}>
                    <TrendingUp className="h-5 w-5" style={{ color: '#00f0ff' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#00f0ff' }}>Progresso Visível</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                    Dashboard completo com gráficos de evolução, heatmap de estudos, ranking e acompanhamento por disciplina.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {['Gráficos de Evolução', 'Heatmap de Estudos', 'XP & Níveis', 'Ranking entre Alunos'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
                        <div className="w-1 h-1 rounded-full" style={{ background: '#00f0ff' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div
                className="rounded-xl p-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]"
                style={{ background: 'linear-gradient(135deg, #0a0a12, #0f0a14)', border: '1px solid rgba(168,85,247,0.1)' }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-10" style={{ background: '#a855f7' }} />
                <div className="relative">
                  <div className="p-3 rounded-lg inline-flex mb-5" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)' }}>
                    <CheckCircle className="h-5 w-5" style={{ color: '#a855f7' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#a855f7' }}>Exercícios Práticos</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                    Exercícios de fixação com gabarito comentado e explicações detalhadas para cada alternativa.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {['Múltipla Escolha', 'Gabarito Comentado', 'Modo Simulado', 'Cronômetro Integrado'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
                        <div className="w-1 h-1 rounded-full" style={{ background: '#a855f7' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="depoimentos" className="relative py-28 md:py-36" style={{ background: 'linear-gradient(180deg, #050508, #0a0a14, #050508)' }}>
        <div className="max-w-7xl mx-auto px-5">
          <ScrollReveal className="text-center mb-16">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#00f0ff' }}>
              <MessageCircle className="h-3 w-3 inline mr-2" />Depoimentos
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              Quem usa a
              <br />
              <span style={{ color: '#00f0ff' }}>plataforma.</span>
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.1}>
                <div
                  className="rounded-xl p-6 h-full transition-all duration-500 hover:translate-y-[-4px]"
                  style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: t.color, color: '#050508' }}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>{t.role}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed italic" style={{ color: '#94a3b8' }}>"{t.text}"</p>
                  <div className="flex gap-0.5 mt-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-3 w-3" style={{ color: '#00f0ff', fill: '#00f0ff' }} />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="relative py-28 md:py-36">
        <div className="max-w-2xl mx-auto px-5">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Perguntas frequentes</h2>
          </ScrollReveal>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="rounded-xl overflow-hidden" style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="text-sm font-medium pr-4">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronRight className="h-4 w-4 rotate-90" style={{ color: '#64748b' }} />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{faq.a}</p>
                  </motion.div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-28 md:py-36">
        <GlowOrb className="w-[600px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: 'rgba(0,240,255,0.05)' } as any} />

        <ScrollReveal className="max-w-3xl mx-auto px-5 text-center relative">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Pare de improvisar.
            <br />
            Comece a
            <br />
            <span style={{ color: '#00f0ff' }}>estudar de verdade.</span>
          </h2>
          <p className="text-sm mt-6 max-w-md mx-auto" style={{ color: '#94a3b8' }}>
            Apostilas, exercícios, flashcards e gamificação. Tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,240,255,0.3)]"
              style={{ background: '#00f0ff', color: '#050508' }}
            >
              <GraduationCap className="h-4 w-4" /> Acessar plataforma
            </button>
            <button
              onClick={handleInstallPWA}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: '#64748b' }}
            >
              <Download className="h-4 w-4" /> Instalar app
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <TestimonialsSection />

      {/* ═══ CREATOR / DE ALUNO PARA ALUNO ═══ */}
      <CreatorSection />

      {/* ═══ HOW IT WAS BUILT ═══ */}
      <TechStackSection />

      {/* ═══ LIVE APP / SHARE LINK ═══ */}
      <LiveAppSection />

      {/* ═══ REDES SOCIAIS + WRITELAB ═══ */}
      <SocialAndProjectsSection />

      {/* ═══ FOOTER ═══ */}
      <footer className="py-10 px-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img src={logoDark} alt="Decode Analytics" className="h-6 w-6 rounded object-cover" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#00f0ff' }}>Decode Analytics</span>
          </div>

          {/* Selo "feito por aluno" */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.15em]"
            style={{
              background: 'rgba(0,240,255,0.06)',
              border: '1px solid rgba(0,240,255,0.2)',
              color: '#00f0ff',
            }}
          >
            <span>🎓</span>
            Feito por aluno · para alunos
          </div>

          <p className="text-[10px] uppercase tracking-[0.15em] text-center" style={{ color: '#475569' }}>
            © {new Date().getFullYear()} Decode Analytics Academy · Desenvolvido por Kaique Aurélio (Aluno de CC)
          </p>
        </div>
      </footer>

      {/* Install Guide Modal */}
      <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
        <DialogContent className="max-w-sm" style={{ background: '#0a0a12', border: '1px solid rgba(0,240,255,0.1)', color: '#e2e8f0' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-5 h-5" style={{ color: '#00f0ff' }} />
              Instalar o App
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Para instalar, abra o site publicado no navegador do seu celular:
            </p>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.12)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#00f0ff' }}>Link:</p>
              <a href="https://decodeanalyticsacademy.vercel.app" target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold underline break-all" style={{ color: '#00f0ff' }}>
                decodeanalyticsacademy.vercel.app
              </a>
            </div>
            <div className="space-y-3 text-sm" style={{ color: '#94a3b8' }}>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>iPhone / iPad (Safari)</p>
                <p>1. Abra no <strong>Safari</strong> → 2. <strong>Compartilhar ↑</strong> → 3. <strong>Adicionar à Tela</strong></p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>Android (Chrome)</p>
                <p>1. Abra no <strong>Chrome</strong> → 2. <strong>Menu ⋮</strong> → 3. <strong>Instalar app</strong></p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: '#00f0ff', color: '#050508' }}
            >
              Entendi
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
