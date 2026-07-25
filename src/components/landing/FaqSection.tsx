import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'A plataforma é gratuita?',
    a: 'Sim. A Decode Analytics Academy é um projeto sem fins lucrativos, feito por aluno para colegas de curso. Não há plano pago, cobrança escondida ou período de teste.',
  },
  {
    q: 'Preciso ser aluno da UNIP para usar?',
    a: 'O foco inicial é a turma de Ciência da Computação da UNIP, mas o conteúdo básico e o módulo ENEM estão abertos a qualquer estudante que queira estudar de forma mais organizada.',
  },
  {
    q: 'Como funciona o módulo ENEM?',
    a: 'Existe um perfil dedicado só a apostilas, exercícios e simulados do ENEM. A tutora virtual Ella também adapta o tom quando detecta que você está nesse modo.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Toda comunicação é via HTTPS, autenticação com sessão segura, chaves e segredos ficam apenas no servidor e políticas de acesso por linha (RLS) protegem cada tabela do banco.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Funciona em qualquer navegador moderno e pode ser instalada como PWA no celular ou desktop. Recursos essenciais continuam disponíveis com conexão instável.',
  },
  {
    q: 'Quem mantém e evolui a plataforma?',
    a: 'Eu, Kaique Aurélio, aluno do 5º semestre de CC. Cada apostila, exercício e ajuste vem de necessidade real minha e dos meus colegas — se algo pode melhorar, é só me chamar.',
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 relative overflow-hidden">
      <div
        className="absolute -bottom-24 left-0 h-[360px] w-[360px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00f0ff, transparent 60%)' }}
      />
      <div className="container mx-auto max-w-3xl relative">
        <div className="text-center mb-10">
          <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
            // perguntas frequentes
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
            Ainda com <span className="text-primary">dúvida</span>?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            As perguntas que mais aparecem quando eu apresento a plataforma para colegas.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(5,5,8,0.6)',
                  border: `1px solid ${isOpen ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'border-color 200ms ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 p-4 sm:p-5 text-left"
                >
                  <HelpCircle
                    className={`h-5 w-5 shrink-0 ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 text-sm sm:text-base font-semibold text-foreground">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className="grid transition-all duration-300"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 sm:px-5 pb-4 sm:pb-5 pl-12 sm:pl-14 text-sm text-muted-foreground leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
