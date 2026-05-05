import React, { useEffect, useState } from 'react';

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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        opacity: opacity,
        transition: 'opacity 500ms ease-out',
        pointerEvents: opacity > 0 ? 'auto' : 'none',
      }}
    >
      {/* Logo SVG Simples */}
      <div style={{ textAlign: 'center', animation: opacity > 0 ? 'pulse 2s infinite' : 'none' }}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 240"
          style={{ 
            marginBottom: '20px', 
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))',
            shapeRendering: 'geometricPrecision'
          }}
        >
          {/* Owl Body */}
          <ellipse cx="100" cy="120" rx="45" ry="55" fill="#8B6F47" />

          {/* Left Eye */}
          <circle cx="75" cy="100" r="20" fill="#FFFFFF" />
          <circle cx="75" cy="100" r="14" fill="#2D5016" />
          <circle cx="78" cy="97" r="6" fill="#FFFFFF" />

          {/* Right Eye */}
          <circle cx="125" cy="100" r="20" fill="#FFFFFF" />
          <circle cx="125" cy="100" r="14" fill="#2D5016" />
          <circle cx="128" cy="97" r="6" fill="#FFFFFF" />

          {/* Beak */}
          <polygon points="100,115 95,125 105,125" fill="#F4A460" />

          {/* Graduation Cap */}
          <rect x="70" y="50" width="60" height="8" fill="#1a1a1a" rx="2" />
          <polygon points="100,50 70,45 130,45" fill="#1a1a1a" />
          <line x1="100" y1="50" x2="110" y2="35" stroke="#FFD700" strokeWidth="2" />
          <circle cx="110" cy="35" r="4" fill="#FFD700" />

          {/* Books */}
          <rect x="50" y="160" width="35" height="50" fill="#8B4513" rx="2" />
          <rect x="52" y="162" width="31" height="46" fill="#A0522D" />

          <rect x="115" y="165" width="35" height="45" fill="#1E3A8A" rx="2" />
          <rect x="117" y="167" width="31" height="41" fill="#3B82F6" />

          {/* Analytics Arrow */}
          <path d="M 155 90 L 175 70 L 175 95 Z" fill="#06B6D4" transform="rotate(-45 165 82)" />
        </svg>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px 0' }}>
          Decode Analytics
        </h1>
        <p style={{ fontSize: '18px', color: '#4a5568', margin: '0 0 4px 0' }}>Academy</p>
        <p style={{ fontSize: '12px', color: '#718096', letterSpacing: '2px', margin: 0 }}>Powered by AI</p>
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
