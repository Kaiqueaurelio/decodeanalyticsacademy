import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppHeader } from '@/components/AppHeader';
import {
  BookOpen, CheckCircle, BarChart3, ArrowRight, Download, Shield,
  Headphones, Video, FileText, Users, Zap, Clock, Award, Star,
  GraduationCap, TrendingUp, Lock,
  Smartphone, BrainCircuit, ChevronDown, Play,
  Layers, Target, MessageCircle, HelpCircle
} from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';

const features = [
  { icon: BookOpen, title: 'Apostilas Estruturadas', desc: 'Conteúdo organizado automaticamente como apostila editorial profissional, pronto para estudo.' },
  { icon: CheckCircle, title: 'Exercícios com Correção', desc: 'Questões de múltipla escolha com correção instantânea, explicações detalhadas e acompanhamento.' },
  { icon: BarChart3, title: 'Dashboard Analítico', desc: 'Gráficos interativos de evolução, acertos por matéria, streaks de estudo e ranking.' },
  { icon: Headphones, title: 'Áudios e Podcasts', desc: 'Player integrado para ouvir materiais de apoio em qualquer lugar.' },
  { icon: Video, title: 'Videoaulas HD', desc: 'Assista vídeos com player integrado e reprodução otimizada para mobile.' },
  { icon: FileText, title: 'Materiais Multimídia', desc: 'PDFs, PowerPoints, imagens, GIFs — tudo acessível diretamente na plataforma.' },
];

const benefits = [
  { icon: Zap, title: 'Estude com Foco', desc: 'Todo conteúdo organizado por matéria e semestre. Zero distrações.' },
  { icon: Clock, title: 'Economize Tempo', desc: 'Encontre exatamente o que precisa em segundos com busca global.' },
  { icon: Shield, title: 'Conteúdo Protegido', desc: 'Marca d\'água personalizada com nome, IP e horário.' },
  { icon: Award, title: 'Preparação para Provas', desc: 'Exercícios no formato das provas reais. Simule condições de prova.' },
  { icon: Target, title: 'Gamificação', desc: 'Ganhe XP, suba de nível, conquiste badges e mantenha seu streak.' },
  { icon: BrainCircuit, title: 'IA Integrada', desc: 'Importação automática de conteúdo com formatação inteligente.' },
];

const stats = [
  { value: '3+', label: 'Cursos Compatíveis' },
  { value: '48+', label: 'Disciplinas' },
  { value: '100%', label: 'Online' },
  { value: '24/7', label: 'Disponível' },
];

const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastre-se com email e senha em menos de 30 segundos.' },
  { n: '02', title: 'Explore o conteúdo', desc: 'Navegue por apostilas, vídeos, áudios e materiais organizados.' },
  { n: '03', title: 'Pratique e evolua', desc: 'Faça exercícios e acompanhe seu progresso no dashboard.' },
];

const testimonials = [
  { name: 'Ana Silva', course: '3º Sem · SI', text: 'A plataforma me ajudou muito nas revisões. Os exercícios são muito parecidos com os da prova! Uso todos os dias.', rating: 5, initials: 'AS', color: 'hsl(142 71% 45%)' },
  { name: 'Carlos Santos', course: '5º Sem · EC', text: 'Ter tudo organizado num só lugar faz toda a diferença. Recomendo para todos da turma. O dashboard é incrível.', rating: 5, initials: 'CS', color: 'hsl(217 91% 60%)' },
  { name: 'Juliana Costa', course: '2º Sem · CC', text: 'Os áudios são excelentes para revisar no ônibus. A gamificação me motiva todo dia a estudar mais.', rating: 5, initials: 'JC', color: 'hsl(68 100% 64%)' },
  { name: 'Rafael Oliveira', course: '4º Sem · CC', text: 'Passei em todas as provas de Estrutura de Dados graças aos exercícios da plataforma. Nota máxima!', rating: 5, initials: 'RO', color: 'hsl(280 67% 60%)' },
  { name: 'Mariana Ferreira', course: '6º Sem · SI', text: 'Estudo pelo celular no trabalho e é perfeito. O app funciona como nativo e o conteúdo é muito bem organizado.', rating: 5, initials: 'MF', color: 'hsl(24 94% 60%)' },
];

