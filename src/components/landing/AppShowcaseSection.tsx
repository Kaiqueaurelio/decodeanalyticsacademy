import { motion } from 'framer-motion';
import { Reveal } from '@/components/Reveal';

const chips = [
  { label: 'Dashboard', color: '#00f0ff' },
  { label: 'Apostilas', color: '#a855f7' },
  { label: 'Exercícios', color: '#22c55e' },
  { label: 'Gamificação', color: '#f59e0b' },
  { label: 'Flashcards', color: '#ec4899' },
  { label: 'Pomodoro', color: '#3b82f6' },
  { label: 'Biblioteca', color: '#06b6d4' },
];

export function AppShowcaseSection() {
  return (
    <section className="relative py-28 md:py-36" style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.45) 0%, rgba(10,10,20,0.6) 50%, rgba(5,5,8,0.45) 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[140px] opacity-20" style={{ background: 'radial-gradient(circle, #00f0ff, transparent 60%)' }} />
        <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20" style={{ background: 'radial-gradient(circle, #a855f7, transparent 60%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <Reveal from="bottom" distance={40}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs tracking-[0.2em] text-cyan-300 font-semibold">VEJA POR DENTRO</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.05]">
              Tudo que você precisa para<br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">dominar sua graduação</span>
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
            {/* glow */}
            <div className="absolute -inset-6 rounded-3xl opacity-60 blur-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.4), rgba(168,85,247,0.4))' }} />

            {/* device frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#08080f] shadow-2xl">
              <video
                src="/showcase/decode-app-tour.mp4"
                poster="/showcase/decode-app-tour-poster.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                className="block w-full h-auto"
              />

            </div>

            {/* bottom shadow */}
            <div className="absolute -bottom-10 left-10 right-10 h-10 rounded-full blur-2xl opacity-50" style={{ background: 'radial-gradient(ellipse, rgba(0,240,255,0.5), transparent 70%)' }} />
          </motion.div>
        </Reveal>

        <Reveal from="bottom" distance={30} delay={350}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5">
            {chips.map(c => (
              <div
                key={c.label}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border"
                style={{ borderColor: `${c.color}44`, color: c.color, background: `${c.color}10` }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
