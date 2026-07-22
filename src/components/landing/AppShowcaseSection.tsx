import { motion } from 'framer-motion';
import { Reveal } from '@/components/Reveal';

const chips = [
  'Dashboard',
  'Apostilas',
  'Exercícios',
  'Gamificação',
  'Flashcards',
  'Pomodoro',
  'Biblioteca',
];

export function AppShowcaseSection() {
  return (
    <section className="relative py-28 md:py-36 bg-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[140px] opacity-[0.08]" style={{ background: 'radial-gradient(circle, #ffffff, transparent 60%)' }} />
        <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.06]" style={{ background: 'radial-gradient(circle, #ffffff, transparent 60%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <Reveal from="bottom" distance={40}>
          <div className="text-center mb-12">
            <div className="liquid-glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-xs tracking-[0.2em] text-white/80 font-semibold">VEJA POR DENTRO</span>
            </div>
            <h2
              className="text-4xl md:text-6xl text-white tracking-tight leading-[1.05]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Tudo que você precisa para<br />
              dominar sua graduação
            </h2>
            <p className="mt-5 text-base md:text-lg text-white/55 max-w-2xl mx-auto">
              Um tour rápido pelo dia a dia na Academy: do dashboard ao ranking semanal.
            </p>
          </div>
        </Reveal>

        <Reveal from="bottom" distance={60} delay={150}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="liquid-glass-strong relative rounded-2xl overflow-hidden shadow-2xl">
              <video
                src="/showcase/decode-app-tour.mp4"
                poster="/showcase/decode-app-tour-poster.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="block w-full h-auto"
              >
                <source src="/showcase/decode-app-tour.webm" type="video/webm" />
                <source src="/showcase/decode-app-tour.mp4" type="video/mp4" />
                <img src="/showcase/decode-app-tour.gif" alt="Tour pelo Decode Analytics Academy" className="block w-full h-auto" />
              </video>
            </div>
          </motion.div>
        </Reveal>

        <Reveal from="bottom" distance={30} delay={350}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5">
            {chips.map(label => (
              <div
                key={label}
                className="liquid-glass px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-white/80 hover:scale-105 transition-transform"
              >
                {label}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
