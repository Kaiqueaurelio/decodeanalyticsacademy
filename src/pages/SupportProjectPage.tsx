import React, { useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Coffee, Heart, Star, Share2, ArrowLeft, MessageSquare, ShieldCheck, Server, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SupportProjectPage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Injeta o botão customizado do BMC
    const container = document.getElementById('bmc-button-container');
    if (container && !container.hasChildNodes()) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
      script.setAttribute('data-name', 'bmc-button');
      script.setAttribute('data-slug', 'decodeanalyticsacademy');
      script.setAttribute('data-color', '#5F7FFF');
      script.setAttribute('data-emoji', '💻');
      script.setAttribute('data-font', 'Cookie');
      script.setAttribute('data-text', 'Seja Um Apoiador');
      script.setAttribute('data-outline-color', '#000000');
      script.setAttribute('data-font-color', '#ffffff');
      script.setAttribute('data-coffee-color', '#FFDD00');
      container.appendChild(script);
    }
  }, []);

  const benefits = [
    { icon: Server, text: "Mantém os servidores ativos 24/7" },
    { icon: Zap, text: "Desenvolvimento de novas aulas e funções" },
    { icon: ShieldCheck, text: "Garante a segurança e privacidade dos dados" },
    { icon: GraduationCapIcon, text: "Apoia futuros estudantes de tecnologia" }
  ];

  function GraduationCapIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 selection:bg-cyan-500/30">
      <AppHeader />
      
      <main className="container mx-auto max-w-4xl px-4 pt-24 pb-20">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Heart className="h-8 w-8 text-cyan-400 fill-cyan-400/20" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-400 bg-clip-text text-transparent mb-6">
            Ajude a Manter o Ensino Gratuito
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Estamos comprometidos em fornecer educação tecnológica de alta qualidade para todos. 
            Seu apoio voluntário nos ajuda a manter essa missão viva e a desenvolver novas ferramentas para nossa comunidade.
          </p>
        </motion.section>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mission Statement */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Nossa Missão
            </h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              A Decode Analytics Academy foi criada por educadores que acreditam que o aprendizado deve ser acessível a todos. 
              Já ajudamos milhares de alunos sem custo algum, e pretendemos continuar assim.
            </p>
            <ul className="space-y-4">
              {benefits.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-800">
                    <item.icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support CTA */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex flex-col items-center justify-center text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Apoie o Projeto</h2>
            <p className="text-slate-400 mb-8">
              Contribua com qualquer valor para nos ajudar a expandir nossa biblioteca de conteúdos.
            </p>
            
            <div className="flex flex-col items-center gap-6">
              {/* Botão Oficial BMC */}
              <div 
                id="bmc-button-container"
                className="hover:scale-105 transition-transform duration-300"
              />

              <div className="flex items-center gap-2 text-slate-500">
                <span className="h-px w-8 bg-slate-800"></span>
                <span className="text-[10px] uppercase tracking-tighter">Ou use o link direto</span>
                <span className="h-px w-8 bg-slate-800"></span>
              </div>

              <a 
                href="https://www.buymeacoffee.com/decodeanalyticsacademy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#5F7FFF] text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(95,127,255,0.3)]"
              >
                <Coffee className="h-6 w-6 transition-transform group-hover:rotate-12" />
                <span>Seja Um Apoiador</span>
              </a>
            </div>
            
            <p className="mt-6 text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Pagamento Seguro via Buy Me a Coffee
            </p>
          </motion.div>
        </div>

        {/* Alternative Support */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid sm:grid-cols-3 gap-6"
        >
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center">
            <Share2 className="h-6 w-6 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-2">Compartilhe</h3>
            <p className="text-xs text-slate-500">Espalhe o conhecimento com seus amigos e colegas.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center">
            <MessageSquare className="h-6 w-6 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-2">Feedback</h3>
            <p className="text-xs text-slate-500">Diga-nos o que podemos melhorar na plataforma.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center cursor-pointer hover:bg-slate-900/50 transition-colors" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-6 w-6 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-2">Voltar a Estudar</h3>
            <p className="text-xs text-slate-500">O foco principal é sempre o seu aprendizado.</p>
          </div>
        </motion.section>

        <footer className="mt-20 text-center">
          <p className="text-xs text-slate-600">
            Decode Analytics Academy © 2026 • Plataforma Educacional Independente
          </p>
        </footer>
      </main>
    </div>
  );
}