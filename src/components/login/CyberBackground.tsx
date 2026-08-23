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

      {/* Vertical Data Lines */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent"
          initial={{ left: `${33 * (i + 1)}%`, top: '-100%' }}
          animate={{ top: '100%' }}
          transition={{
            duration: 12 + i * 3,
            repeat: Infinity,
            ease: "linear",
            delay: i * 2
          }}
        />
      ))}
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};
