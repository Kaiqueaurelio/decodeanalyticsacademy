import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Instagram, Globe, Youtube, GraduationCap } from 'lucide-react';
import logoDark from '@/assets/owl-icon.png';

const VIDEO_SRC = '/showcase/decode-app-tour.mp4';
const VIDEO_POSTER = '/showcase/decode-app-tour-poster.jpg';
const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // seconds before end to start fading out

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function HeroCinematic() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);
  const [videoBroken, setVideoBroken] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion()) {
      video.style.opacity = '1';
      return;
    }

    const cancelAnim = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const fadeTo = (target: number, onDone?: () => void) => {
      cancelAnim();
      const start = performance.now();
      const from = parseFloat(video.style.opacity || '0') || 0;
      const delta = target - from;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        const value = from + delta * t;
        video.style.opacity = String(value);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          onDone?.();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const handleLoaded = () => {
      video.style.opacity = '0';
      fadingOutRef.current = false;
      video.play().catch(() => {});
      fadeTo(1);
    };

    const handleTimeUpdate = () => {
      if (!video.duration || fadingOutRef.current) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_LEAD) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };

    const handleEnded = () => {
      cancelAnim();
      video.style.opacity = '0';
      window.setTimeout(() => {
        try {
          video.currentTime = 0;
          fadingOutRef.current = false;
          video.play().catch(() => {});
          fadeTo(1);
        } catch {
          /* noop */
        }
      }, 100);
    };

    const handleError = () => setVideoBroken(true);

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // if the video is already ready when this effect runs
    if (video.readyState >= 2) handleLoaded();

    return () => {
      cancelAnim();
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const scrollToShowcase = () => {
    const el = document.getElementById('recursos');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-dvh bg-black overflow-hidden flex flex-col">
      {/* Background video */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {!videoBroken ? (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={VIDEO_POSTER}
            muted
            playsInline
            autoPlay
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
            style={{ opacity: 0 }}
          />
        ) : (
          <img
            src={VIDEO_POSTER}
            alt=""
            className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
          />
        )}

        {/* Overlays: darken + brand tint */}
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 15%, rgba(0,240,255,0.18), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(168,85,247,0.18), transparent 55%), linear-gradient(180deg, rgba(5,5,8,0.35) 0%, rgba(5,5,8,0.15) 40%, rgba(5,5,8,0.85) 100%)',
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-20 pl-6 pr-6 py-6">
        <div className="liquid-glass rounded-full px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img
                src={logoDark}
                alt="Decode Analytics"
                className="h-7 w-7 object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.55)]"
              />
              <span className="text-white font-semibold text-base md:text-lg tracking-tight">
                Decode Academy
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#recursos" className="text-white/80 hover:text-white transition-colors text-sm font-medium no-underline">Recursos</a>
              <a href="#depoimentos" className="text-white/80 hover:text-white transition-colors text-sm font-medium no-underline">Depoimentos</a>
              <a href="#sobre" className="text-white/80 hover:text-white transition-colors text-sm font-medium no-underline">Sobre</a>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline text-white text-sm font-medium hover:text-white/80 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/login')}
              className="liquid-glass liquid-glass-interactive rounded-full px-5 md:px-6 py-2 text-white text-sm font-semibold"
            >
              Começar agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[8%] md:-translate-y-[12%]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 liquid-glass text-[10px] md:text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          <GraduationCap className="h-3 w-3" />
          Plataforma de Estudos UNIP
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 md:mb-8 tracking-tight leading-[1.02] font-bold max-w-4xl">
          Sua plataforma{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)' }}
          >
            de estudos
          </span>{' '}
          completa.
        </h1>

        <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-xl px-4 mb-8">
          Apostilas, exercícios, flashcards e acompanhamento de progresso.
          Tudo que você precisa para dominar suas disciplinas de Computação, Sistemas e Engenharia.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-3 bg-white text-black rounded-full pl-6 pr-2 py-2 text-sm md:text-base font-semibold hover:bg-white/90 transition-colors"
          >
            <span>Entrar na plataforma</span>
            <span className="bg-black rounded-full p-2.5 text-white flex items-center justify-center">
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
          <button
            onClick={scrollToShowcase}
            className="liquid-glass liquid-glass-interactive rounded-full px-6 md:px-8 py-3 text-white text-sm font-medium"
          >
            Ver por dentro
          </button>
        </div>

        <div className="flex items-center gap-6 md:gap-10 pt-4">
          {[
            { val: '48', label: 'Disciplinas' },
            { val: '+100', label: 'Alunos ativos' },
            { val: '24/7', label: 'Acesso total' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{s.val}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social footer */}
      <div className="relative z-10 flex justify-center gap-4 pb-10 md:pb-12">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="liquid-glass liquid-glass-interactive rounded-full p-3.5 md:p-4 text-white/80 hover:text-white transition-colors"
        >
          <Instagram className="h-5 w-5" />
        </a>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className="liquid-glass liquid-glass-interactive rounded-full p-3.5 md:p-4 text-white/80 hover:text-white transition-colors"
        >
          <Youtube className="h-5 w-5" />
        </a>
        <a
          href="https://decodeanalyticsacademy.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Site"
          className="liquid-glass liquid-glass-interactive rounded-full p-3.5 md:p-4 text-white/80 hover:text-white transition-colors"
        >
          <Globe className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}
