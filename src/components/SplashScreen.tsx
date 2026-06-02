import React, { useEffect, useState } from 'react';
import logoDecode from '@/assets/owl-icon.png';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Inicia o fade out 500ms antes de completar
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, duration - 500);

    // Completa após o fade out
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050508',
        opacity: opacity,
        transition: 'opacity 500ms ease-out',
        pointerEvents: opacity > 0 ? 'auto' : 'none',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'radial-gradient(circle at 50% 43%, rgba(0,240,255,0.28) 0%, rgba(0,240,255,0.08) 24%, transparent 44%)',
            'radial-gradient(circle at 42% 52%, rgba(168,85,247,0.34) 0%, rgba(122,0,134,0.16) 30%, transparent 55%)',
            'linear-gradient(135deg, #12001f 0%, #050508 38%, #061426 72%, #050508 100%)',
          ].join(', '),
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(122,0,134,0.22) 0 1px, transparent 1px), linear-gradient(180deg, rgba(0,240,255,0.08) 0 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.16,
        }}
      />

      <div
        style={{
          position: 'relative',
          width: 'min(62vmin, 420px)',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: opacity > 0 ? 'splash-logo 2500ms ease-out both' : 'none',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-18%',
            borderRadius: '999px',
            background: 'radial-gradient(circle, rgba(0,240,255,0.34), rgba(168,85,247,0.18) 42%, transparent 68%)',
            filter: 'blur(18px)',
          }}
        />
        <img
          src={logoDecode}
          alt="Decode Analytics Academy"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 0 26px rgba(0,240,255,0.55)) drop-shadow(0 0 70px rgba(168,85,247,0.38))',
          }}
        />
      </div>

      <style>{`
        @keyframes splash-logo {
          0% { transform: scale(0.96); opacity: 0.86; }
          45% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
