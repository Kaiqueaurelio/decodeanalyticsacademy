import { GraduationCap, MessageCircle, Mail, Quote } from 'lucide-react';
import kaiqueAvatar from '@/assets/kaique-creator.jpeg';

const WHATSAPP_NUMBER = '5511939222885';
const WHATSAPP_MSG = encodeURIComponent('Olá Kaique! Vim pela Decode Analytics Academy.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const EMAIL_URL = 'mailto:decodeanalytics@outlook.com.br?subject=Contato%20Decode%20Analytics%20Academy';

export function CreatorSection() {
  return (
    <section id="criador" className="relative overflow-hidden px-4 py-16 sm:py-24">
      <div className="grid-lines-bg pointer-events-none absolute inset-0 opacity-10" />

      <div className="container relative mx-auto max-w-3xl">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-xs">
            // quem mantém a plataforma
          </p>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">
            Feito por <span className="text-primary">aluno</span>, para alunos
          </h2>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
              <img
                src={kaiqueAvatar}
                alt="Kaique Aurélio, criador da Decode Analytics Academy"
                className="h-24 w-24 rounded-full bg-background object-cover sm:h-28 sm:w-28"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl leading-tight sm:text-3xl">Kaique Aurélio</h3>
              <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.75} />
                Ciência da Computação · fundou a Decode Analytics em 2018
              </p>

              <div className="relative mt-5 rounded-xl border border-border/50 bg-background/40 p-4 sm:p-5">
                <Quote className="absolute -left-2 -top-2 h-5 w-5 text-primary/60" strokeWidth={2.5} />
                <p className="text-left text-sm leading-relaxed text-foreground/90 sm:text-base">
                  Cansei de perder tempo procurando apostila boa e exercício resolvido espalhado em PDF.
                  Construí <span className="font-semibold text-primary">a plataforma que eu queria ter</span> —
                  e abri pra turma usar comigo.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                  aria-label="Falar com o criador no WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  Falar no WhatsApp
                </a>
                <a
                  href={EMAIL_URL}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                  aria-label="Enviar e-mail para o criador"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
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
