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
      {/* Logo principal do app */}
      <div style={{ textAlign: 'center', animation: opacity > 0 ? 'pulse 2s infinite' : 'none' }}>
        <img
          src={logoDecode}
          alt="Logo da coruja"
          style={{
            width: '260px',
            height: '260px',
            objectFit: 'contain',
            marginBottom: '12px',
            display: 'block',
            filter: 'drop-shadow(0 0 24px rgba(0,240,255,0.55)) drop-shadow(0 0 60px rgba(168,85,247,0.3))',
          }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          DECODE ANALYTICS <span style={{ color: '#00f0ff' }}>Academy</span>
        </h1>
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
