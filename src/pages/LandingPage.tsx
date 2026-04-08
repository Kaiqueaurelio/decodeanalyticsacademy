import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { BookOpen, CheckCircle, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';

const features = [
  { icon: BookOpen, title: 'Apostilas por Tópicos', desc: 'Conteúdo organizado por assunto, liberado pelo administrador. Localize rapidamente o que precisa revisar.' },
  { icon: CheckCircle, title: 'Exercícios Estilo Prova', desc: 'Múltipla escolha com correção instantânea. Gabarito e explicação apenas após responder.' },
  { icon: BarChart3, title: 'Dashboard de Desempenho', desc: 'Acompanhe acertos, erros e progresso por apostila. Entenda onde precisa melhorar.' },
];

const steps = [
  { n: '01', title: 'Faça login', desc: 'Entre com seu email e senha para acessar os conteúdos da sua turma.' },
  { n: '02', title: 'Estude a apostila', desc: 'Navegue pelos tópicos liberados e revise o material de cada aula.' },
  { n: '03', title: 'Pratique e evolua', desc: 'Responda exercícios, confira seu desempenho e melhore a cada tentativa.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl space-y-6">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Plataforma Acadêmica
            </div>
            <h1 className="animate-fade-up stagger-1 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Suas revisões, <span className="text-gradient">organizadas</span> e prontas para a prova.
            </h1>
            <p className="animate-fade-up stagger-2 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Apostilas por tópicos, exercícios corrigidos em tempo real e dashboard de desempenho — tudo em um só lugar.
            </p>
            <div className="animate-fade-up stagger-3 flex flex-wrap gap-3">
              <Button size="lg" className="gradient-primary text-primary-foreground" onClick={() => navigate('/login')}>
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver recursos
              </Button>
            </div>
            <div className="animate-fade-up stagger-4 flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              {['Apostilas organizadas', 'Exercícios corrigidos', 'Dashboard pessoal'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Recursos</p>
            <h2 className="text-3xl font-bold md:text-4xl">Tudo que você precisa para <span className="text-gradient">revisar com eficiência</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className={`glass rounded-2xl p-8 hover-lift animate-fade-up stagger-${i + 1}`}>
                <div className="mb-5 inline-flex rounded-xl bg-accent p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 md:py-28 bg-accent/30">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Como funciona</p>
            <h2 className="text-3xl font-bold md:text-4xl">Três passos simples</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.n} className={`animate-fade-up stagger-${i + 1} text-center`}>
                <span className="text-5xl font-extrabold text-gradient">{s.n}</span>
                <h3 className="text-xl font-semibold mt-4 mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para revisar?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Entre para acessar suas apostilas, estudar com foco e chegar preparado para a prova.</p>
          <Button size="lg" className="gradient-primary text-primary-foreground" onClick={() => navigate('/login')}>
            Começar agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logoDark} alt="Decode Analytics" className="h-6 w-6 rounded object-cover" />
            <span className="font-semibold text-foreground">Decode Analytics</span>
          </div>
          <p>Criado por Kaique Aurelio</p>
        </div>
      </footer>
    </div>
  );
}
