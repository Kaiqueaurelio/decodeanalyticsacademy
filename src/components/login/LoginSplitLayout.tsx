import React from 'react';
import { CyberBackground } from './CyberBackground';
import { motion } from 'framer-motion';

interface LoginSplitLayoutProps {
  children: React.ReactNode;
}

export const LoginSplitLayout: React.FC<LoginSplitLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen flex items-stretch overflow-hidden bg-[#050508]">
      <CyberBackground />
      
      {/* Left side: Visuals / Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="w-20 h-20 border border-cyan-500/30 rounded-full flex items-center justify-center bg-cyan-500/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors" />
             <div className="w-12 h-12 bg-cyan-500 rounded-full shadow-[0_0_20px_#00f0ff] relative z-10" />
             <div className="absolute inset-0 border border-cyan-500/50 rounded-full animate-ping opacity-20" />
          </div>
          <h2 className="text-5xl font-bold text-white tracking-tighter leading-tight uppercase font-mono">
            DECODE <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              ANALYTICS
            </span>
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-cyan-500 to-transparent" />
          <p className="text-gray-400 max-w-md text-lg font-mono leading-relaxed opacity-80">
            [SYSTEM_STATUS: ACTIVE]
            <br />
            Ambiente acadêmico de elite integrado com protocolos de IA avançada. Acesso restrito a pessoal autorizado.
          </p>
        </motion.div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
