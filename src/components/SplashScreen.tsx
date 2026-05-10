import React, { useEffect, useState } from 'react';
import logoDecode from '@/assets/logo-decode.png';

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
      {/* Logo Decode Analytics Academy */}
      <div style={{ textAlign: 'center', animation: opacity > 0 ? 'pulse 2s infinite' : 'none' }}>
        <div style={{
          display: 'inline-block',
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '32px',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 0 60px rgba(0,240,255,0.5), 0 0 120px rgba(168,85,247,0.25)',
          border: '2px solid rgba(0,240,255,0.6)',
        }}>
          <img
            src={logoDecode}
            alt="Decode Analytics Academy"
            style={{
              width: '220px',
              height: '220px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          Decode <span style={{ color: '#00f0ff' }}>Analytics</span>
        </h1>
        <p style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.4em', textTransform: 'uppercase', margin: 0 }}>Academy</p>
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
