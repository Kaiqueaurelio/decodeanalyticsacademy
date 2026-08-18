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
          <div className="w-20 h-20 border border-cyan-500/30 rounded-full flex items-center justify-center bg-cyan-500/5">
             <div className="w-12 h-12 bg-cyan-500 rounded-full shadow-[0_0_20px_#00f0ff]" />
          </div>
          <h2 className="text-5xl font-bold text-white tracking-tight">
            DECODE <br /> <span className="text-cyan-400">ANALYTICS</span>
          </h2>
          <p className="text-gray-400 max-w-md text-lg">
            Sua jornada de alta performance em tecnologia começa aqui. 
            Ambiente acadêmico de elite integrado com IA avançada.
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
