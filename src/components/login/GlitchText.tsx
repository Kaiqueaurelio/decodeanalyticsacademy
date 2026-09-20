import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  delay?: number;
  intervalSpeed?: number;
  glitchOnlyOnHover?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  className = "", 
  delay = 0,
  intervalSpeed = 40,
  glitchOnlyOnHover = false
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  const randomUnit = () => {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 0x100000000;
  };

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
            result += chars[Math.floor(randomUnit() * chars.length)];
          }
          
          frame++;
          return result;
        });
      }, intervalSpeed);
    }, finalDelay);

    return () => {
      clearTimeout(timeout);
    };
  }, [text, delay, intervalSpeed]);

  // Periodic random glitch
  useEffect(() => {
    if (glitchOnlyOnHover) return;

    const interval = setInterval(() => {
      if (randomUnit() > 0.9) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200 + randomUnit() * 300);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [glitchOnlyOnHover]);

  return (
    <motion.span 
      className={`inline-block font-mono relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      onMouseEnter={() => glitchOnlyOnHover && setIsGlitching(true)}
      onMouseLeave={() => glitchOnlyOnHover && setIsGlitching(false)}
    >
      <span className="relative z-10">{displayText}</span>
      
      <AnimatePresence>
        {isGlitching && (
          <>
            <motion.span
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 0.5, x: [-2, 2, -1, 3, 0] }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 z-0 text-cyan-500 w-full"
              aria-hidden="true"
            >
              {text}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 0.5, x: [2, -2, 1, -3, 0] }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 z-0 text-purple-500 w-full"
              aria-hidden="true"
            >
              {text}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </motion.span>
  );
};
