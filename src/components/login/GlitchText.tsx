import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "", delay = 0 }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  useEffect(() => {
    let frame = 0;
    const finalDelay = delay * 1000;
    
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayText(prev => {
          if (frame >= text.length * 3) {
            clearInterval(interval);
            return text;
          }
          
          const progress = Math.floor(frame / 3);
          let result = text.substring(0, progress);
          
          if (progress < text.length) {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
          
          frame++;
          return result;
        });
      }, 40);
    }, finalDelay);

    return () => {
      clearTimeout(timeout);
    };
  }, [text, delay]);

  return (
    <motion.span 
      className={`inline-block font-mono ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {displayText}
    </motion.span>
  );
};
