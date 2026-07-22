import { ShieldCheck, Lock, Globe2, Zap } from 'lucide-react';

const pillars = [
  { icon: Lock, title: 'HTTPS por padrão', desc: 'Certificado SSL automático em toda requisição. Seus dados trafegam criptografados.' },
  { icon: ShieldCheck, title: 'Proteção DDoS', desc: 'Firewall de borda mitiga ataques automaticamente, mantendo o app sempre no ar.' },
  { icon: Globe2, title: 'CDN global', desc: 'Servido a partir do data center mais próximo de você, com baixíssima latência.' },
  { icon: Zap, title: 'Uptime 99,99%', desc: 'Infraestrutura redundante de nível corporativo. O app fica online quando você precisa.' },
];

export function LiveAppSection() {
  return (
    <section className="py-16 px-4 relative overflow-hidden bg-black">
      <div className="container mx-auto max-w-4xl">
        <div className="liquid-glass-strong relative rounded-2xl p-6 md:p-10 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-[120px] pointer-events-none opacity-[0.08]" style={{ background: '#ffffff' }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">
                // infraestrutura · vercel edge network
              </p>
            </div>

            <h2
              className="text-2xl md:text-4xl mb-3 text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Hospedado na Vercel
            </h2>
            <p className="text-sm md:text-base text-white/60 mb-8 max-w-2xl">
              Nosso app roda na mesma infraestrutura usada por OpenAI, GitHub e Notion. Isso garante
              velocidade global, criptografia de ponta e proteção contra ataques — sem você precisar
              se preocupar com nada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              {pillars.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="liquid-glass flex items-start gap-3 rounded-2xl p-4 hover:scale-[1.02] transition-transform">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-white/60 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-wider text-white/40 mt-6">
              vercel edge network · ssl/tls · soc 2 type ii · iso 27001
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
