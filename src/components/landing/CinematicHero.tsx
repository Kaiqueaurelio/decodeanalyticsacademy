import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Instagram, Twitter } from 'lucide-react';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4';

const FADE_MS = 500;
const FADE_OUT_BEFORE_END = 0.55; // seconds

export function CinematicHero() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);
  const [email, setEmail] = useState('');

  // rAF-based opacity fade that resumes from current opacity
  const runFade = (target: number, durationMs: number) => {
    const video = videoRef.current;
    if (!video) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const start = performance.now();
    const startOpacity = parseFloat(video.style.opacity || '0');
    const delta = target - startOpacity;
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = t; // linear is fine for such short fades
      const val = startOpacity + delta * eased;
      video.style.opacity = String(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = '0';

    const onLoaded = () => {
      fadingOutRef.current = false;
      runFade(1, FADE_MS);
    };
    const onPlay = () => {
      if (!fadingOutRef.current && parseFloat(video.style.opacity || '0') < 1) {
        runFade(1, FADE_MS);
      }
    };
    const onTimeUpdate = () => {
      if (fadingOutRef.current) return;
      const remaining = video.duration - video.currentTime;
      if (isFinite(remaining) && remaining <= FADE_OUT_BEFORE_END) {
        fadingOutRef.current = true;
        runFade(0, FADE_MS);
      }
    };
    const onEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        try {
          video.currentTime = 0;
          const p = video.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
        } catch {}
        fadingOutRef.current = false;
        runFade(1, FADE_MS);
      }, 100);
    };

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('play', onPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    // Try to play (autoplay muted allowed)
    const p = video.play();
    if (p && typeof p.then === 'function') p.catch(() => {});

    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const scrollToLearn = () => {
    document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');`}</style>

      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* Background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
          src={VIDEO_SRC}
          autoPlay
          muted
          playsInline
          preload="auto"
          style={{ opacity: 0 }}
        />
        {/* subtle darkening to keep glass readable */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Nav */}
          <nav className="relative z-20 pl-6 pr-6 py-6">
            <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-white font-semibold text-lg"
                >
                  <Globe size={24} />
                  <span>Decode Analytics</span>
                </button>
                <div className="hidden md:flex items-center gap-8">
                  <a href="#recursos" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Recursos</a>
                  <a href="#roadmap" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Trilha</a>
                  <a href="#depoimentos" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Depoimentos</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-white text-sm font-medium hover:text-white/80 transition-colors"
                >
                  Cadastro
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Acessar
                </button>
              </div>
            </div>
          </nav>

          {/* Hero content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Sua plataforma de estudos
            </h1>

            <div className="max-w-xl w-full space-y-4">
              <form
                onSubmit={handleSubmit}
                className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu email"
                  className="flex-1 bg-transparent outline-none border-none text-white placeholder:text-white/40 text-base"
                />
                <button
                  type="submit"
                  aria-label="Enviar"
                  className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              </form>

              <p className="text-white text-sm leading-relaxed px-4">
                Apostilas, exercícios, flashcards e acompanhamento de progresso.
                Tudo que você precisa para dominar suas disciplinas.
              </p>


              <div className="flex justify-center">
                <button
                  onClick={scrollToLearn}
                  className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Ver o manifesto
                </button>
              </div>
            </div>
          </div>

          {/* Social icons footer */}
          <div className="relative z-10 flex justify-center gap-4 pb-12">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <Twitter size={20} />
            </a>
            <a
              href="/"
              aria-label="Site"
              className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <Globe size={20} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default CinematicHero;
