import { GraduationCap, Code2, Heart, Users } from 'lucide-react';
import kaiqueAvatar from '@/assets/kaique-creator.jpeg';

/**
 * "De aluno para aluno" — Card destacando que a plataforma foi feita
 * pelo Kaique Aurélio, aluno de CC, para ajudar colegas de curso.
 */
export function CreatorSection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-lines-bg opacity-20 pointer-events-none" />
      <div className="container mx-auto max-w-4xl relative">
        <div className="text-center mb-10">
          <p className="text-xs font-mono-label uppercase tracking-[0.2em] text-primary mb-3">
            // Sobre o criador
          </p>
          <h2 className="font-display text-3xl md:text-5xl mb-3">
            Feito por <span className="text-primary">aluno</span>, para alunos
          </h2>
        </div>

        <div
          className="rounded-2xl p-6 md:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(168,85,247,0.06))',
            border: '1px solid rgba(0,240,255,0.18)',
          }}
        >
          {/* Glow de fundo */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #00f0ff 0%, transparent 70%)' }}
          />

          <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
            {/* Avatar grande com inicial */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div
                className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden p-[2px]"
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
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider"
                style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.3)' }}>
                <GraduationCap className="h-3 w-3" />
                Aluno · Criador
              </div>
            </div>

            <div className="text-center md:text-left">
              <h3 className="font-display text-2xl md:text-3xl mb-1">Kaique Aurélio</h3>
              <p className="text-xs md:text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
                Ciência da Computação · UNIP
              </p>

              <p className="text-sm md:text-base text-foreground/85 leading-relaxed mb-5">
                "Sou aluno de CC, igual vocês. Cansei de perder tempo procurando apostila boa,
                exercício resolvido e resumo decente espalhado em PDF. Então decidi construir
                <span className="text-primary font-semibold"> a plataforma que eu queria ter</span> — e abrir pra
                galera do curso usar comigo."
              </p>

              {/* Pilares */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {[
                  { icon: Code2, label: 'Construído na faculdade' },
                  { icon: Users, label: 'Aberto pra turma' },
                  { icon: Heart, label: 'Sem fins lucrativos' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="p-2.5 md:p-3 rounded-lg text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1.5 text-primary" />
                    <p className="text-[10px] md:text-xs font-medium leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
