import React from 'react';
import { motion } from 'framer-motion';

export const CyberBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050508]">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Moving Lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
          initial={{ top: `${20 * i}%`, left: '-100%' }}
          animate={{ left: '100%' }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "linear",
            delay: i * 1.5
          }}
        />
      ))}

      {/* Floating Orbs */}
      <motion.div 
        className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px]"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};
