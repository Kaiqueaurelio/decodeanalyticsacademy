import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Coffee, Heart, Star, Share2, ArrowLeft, MessageSquare, ShieldCheck, Server, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BuyMeCoffeeButton from '@/components/BuyMeCoffeeButton';

export default function SupportProjectPage() {
  const navigate = useNavigate();

  const benefits = [
    { icon: Server, text: "Mantém os servidores ativos 24/7" },
    { icon: Zap, text: "Desenvolvimento de novas aulas e funções" },
    { icon: ShieldCheck, text: "Garante a segurança e privacidade dos dados" },
    { icon: Star, text: "Apoia futuros estudantes de tecnologia" }
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 selection:bg-cyan-500/30">
      <AppHeader />
      
      <main className="container mx-auto max-w-4xl px-4 pt-24 pb-20">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Heart className="h-8 w-8 text-cyan-400 fill-cyan-400/20" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-400 bg-clip-text text-transparent mb-6">
            Apoie Nossa Missão
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Sua contribuição nos ajuda a manter este projeto vivo e melhorando constantemente. 
            O aplicativo é e sempre será gratuito para todos os alunos.
          </p>
        </motion.section>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Por Que Apoiar?
            </h2>
            <div className="space-y-6">
              <div className="reason group">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  🚀 Novos Recursos
                </h3>
                <p className="text-xs text-slate-400">Seu apoio financia novas funcionalidades e cursos.</p>
              </div>
              <div className="reason group">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  🔧 Manutenção
                </h3>
                <p className="text-xs text-slate-400">Mantém nossos servidores rodando 24/7.</p>
              </div>
              <div className="reason group">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  📚 Conteúdo
                </h3>
                <p className="text-xs text-slate-400">Ajuda a criar mais aulas e materiais de qualidade.</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800">
              <ul className="space-y-3">
                {benefits.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-slate-300">
                    <item.icon className="h-3.5 w-3.5 text-cyan-400" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex flex-col items-center justify-center text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4 font-display">Comece Agora</h2>
            <p className="text-slate-400 mb-8 text-sm">
              Escolha uma das formas abaixo para apoiar o projeto no Buy Me a Coffee.
            </p>
            
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="hover:scale-105 transition-transform duration-300 flex justify-center">
                <BuyMeCoffeeButton variant="accent" size="large" showText={false} />
              </div>

              <div className="flex items-center gap-2 text-slate-500 w-full">
                <span className="h-px flex-1 bg-slate-800"></span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Ou Link Direto</span>
                <span className="h-px flex-1 bg-slate-800"></span>
              </div>

              <a 
                href="https://www.buymeacoffee.com/decodeanalyticsacademy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative flex w-full items-center justify-center gap-3 px-6 py-4 bg-[#5F7FFF] text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(95,127,255,0.3)]"
              >
                <Coffee className="h-5 w-5 transition-transform group-hover:rotate-12" />
                <span>Compre-me um Café</span>
              </a>
            </div>
            
            <p className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Pagamento Seguro via Buy Me a Coffee
            </p>
          </motion.div>
        </div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 mb-16 text-center"
        >
          <h3 className="text-xl font-bold text-white mb-6">Seu Impacto</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-cyan-400">1,247</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Alunos</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-800">
              <span className="text-2xl font-black text-purple-400">48</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Disciplinas</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-yellow-400">100%</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Gratuito</span>
            </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid sm:grid-cols-3 gap-6"
        >
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center">
            <Share2 className="h-5 w-5 text-slate-400 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Compartilhe</h3>
            <p className="text-[10px] text-slate-500">Ajude o conhecimento a chegar em mais pessoas.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center">
            <MessageSquare className="h-5 w-5 text-slate-400 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Feedback</h3>
            <p className="text-[10px] text-slate-500">Sua opinião é fundamental para nossa evolução.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center cursor-pointer hover:bg-slate-900/50 transition-colors" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5 text-slate-400 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Voltar</h3>
            <p className="text-[10px] text-slate-500">O foco principal é o seu aprendizado.</p>
          </div>
        </motion.section>

        <footer className="mt-20 text-center opacity-40">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
            Decode Analytics Academy © 2026 • Kaique Aurelio
          </p>
        </footer>
      </main>
    </div>
  );
}
