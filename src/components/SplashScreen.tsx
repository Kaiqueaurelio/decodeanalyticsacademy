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
        background: '#050508',
        opacity: opacity,
        transition: 'opacity 500ms ease-out',
        pointerEvents: opacity > 0 ? 'auto' : 'none',
      }}
    >
      <img
        src={logoDecode}
        alt="Decode Analytics Academy"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: opacity > 0 ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 2500ms ease-out',
          filter: 'drop-shadow(0 0 32px rgba(0,240,255,0.45))',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(5,5,8,0.08) 0%, rgba(5,5,8,0.38) 72%, rgba(5,5,8,0.72) 100%)',
        }}
      />
    </div>
  );
}