const faqs = [
  { q: 'A plataforma é gratuita?', a: 'O acesso é exclusivo para alunos cadastrados. Entre em contato para saber como participar.' },
  { q: 'Posso acessar pelo celular?', a: 'Sim! A plataforma é um PWA que funciona como app nativo. Instale no seu celular.' },
  { q: 'O conteúdo é atualizado?', a: 'Sim, o conteúdo é atualizado regularmente com novos materiais e exercícios.' },
  { q: 'Como funciona a proteção?', a: 'Marca d\'água personalizada + bloqueio de PrintScreen e clique direito.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleInstallPWA = async () => {
    try {
      const deferredPrompt = (window as any).__pwaInstallPrompt;
      if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') (window as any).__pwaInstallPrompt = null;
        return;
      }
    } catch (e) { console.warn('PWA prompt failed:', e); }
    setShowInstallGuide(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppHeader />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[85vh] flex items-center grid-lines-bg">
        {/* Subtle glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="container relative py-20 md:py-28 lg:py-36 px-4">
          <div className="max-w-3xl space-y-6">
            <div className="animate-fade-up" style={{ animationDelay: '0s' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary text-[11px] font-mono-label uppercase tracking-widest text-muted-foreground mb-4" style={{ border: '1px solid hsl(0 0% 100% / 0.08)' }}>
                <GraduationCap className="h-3 w-3 text-primary" />
                Decode Analytics Academy
              </div>
            </div>

            <h1 className="animate-fade-up font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight" style={{ animationDelay: '0.1s', opacity: 0 }}>
              Sua apostila.{' '}
              <span className="text-gradient">Organizada.</span>
              <br />
              Automaticamente.
            </h1>

            <p className="animate-fade-up text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl" style={{ animationDelay: '0.2s', opacity: 0 }}>
              Apostilas estruturadas, exercícios inteligentes, gamificação e tudo que você precisa para dominar suas provas — tudo organizado em um só lugar.
            </p>

            <div className="animate-fade-up flex flex-col sm:flex-row gap-3 pt-2" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <Button size="lg" onClick={() => navigate('/login')}>
                Entrar como estudante <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Acessar como Admin
              </Button>
            </div>

            <div className="animate-fade-up flex items-center gap-6 pt-2" style={{ animationDelay: '0.4s', opacity: 0 }}>
              <button type="button" onClick={handleInstallPWA}
                className="inline-flex items-center gap-2 text-sm text-primary font-mono-label text-[11px] uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer">
                <Download className="h-3.5 w-3.5" /> Instalar App
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)', borderBottom: '1px solid hsl(0 0% 100% / 0.06)' }}>
        <div className="container px-4 py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-display text-primary">{s.value}</p>
                <p className="text-xs font-mono-label uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="recursos" className="py-20 md:py-28">
        <div className="container px-4">
          <div className="text-center mb-14">
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary">
              <Layers className="h-3 w-3 inline mr-1.5" />Recursos
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mt-3">
              Tudo que você precisa para <span className="text-gradient">revisar</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Uma plataforma completa com ferramentas pensadas para maximizar seu desempenho acadêmico.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="rounded-lg p-6 editorial-border-hover group" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="mb-4 inline-flex rounded bg-primary/10 p-3 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS ═══ */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/3 rounded-full blur-[100px]" />
        <div className="container relative px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div className="md:sticky md:top-24">
              <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary">
                <Target className="h-3 w-3 inline mr-1.5" />Vantagens
              </span>
              <h2 className="font-display text-3xl sm:text-4xl mt-3 mb-4">
                Por que estudar com a <span className="text-gradient-animated">Decode Analytics</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Criada por alunos de Ciência da Computação que sabem exatamente o que você precisa.
              </p>
              <div className="hidden md:flex gap-3">
                <Button onClick={() => navigate('/login')}>
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={b.title} className="flex gap-4 p-4 rounded-lg editorial-border-hover group" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="shrink-0 mt-0.5">
                    <div className="rounded bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
                      <b.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{b.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-20 md:py-28 grid-lines-bg">
        <div className="container px-4">
          <div className="text-center mb-14">
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary">
              <Play className="h-3 w-3 inline mr-1.5" />Como funciona
            </span>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">Três passos <span className="text-gradient">simples</span></h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto relative">
            <div className="hidden sm:block absolute top-[4.5rem] left-[15%] right-[15%] h-px" style={{ background: 'linear-gradient(to right, hsl(0 0% 100% / 0.04), hsl(0 0% 100% / 0.12), hsl(0 0% 100% / 0.04))' }} />
            {steps.map((s) => (
              <div key={s.n} className="text-center group relative">
                <div className="mx-auto mb-4 w-20 h-20 rounded-lg editorial-border flex items-center justify-center relative z-10 bg-card group-hover:border-primary/30 transition-colors">
                  <span className="font-display text-3xl text-primary">{s.n}</span>
                </div>
                <h3 className="text-sm font-semibold mt-2 mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="text-center mb-14">
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary">
              <MessageCircle className="h-3 w-3 inline mr-1.5" />Depoimentos
            </span>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">O que nossos alunos <span className="text-gradient">dizem</span></h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-lg p-6 editorial-border-hover flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">"{t.text}"</p>
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)' }}>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-[11px] font-mono-label text-muted-foreground">{t.course}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="text-center mb-14">
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary">
              <HelpCircle className="h-3 w-3 inline mr-1.5" />FAQ
            </span>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">Perguntas <span className="text-gradient">frequentes</span></h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg editorial-border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}>
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECURITY ═══ */}
      <section className="py-20 md:py-28" style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)' }}>
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-lg editorial-border flex items-center justify-center bg-card">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl mb-4">Conteúdo <span className="text-gradient">Protegido</span></h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Marca d'água personalizada, bloqueio de PrintScreen e clique direito.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Marca d\'água dinâmica', 'Anti-PrintScreen', 'Anti-clique direito', 'Log de acessos'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-[11px] font-mono-label uppercase tracking-wider text-primary" style={{ border: '1px solid hsl(68 100% 64% / 0.2)' }}>
                  <Shield className="h-3 w-3" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="max-w-xl mx-auto text-center rounded-lg p-8 md:p-12 editorial-border bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-accent/[0.02]" />
            <div className="relative">
              <h2 className="font-display text-3xl mb-3">Pronto para <span className="text-gradient-animated">revisar</span>?</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Acesse suas apostilas, estude com foco e chegue preparado para a prova.
              </p>
              <Button size="lg" onClick={() => navigate('/login')}>
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)' }} className="py-10">
        <div className="container flex flex-col items-center gap-4 text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2.5">
            <img src={logoDark} alt="Decode Analytics" className="h-6 w-6 rounded object-cover" />
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-foreground">Decode Analytics</span>
          </div>
          <p className="text-[11px] font-mono-label text-center uppercase tracking-wider">
            © {new Date().getFullYear()} Decode Analytics Academy · Desenvolvido por Kaique Aurélio
          </p>
        </div>
      </footer>

      {/* Install Guide Modal */}
      <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-5 h-5 text-primary" />
              Instalar o App
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para instalar, abra o site publicado no navegador do seu celular:
            </p>
            <div className="p-3 rounded-lg bg-primary/10" style={{ border: '1px solid hsl(68 100% 64% / 0.2)' }}>
              <p className="text-[11px] font-mono-label text-primary mb-1 uppercase tracking-wider">Link:</p>
              <a href="https://decodeanalyticsacademy.lovable.app" target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-primary underline break-all">
                decodeanalyticsacademy.lovable.app
              </a>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="font-semibold text-foreground mb-1">iPhone / iPad (Safari)</p>
                <p>1. Abra no <strong>Safari</strong> → 2. <strong>Compartilhar ↑</strong> → 3. <strong>Adicionar à Tela</strong></p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <p className="font-semibold text-foreground mb-1">Android (Chrome)</p>
                <p>1. Abra no <strong>Chrome</strong> → 2. <strong>Menu ⋮</strong> → 3. <strong>Instalar app</strong></p>
              </div>
            </div>
            <Button onClick={() => setShowInstallGuide(false)} className="w-full">Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
