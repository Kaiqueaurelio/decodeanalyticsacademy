import { ShieldCheck, Lock, Globe2, Zap } from 'lucide-react';

export function LiveAppSection() {
  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        <div
          className="relative rounded-2xl p-6 md:p-10 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(168,85,247,0.06))',
            border: '1px solid rgba(0,240,255,0.18)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'rgba(0,240,255,0.15)' }}
          />

          <div className="relative">
            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                // infraestrutura · vercel edge network
              </p>
            </div>

            <h2 className="font-display text-2xl md:text-4xl mb-3">
              Hospedado na <span className="text-primary">Vercel</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-2xl">
              Nosso app roda na mesma infraestrutura usada por OpenAI, GitHub e Notion. Isso garante
              velocidade global, criptografia de ponta e proteção contra ataques — sem você precisar
              se preocupar com nada.
            </p>

            {/* Security pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: 'rgba(5,5,8,0.5)',
                  border: '1px solid rgba(0,240,255,0.15)',
                }}
              >
                <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">HTTPS por padrão</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Certificado SSL automático em toda requisição. Seus dados trafegam criptografados.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: 'rgba(5,5,8,0.5)',
                  border: '1px solid rgba(168,85,247,0.18)',
                }}
              >
                <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Proteção DDoS</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Firewall de borda mitiga ataques automaticamente, mantendo o app sempre no ar.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: 'rgba(5,5,8,0.5)',
                  border: '1px solid rgba(0,240,255,0.15)',
                }}
              >
                <Globe2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">CDN global</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Servido a partir do data center mais próximo de você, com baixíssima latência.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: 'rgba(5,5,8,0.5)',
                  border: '1px solid rgba(168,85,247,0.18)',
                }}
              >
                <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Uptime 99,99%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Infraestrutura redundante de nível corporativo. O app fica online quando você precisa.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mt-6">
              vercel edge network · ssl/tls · soc 2 type ii · iso 27001
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
