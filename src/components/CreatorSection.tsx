import { GraduationCap, Code2, Heart, Users, Quote, MessageCircle, Mail } from 'lucide-react';
import kaiqueAvatar from '@/assets/kaique-creator.jpeg';

const WHATSAPP_NUMBER = '5511939222885';
const WHATSAPP_MSG = encodeURIComponent('Olá Kaique! Vim pela Decode Analytics Academy 👋');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const EMAIL_URL = 'mailto:decodeanalytics@outlook.com.br?subject=Contato%20Decode%20Analytics%20Academy';

export function CreatorSection() {
  return (
    <section className="py-14 sm:py-20 px-4 relative overflow-hidden bg-black">
      <div className="container mx-auto max-w-3xl relative">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
            // Sobre o criador
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-5xl leading-tight text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Feito por aluno,
            <br className="sm:hidden" /> para alunos
          </h2>
        </div>

        <div className="liquid-glass-strong rounded-2xl p-5 sm:p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ background: '#ffffff' }} />

          <div className="relative flex flex-col items-center text-center md:grid md:grid-cols-[auto_1fr] md:items-start md:text-left md:gap-8 gap-5">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="liquid-glass h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full overflow-hidden p-[2px]">
                <img
                  src={kaiqueAvatar}
                  alt="Kaique Aurélio - Criador da Decode Analytics"
                  className="h-full w-full rounded-full object-cover"
                  style={{ background: '#050508' }}
                />
              </div>
              <div className="liquid-glass inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap text-white/80">
                <GraduationCap className="h-3 w-3" strokeWidth={1.5} />
                Aluno · Criador
              </div>
            </div>

            <div className="w-full min-w-0">
              <h3
                className="text-xl sm:text-2xl md:text-3xl mb-1 leading-tight text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Kaique Aurélio
              </h3>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/60 mb-4 sm:mb-5">
                Ciência da Computação · UNIP
              </p>

              <div className="liquid-glass relative rounded-2xl p-4 sm:p-5 mb-5 text-left">
                <Quote className="absolute -top-2 -left-2 h-5 w-5 text-white/60" strokeWidth={1.5} />
                <p className="text-[13px] sm:text-sm md:text-base text-white/90 leading-relaxed">
                  Sou aluno de CC, igual vocês. Cansei de perder tempo procurando
                  apostila boa, exercício resolvido e resumo decente espalhado em
                  PDF. Então decidi construir{' '}
                  <span className="text-white font-semibold">
                    a plataforma que eu queria ter
                  </span>{' '}
                  — e abrir pra galera do curso usar comigo.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                {[
                  { icon: Code2, label: 'Construído na faculdade' },
                  { icon: Users, label: 'Aberto pra turma' },
                  { icon: Heart, label: 'Sem fins lucrativos' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="liquid-glass p-2 sm:p-3 rounded-2xl flex flex-col items-center justify-center text-center min-h-[72px] sm:min-h-[84px] hover:scale-[1.03] transition-transform"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1.5 text-white shrink-0" strokeWidth={1.5} />
                    <p className="text-[10px] sm:text-xs font-medium leading-tight text-balance text-white/80">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-glass-strong flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  aria-label="Falar com o criador no WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  Falar no WhatsApp
                </a>
                <a
                  href={EMAIL_URL}
                  className="liquid-glass flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  aria-label="Enviar e-mail para o criador"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.5} />
                  Enviar e-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
