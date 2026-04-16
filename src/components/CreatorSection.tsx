import { GraduationCap, Code2, Heart, Users, Quote, MessageCircle, Mail } from 'lucide-react';
import kaiqueAvatar from '@/assets/kaique-creator.jpeg';

const WHATSAPP_NUMBER = '5511939222885';
const WHATSAPP_MSG = encodeURIComponent('Olá Kaique! Vim pela Decode Analytics Academy 👋');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const EMAIL_URL = 'mailto:decodeanalytics@outlook.com.br?subject=Contato%20Decode%20Analytics%20Academy';

/**
 * "De aluno para aluno" — Card destacando que a plataforma foi feita
 * pelo Kaique Aurélio, aluno de CC, para ajudar colegas de curso.
 */
export function CreatorSection() {
  return (
    <section className="py-14 sm:py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-lines-bg opacity-20 pointer-events-none" />
      <div className="container mx-auto max-w-3xl relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-[10px] sm:text-xs font-mono-label uppercase tracking-[0.2em] text-primary mb-3">
            // Sobre o criador
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl leading-tight">
            Feito por <span className="text-primary">aluno</span>,
            <br className="sm:hidden" /> para alunos
          </h2>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-5 sm:p-8 md:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(168,85,247,0.06))',
            border: '1px solid rgba(0,240,255,0.18)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00f0ff 0%, transparent 70%)' }}
          />

          <div className="relative flex flex-col items-center text-center md:grid md:grid-cols-[auto_1fr] md:items-start md:text-left md:gap-8 gap-5">
            {/* Avatar + badge */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div
                className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full overflow-hidden p-[2px]"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
                  boxShadow: '0 0 40px rgba(0,240,255,0.4)',
                }}
              >
                <img
                  src={kaiqueAvatar}
                  alt="Kaique Aurélio - Criador da Decode Analytics"
                  className="h-full w-full rounded-full object-cover"
                  style={{ background: '#050508' }}
                />
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
                style={{
                  background: 'rgba(0,240,255,0.1)',
                  color: '#00f0ff',
                  border: '1px solid rgba(0,240,255,0.3)',
                }}
              >
                <GraduationCap className="h-3 w-3" />
                Aluno · Criador
              </div>
            </div>

            {/* Info */}
            <div className="w-full min-w-0">
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl mb-1 leading-tight">
                Kaique Aurélio
              </h3>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4 sm:mb-5">
                Ciência da Computação · UNIP
              </p>

              {/* Quote */}
              <div
                className="relative rounded-xl p-4 sm:p-5 mb-5 text-left"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Quote
                  className="absolute -top-2 -left-2 h-5 w-5 text-primary/60"
                  strokeWidth={2.5}
                />
                <p className="text-[13px] sm:text-sm md:text-base text-foreground/90 leading-relaxed">
                  Sou aluno de CC, igual vocês. Cansei de perder tempo procurando
                  apostila boa, exercício resolvido e resumo decente espalhado em
                  PDF. Então decidi construir{' '}
                  <span className="text-primary font-semibold">
                    a plataforma que eu queria ter
                  </span>{' '}
                  — e abrir pra galera do curso usar comigo.
                </p>
              </div>

              {/* Pilares */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                {[
                  { icon: Code2, label: 'Construído na faculdade' },
                  { icon: Users, label: 'Aberto pra turma' },
                  { icon: Heart, label: 'Sem fins lucrativos' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="p-2 sm:p-3 rounded-lg flex flex-col items-center justify-center text-center min-h-[72px] sm:min-h-[84px]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1.5 text-primary shrink-0" />
                    <p className="text-[10px] sm:text-xs font-medium leading-tight text-balance">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Falar com o criador */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    boxShadow: '0 4px 20px rgba(37,211,102,0.35)',
                  }}
                  aria-label="Falar com o criador no WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
                <a
                  href={EMAIL_URL}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  aria-label="Enviar e-mail para o criador"
                >
                  <Mail className="h-4 w-4" />
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
