import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { BookOpen, CheckCircle, BarChart3, ArrowRight, Download } from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';

const features = [
  { icon: BookOpen, title: 'Apostilas por Tópicos', desc: 'Conteúdo organizado por assunto, liberado pelo administrador. Localize rapidamente o que precisa revisar.' },
  { icon: CheckCircle, title: 'Exercícios Estilo Prova', desc: 'Múltipla escolha com correção instantânea. Veja o gabarito e explicação somente depois de responder.' },
  { icon: BarChart3, title: 'Dashboard de Desempenho', desc: 'Acompanhe acertos, erros e progresso por apostila. Entenda onde precisa melhorar.' },
];

const steps = [
  { n: '01', title: 'Faça login', desc: 'Entre com seu email e senha para acessar os conteúdos da sua turma.' },
  { n: '02', title: 'Estude a apostila', desc: 'Navegue pelos tópicos liberados e revise o material de cada aula.' },
  { n: '03', title: 'Pratique e evolua', desc: 'Responda exercícios, confira seu desempenho e melhore a cada tentativa.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleInstallPWA = () => {
    const deferredPrompt = (window as any).__pwaInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative py-20 md:py-28 lg:py-36 px-4">
          <div className="max-w-xl space-y-5 animate-content-show">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Suas revisões, <span className="text-gradient">organizadas</span> e prontas para a prova.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              Apostilas por tópicos, exercícios corrigidos em tempo real e dashboard de desempenho — tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button size="lg" className="gradient-primary text-primary-foreground" onClick={() => navigate('/login')}>
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver recursos
              </Button>
            </div>
            <button
              onClick={handleInstallPWA}
              className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-4"
            >
              <Download className="h-4 w-4" /> Instalar no celular
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Recursos</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Tudo que você precisa para revisar</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`glass rounded-2xl p-6 hover-lift animate-content-show delay-${i + 1}`}
              >
                <div className="mb-4 inline-flex rounded-xl bg-accent p-2.5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Como funciona</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Três passos simples</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.n} className={`text-center animate-content-show delay-${i + 1}`}>
                <span className="text-4xl font-extrabold text-gradient">{s.n}</span>
                <h3 className="text-lg font-semibold mt-3 mb-1.5">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container text-center px-4">
          <h2 className="text-2xl font-bold mb-3 sm:text-3xl">Pronto para revisar?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Entre para acessar suas apostilas, estudar com foco e chegar preparado para a prova.
          </p>
          <Button size="lg" className="gradient-primary text-primary-foreground" onClick={() => navigate('/login')}>
            Começar agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center gap-2 text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <img src={logoDark} alt="Decode Analytics" className="h-5 w-5 rounded object-cover" />
            <span className="font-semibold text-foreground text-xs">Decode Analytics</span>
          </div>
          <p className="text-xs">Desenvolvido por Kaique Aurelio · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
