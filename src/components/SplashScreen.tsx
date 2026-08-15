import React, { useEffect, useState, memo } from 'react';
import logoDecode from '@/assets/owl-icon.png';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen = memo(({ onComplete, duration = 2500 }: SplashScreenProps) => {
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
      <img
        src={logoDecode}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.2,
          filter: 'blur(24px) saturate(1.2)',
          transform: 'scale(1.16)',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'radial-gradient(circle at 50% 42%, rgba(0,240,255,0.34) 0%, rgba(0,240,255,0.1) 28%, transparent 54%)',
            'radial-gradient(circle at 48% 56%, rgba(223,255,31,0.12) 0%, rgba(223,255,31,0.04) 28%, transparent 58%)',
            'linear-gradient(135deg, rgba(4,6,12,0.96) 0%, rgba(5,5,8,0.86) 38%, rgba(3,18,28,0.92) 72%, rgba(5,5,8,0.98) 100%)',
          ].join(', '),
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,240,255,0.13) 0 1px, transparent 1px), linear-gradient(180deg, rgba(223,255,31,0.05) 0 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          opacity: 0.14,
        }}
      />

      <div
        style={{
          position: 'relative',
          width: 'min(100vw, calc(100vh * 0.5625))',
          height: 'min(100vh, calc(100vw * 1.7778))',
          maxWidth: '1080px',
          maxHeight: '1920px',
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
            inset: '4%',
            borderRadius: '32px',
            background: 'radial-gradient(circle, rgba(0,240,255,0.28), rgba(223,255,31,0.06) 38%, transparent 70%)',
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
            objectPosition: 'center',
            display: 'block',
            padding: 'clamp(18px, 4vmin, 64px)',
            filter: 'drop-shadow(0 0 28px rgba(0,240,255,0.62)) drop-shadow(0 0 76px rgba(223,255,31,0.18))',
          }}
        />
      </div>

      <style>{`
        @keyframes splash-logo {
          0% { transform: scale(0.98); opacity: 0.9; }
          45% { transform: scale(1.015); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
SplashScreen.displayName = "SplashScreen";
