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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050508',
        opacity: opacity,
        transition: 'opacity 500ms ease-out',
        pointerEvents: opacity > 0 ? 'auto' : 'none',
      }}
    >
      {/* A imagem do logo ja inclui o nome do app. */}
      <div style={{ textAlign: 'center', animation: opacity > 0 ? 'pulse 2s infinite' : 'none' }}>
        <img
          src={logoDecode}
          alt="Decode Analytics Academy"
          style={{
            width: 'min(260px, 68vw)',
            height: 'min(260px, 68vw)',
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 0 24px rgba(0,240,255,0.55)) drop-shadow(0 0 60px rgba(168,85,247,0.3))',
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
