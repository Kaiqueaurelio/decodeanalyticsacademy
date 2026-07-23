import { ShieldCheck, Lock, Globe2, Smartphone } from 'lucide-react';

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
          <div
            className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'rgba(0,240,255,0.15)' }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                // plataforma online · acesso via navegador
              </p>
            </div>

            <h2 className="font-display text-2xl md:text-4xl mb-3">
              Acesse de <span className="text-primary">qualquer lugar</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-2xl">
              A Decode Analytics Academy é publicada como aplicação web e pode ser aberta em qualquer
              navegador moderno, no computador ou no celular — inclusive instalada como PWA.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'rgba(5,5,8,0.5)', border: '1px solid rgba(0,240,255,0.15)' }}
              >
                <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Conexão HTTPS</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Todo o tráfego entre o seu dispositivo e a plataforma é criptografado.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'rgba(5,5,8,0.5)', border: '1px solid rgba(168,85,247,0.18)' }}
              >
                <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Login seguro</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Autenticação por RA ou e-mail, com sessão persistente e proteção da sua conta.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'rgba(5,5,8,0.5)', border: '1px solid rgba(0,240,255,0.15)' }}
              >
                <Globe2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Web + PWA</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Abre no navegador e pode ser instalada como app no celular ou desktop.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'rgba(5,5,8,0.5)', border: '1px solid rgba(168,85,247,0.18)' }}
              >
                <Smartphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Suporte offline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recursos essenciais ficam disponíveis mesmo com conexão instável.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mt-6">
              acesso via navegador · https · pwa instalável
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
