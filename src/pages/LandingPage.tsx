import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Target, 
  Brain, 
  Rocket, 
  ChevronRight, 
  CheckCircle2, 
  BarChart3, 
  Smartphone,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24">
      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6 border border-primary/20">
            📚 ENEM 2026 & Ciência da Computação
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-7xl mb-8 leading-[1.1]">
            Transforme seu Estudo em <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">Alta Performance</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400 sm:text-xl mb-10 leading-relaxed">
            A plataforma acadêmica definitiva para alunos de tecnologia e vestibulandos. 
            Apostilas estruturadas, simulados inteligentes e o suporte da Ella para você dominar qualquer disciplina.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg font-bold w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,240,255,0.3)]" onClick={() => navigate('/auth')}>
              Começar Agora
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold w-full sm:w-auto border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={() => {
              const el = document.getElementById('features');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Ver Funcionalidades
            </Button>
          </div>
          
          <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-50">
            <div className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> <span>PWA Mobile</span></div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> <span>100% Seguro</span></div>
            <div className="flex items-center gap-2"><Users className="h-5 w-5" /> <span>+500 Alunos</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 hover:border-primary/50 transition-all hover:bg-zinc-900"
  >
    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
    <p className="text-zinc-400 leading-relaxed">{desc}</p>
  </motion.div>
);

const Features = () => (
  <section id="features" className="py-24 bg-zinc-950/50">
    <div className="container mx-auto px-4">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">Desenvolvido por quem entende de estudo</h2>
        <p className="text-zinc-400">Ferramentas focadas em resultados práticos e memorização de longo prazo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon={BookOpen} 
          title="Apostilas Estruturadas" 
          desc="Conteúdo técnico direto ao ponto, com glossários, resumos e exercícios integrados para Ciência da Computação e ENEM."
          delay={0.1}
        />
        <FeatureCard 
          icon={Brain} 
          title="IA Acadêmica Ella" 
          desc="Sua assistente 24/7. Tire dúvidas sobre código, física, matemática ou peça resumos personalizados em segundos."
          delay={0.2}
        />
        <FeatureCard 
          icon={Target} 
          title="Simulados de Alta Precisão" 
          desc="Banco de questões atualizado com cronômetro, análise de desempenho e gabaritos detalhados para medir seu progresso."
          delay={0.3}
        />
        <FeatureCard 
          icon={Zap} 
          title="Modo Foco" 
          desc="Interface limpa e minimalista projetada para eliminar distrações e aumentar a retenção do conteúdo lido."
          delay={0.4}
        />
        <FeatureCard 
          icon={BarChart3} 
          title="Gestão de Semestres" 
          desc="Organização completa do 1º ao 8º semestre da UNIP. Nunca mais se perca na grade curricular do seu curso."
          delay={0.5}
        />
        <FeatureCard 
          icon={Rocket} 
          title="Ecossistema PWA" 
          desc="Instale em seu celular ou tablet. Estude no ônibus, no intervalo ou em qualquer lugar com suporte offline inteligente."
          delay={0.6}
        />
      </div>
    </div>
  </section>
);

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Quais cursos são suportados?", a: "Focamos em Ciência da Computação, Sistemas de Informação e Engenharia da Computação (UNIP), além de um módulo completo para o ENEM 2026." },
    { q: "Funciona no celular?", a: "Sim! Somos uma PWA (Progressive Web App). Você pode instalar diretamente no seu iPhone ou Android e usar como um aplicativo nativo." },
    { q: "O material é atualizado?", a: "Sim, nossa equipe acadêmica e a IA Ella revisam e atualizam os conteúdos semanalmente conforme as demandas dos cursos e editais." },
    { q: "Preciso pagar para acessar?", a: "O acesso básico e o conteúdo principal são gratuitos para alunos cadastrados. Acreditamos na democratização do ensino de tecnologia." }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">Dúvidas Frequentes</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <span className="font-semibold text-white">{item.q}</span>
                <ChevronRight className={`h-5 w-5 transition-transform ${open === i ? 'rotate-90' : ''}`} />
              </button>
              {open === i && (
                <div className="p-6 pt-0 text-zinc-400 border-t border-zinc-800 bg-zinc-900/50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-300 selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
      </div>

      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-[0_0_15px_rgba(0,240,255,0.4)]">D</div>
             <span className="text-xl font-bold text-white tracking-tighter">DECODE <span className="text-cyan-400">ACADEMY</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hidden sm:flex" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={() => navigate('/auth')}>Cadastrar RA</Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <Hero />
        <Features />
        
        {/* Social Proof Mini Section */}
        <section className="py-20 border-y border-zinc-900 bg-black/40">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-1">+500</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Alunos Ativos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">+1200</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Apostilas Lidas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">98%</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Aprovação IA</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Suporte Ella</div>
              </div>
            </div>
          </div>
        </section>

        <FAQ />

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6">Pronto para elevar seu nível?</h2>
            <p className="text-zinc-400 mb-10 max-w-xl mx-auto text-lg">
              Junte-se a centenas de alunos que já estão acelerando seus estudos com a Decode Academy.
            </p>
            <Button size="lg" className="h-16 px-12 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(0,240,255,0.2)]" onClick={() => navigate('/auth')}>
              Começar Gratuitamente
            </Button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-[#050508] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center font-bold text-[10px] text-primary-foreground">D</div>
                <span className="font-bold text-white tracking-tighter">DECODE ACADEMY</span>
              </div>
              <p className="text-zinc-500 max-w-sm text-sm">
                Desenvolvido por Kaique Aurelio & Decode Analytics. <br />
                Plataforma de alta performance para o ensino de tecnologia.
              </p>
            </div>
            <div className="flex gap-10">
              <div className="flex flex-col gap-3">
                <h4 className="text-white font-semibold text-sm">Legal</h4>
                <a href="/termos" className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors">Termos de Uso</a>
                <a href="/privacidade" className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors">Privacidade</a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-white font-semibold text-sm">Plataforma</h4>
                <a href="/apoie" className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors">Apoie o Projeto</a>
                <a href="/news" className="text-zinc-500 hover:text-cyan-400 text-sm transition-colors">Blog Tech</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-900 text-center text-zinc-600 text-xs">
            © 2026 Decode Analytics Academy. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
