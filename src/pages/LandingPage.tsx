import { useState, useRef, useEffect, lazy } from 'react';
import { DeferredSection } from '@/components/DeferredSection';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowRight, BookOpen, GraduationCap, Cpu, Brain,
  ChevronRight, Download, Smartphone, Layers, Rocket, Target,
  BarChart3, PenLine, Flame, TrendingUp, CheckCircle,
} from 'lucide-react';
import logoAvif1x from '@/assets/owl-icon-72.avif';
import logoAvif2x from '@/assets/owl-icon-144.avif';
import logoWebp1x from '@/assets/owl-icon-72.webp';
import logoWebp2x from '@/assets/owl-icon-144.webp';
import logoPng1x from '@/assets/owl-icon-72.png';
import logoPng2x from '@/assets/owl-icon-144.png';
import heroPoster from '@/assets/hero-bg-poster.jpg.asset.json';
import { Reveal } from '@/components/Reveal';

/* ─── SEÇÕES ABAIXO DA DOBRA: carregadas sob demanda (menor bundle inicial / LCP) ─── */
const TestimonialsSection = lazy(() => import('@/components/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const CreatorSection = lazy(() => import('@/components/CreatorSection').then(m => ({ default: m.CreatorSection })));
const LiveAppSection = lazy(() => import('@/components/LiveAppSection').then(m => ({ default: m.LiveAppSection })));
const SocialAndProjectsSection = lazy(() => import('@/components/SocialAndProjectsSection').then(m => ({ default: m.SocialAndProjectsSection })));
const AppShowcaseSection = lazy(() => import('@/components/landing/AppShowcaseSection').then(m => ({ default: m.AppShowcaseSection })));
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const EllaFeatureSection = lazy(() => import('@/components/landing/EllaFeatureSection').then(m => ({ default: m.EllaFeatureSection })));
const PlatformEngineSection = lazy(() => import('@/components/landing/PlatformEngineSection').then(m => ({ default: m.PlatformEngineSection })));
const FaqSection = lazy(() => import('@/components/landing/FaqSection').then(m => ({ default: m.FaqSection })));
const SponsorsSection = lazy(() => import('@/components/landing/SponsorsSection').then(m => ({ default: m.SponsorsSection })));

/**
 * Só monta a seção (e baixa o chunk) quando ela chega perto do viewport.
 * Antes todos os chunks eram baixados logo no mount, anulando o lazy.
 */
function LazySection({ children }: { children: React.ReactNode }) {
  return <DeferredSection minHeight="55vh">{children}</DeferredSection>;
}



/* ─── SECTION WRAPPER: usa o Reveal compartilhado (IntersectionObserver + reduced-motion) ─── */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal from="bottom" distance={48} delay={delay * 1000} className={className}>
      {children}
    </Reveal>
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
  const [appOrigin, setAppOrigin] = useState<string>('https://decodeanalyticsacademy.com.br');
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  // O vídeo de fundo roda sempre, em qualquer dispositivo; só é montado logo
  // após o primeiro paint para não atrasar o hero.
  const [bgVideoEnabled, setBgVideoEnabled] = useState(false);
  const [videoBlocked, setVideoBlocked] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    let raf = 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = window.requestAnimationFrame(() => {
        setShowStickyCta(window.scrollY > 640);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin?.startsWith('http')) {
      setAppOrigin(window.location.origin);
    }
  }, []);

  // O vídeo de fundo sempre roda: sem cortes por tamanho de tela, economia de
  // dados ou rolagem. Ele é apenas montado logo após o primeiro paint.
  useEffect(() => {
    const id = window.setTimeout(() => setBgVideoEnabled(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!bgVideoEnabled) return;
    const video = heroVideoRef.current;
    if (!video) return;

    // iOS/Safari exige muted + playsinline definidos no elemento ANTES do play().
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('disableRemotePlayback', 'true');

    let disposed = false;

    const startPlayback = () => {
      if (disposed) return;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt
          .then(() => setVideoBlocked(false))
          .catch(() => {
            // Safari em Modo de Baixo Consumo bloqueia o autoplay:
            // liberamos na primeira interação do usuário (ou no botão de play).
            setVideoBlocked(true);
            armGestureUnlock();
          });
      }
    };

    let gestureArmed = false;
    const gestureEvents: Array<keyof DocumentEventMap> = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'scroll'];
    const onGesture = () => {
      disarmGestureUnlock();
      void video.play().catch(() => {});
    };
    function armGestureUnlock() {
      if (gestureArmed || disposed) return;
      gestureArmed = true;
      gestureEvents.forEach((evt) =>
        document.addEventListener(evt, onGesture, { once: true, passive: true } as AddEventListenerOptions),
      );
    }
    function disarmGestureUnlock() {
      if (!gestureArmed) return;
      gestureArmed = false;
      gestureEvents.forEach((evt) => document.removeEventListener(evt, onGesture));
    }

    // Loop manual: alguns builds do Safari ignoram o atributo `loop` quando o
    // vídeo é retomado após ficar em background.
    const onEnded = () => {
      try {
        video.currentTime = 0;
      } catch { /* noop */ }
      startPlayback();
    };

    const onPlaying = () => setVideoBlocked(false);

    startPlayback();
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', startPlayback);
    video.addEventListener('loadedmetadata', startPlayback);
    video.addEventListener('loadeddata', startPlayback);
    video.addEventListener('stalled', startPlayback);
    video.addEventListener('suspend', startPlayback);
    video.addEventListener('pause', startPlayback);
    video.addEventListener('ended', onEnded);

    // Mantém o movimento sempre que a aba/app volta a ficar visível (iOS dispara pagehide/pageshow).
    const onVisible = () => {
      if (document.visibilityState === 'visible') startPlayback();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', startPlayback);
    window.addEventListener('focus', startPlayback);

    // Rede de segurança: se por algum motivo o vídeo travar, retoma sozinho.
    const keepAlive = window.setInterval(() => {
      if (video.paused && document.visibilityState === 'visible') startPlayback();
    }, 3000);

    return () => {
      disposed = true;
      disarmGestureUnlock();
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('loadedmetadata', startPlayback);
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('stalled', startPlayback);
      video.removeEventListener('suspend', startPlayback);
      video.removeEventListener('pause', startPlayback);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', startPlayback);
      window.removeEventListener('focus', startPlayback);
      window.clearInterval(keepAlive);
    };
  }, [bgVideoEnabled]);




  // Deixa body/html transparentes enquanto a landing estiver montada, para o vídeo de fundo (portal z:-1) aparecer.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    html.style.background = '#050508';
    body.style.background = 'transparent';
    return () => {
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
    };
  }, []);



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
    <div className="landing-shell dark min-h-dvh font-cyber overflow-x-hidden selection:bg-primary/30 relative" style={{ color: '#e2e8f0' }}>

      {/* ═══ VIDEO DE FUNDO GLOBAL (portal em document.body para escapar de transforms de ancestrais) ═══ */}
      {typeof document !== 'undefined' && createPortal(
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ zIndex: -1 }}
        >
          {/* Fallback estático: aparece se o autoplay for bloqueado (iOS/Safari) ou o vídeo não carregar */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `url(${heroPoster.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {bgVideoEnabled && (
            <video
              ref={heroVideoRef}
              className="landing-bg-video relative h-full w-full scale-[1.03] object-cover opacity-60"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              disablePictureInPicture
              preload="auto"
              poster={heroPoster.url}
              // atributos legados necessários no Safari iOS
              webkit-playsinline="true"
              x5-playsinline="true"
              disableRemotePlayback
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
            />

          )}
          <div className="landing-bg-scrim absolute inset-0" />


        </div>,
        document.body,
      )}


      {/* ═══ HERO / NAVEGAÇÃO ═══ */}
      <section className="relative isolate min-h-screen overflow-hidden">
        <CyberGrid />
        <div className="hero-video-vignette pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden h-[527px] w-[min(984px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050508]/90 blur-[82px] sm:block"
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="px-5 py-5 sm:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <a href="/" className="flex items-center gap-3" aria-label="Decode Analytics Academy">
                <picture>
                  <source type="image/avif" srcSet={`${logoAvif1x} 1x, ${logoAvif2x} 2x`} />
                  <source type="image/webp" srcSet={`${logoWebp1x} 1x, ${logoWebp2x} 2x`} />
                  <img src={logoPng1x} srcSet={`${logoPng1x} 1x, ${logoPng2x} 2x`} alt="" width={36} height={36} decoding="async" {...{ fetchpriority: 'high' }} className="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]" />
                </picture>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00f0ff]">Decode Analytics</span>
              </a>
              <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
                <a href="#recursos" className="text-sm text-white/80 transition-colors hover:text-white">Recursos</a>
                <a href="#roadmap" className="text-sm text-white/80 transition-colors hover:text-white">Trilha</a>
                <a href="#depoimentos" className="text-sm text-white/80 transition-colors hover:text-white">Depoimentos</a>
              </nav>
              <Button
                size="sm"
                onClick={() => navigate('/login')}
                className="rounded-full border border-white/15 bg-white/10 px-5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/20"
              >
                Entrar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mx-auto mt-4 h-px max-w-7xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </header>

          <main className="flex flex-1 items-center justify-center px-5 pb-20 pt-10 text-center">
            {/* Sem gate de JS/framer-motion: o texto do hero (elemento LCP) pinta
                no primeiro frame e a entrada é feita só por CSS. */}
            <div className="hero-entrance mx-auto max-w-5xl">

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-sm">
                <GraduationCap className="h-3.5 w-3.5 text-[#00f0ff]" />
                Plataforma de estudos
              </div>
              <h1 className="max-w-4xl text-5xl font-bold leading-[0.94] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
                Estude com
                <span className="mt-2 block bg-gradient-to-r from-[#00f0ff] via-[#a855f7] to-[#c084fc] bg-clip-text text-transparent">
                  inteligência.
                </span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                Apostilas, exercícios, flashcards e acompanhamento de progresso para você dominar cada disciplina.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  onClick={() => navigate('/login')}
                  className="h-12 rounded-full bg-[#00f0ff] px-7 text-sm font-bold text-[#050508] shadow-[0_0_35px_rgba(0,240,255,0.28)] hover:bg-[#75f6ff]"
                >
                  Começar a estudar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a href="#recursos" className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.05] px-7 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
                  Conheça os recursos
                </a>
              </div>
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
                <div className="hero-stat-card rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-[#00f0ff]">48</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/65">Disciplinas</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                  <p className="text-sm font-bold text-white">Exercícios</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/65">Práticos e comentados</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                  <p className="text-sm font-bold text-white">Acesse onde estiver</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/65">Computador e celular</p>
                </div>
              </div>
              <div className="hero-signal mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
                Conteúdo organizado por semestre e disciplina
              </div>
              <a href="#recursos" className="hero-scroll-cue mx-auto mt-7 flex w-fit flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white">
                Explore os recursos
                <span className="h-7 w-px bg-gradient-to-b from-[#00f0ff] to-transparent" aria-hidden="true" />
              </a>
            </div>

          </main>

          <div className="hero-marquee-shell overflow-hidden border-t border-white/10 py-5" aria-label="Recursos da plataforma">
            <div className="hero-marquee flex w-max items-center gap-10 whitespace-nowrap text-sm font-semibold text-white/75 motion-reduce:animate-none">
              <span>Apostilas</span><span className="text-[#00f0ff]">✦</span><span>Exercícios</span><span className="text-[#00f0ff]">✦</span><span>Flashcards</span><span className="text-[#00f0ff]">✦</span><span>Simulados</span><span className="text-[#00f0ff]">✦</span><span>Progresso</span><span className="text-[#00f0ff]">✦</span><span>Calendário</span><span className="text-[#00f0ff]">✦</span>
              <span>Apostilas</span><span className="text-[#00f0ff]">✦</span><span>Exercícios</span><span className="text-[#00f0ff]">✦</span><span>Flashcards</span><span className="text-[#00f0ff]">✦</span><span>Simulados</span><span className="text-[#00f0ff]">✦</span><span>Progresso</span><span className="text-[#00f0ff]">✦</span><span>Calendário</span><span className="text-[#00f0ff]">✦</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ APP SHOWCASE (Veja por dentro) ═══ */}
      <LazySection><AppShowcaseSection /></LazySection>

      {/* ═══ COMO FUNCIONA + NÚMEROS ═══ */}
      <LazySection><HowItWorksSection /></LazySection>

      {/* ═══ ELLA RIBEIRO — ASSISTENTE DE ESTUDOS ═══ */}
      <LazySection><EllaFeatureSection /></LazySection>

      {/* ═══ SOB O CAPÔ: ENGENHARIA + BENEFÍCIOS ═══ */}
      <LazySection><PlatformEngineSection /></LazySection>



      {/* ═══ RECURSOS ═══ */}
      <section id="recursos" className="relative py-28 md:py-36">
        <CyberGrid />
        <GlowOrb className="w-[400px] h-[300px] top-20 right-0" style={{ background: 'rgba(168,85,247,0.06)' } as any} />

        <div className="max-w-7xl mx-auto px-5 relative">
          <ScrollReveal>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#00f0ff' }}>
              <Rocket className="h-3 w-3 inline mr-2" />Recursos da Plataforma
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
      <section id="roadmap" className="relative py-28 md:py-36" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.4) 0%, rgba(10,10,20,0.55) 50%, rgba(5,5,8,0.4) 100%)' }}>
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
      <section className="relative py-28 md:py-36" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.4) 0%, rgba(13,13,22,0.55) 50%, rgba(5,5,8,0.4) 100%)' }}>
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

      {/* ═══ PROVA SOCIAL ═══ */}
      <LazySection><div id="depoimentos"><TestimonialsSection /></div></LazySection>

      {/* ═══ OBJEÇÕES: FAQ ═══ */}
      <LazySection><FaqSection /></LazySection>

      {/* ═══ APP AO VIVO / INSTALAÇÃO ═══ */}
      <LazySection><LiveAppSection /></LazySection>

      {/* ═══ CREATOR / DE ALUNO PARA ALUNO ═══ */}
      <LazySection><CreatorSection /></LazySection>

      {/* ═══ ANUNCIANTES / PATROCINADORES ═══ */}
      <LazySection><SponsorsSection /></LazySection>

      {/* ═══ REDES SOCIAIS + WRITELAB ═══ */}
      <LazySection><SocialAndProjectsSection /></LazySection>

      {/* ═══ CTA FIXO (mobile) — em portal para escapar de transforms de ancestrais ═══ */}
      {typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050508]/92 px-4 py-3 backdrop-blur-md transition-transform duration-300 md:hidden ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="h-11 flex-1 rounded-full bg-[#00f0ff] text-sm font-bold text-[#050508] hover:bg-[#75f6ff]"
            >
              Começar a estudar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              onClick={handleInstallPWA}
              aria-label="Instalar aplicativo"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body,
      )}


      {/* ═══ FOOTER ═══ */}

      <footer className="py-10 px-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <picture>
              <source type="image/avif" srcSet={`${logoAvif1x} 1x, ${logoAvif2x} 2x`} />
              <source type="image/webp" srcSet={`${logoWebp1x} 1x, ${logoWebp2x} 2x`} />
              <img src={logoPng1x} srcSet={`${logoPng1x} 1x, ${logoPng2x} 2x`} alt="Decode Analytics" width={32} height={32} loading="lazy" decoding="async" className="h-8 w-8 object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.45)]" />
            </picture>
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
              <a
                href={appOrigin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold underline break-all"
                style={{ color: '#00f0ff' }}
              >
                {appOrigin.replace(/^https?:\/\//, '')}
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
