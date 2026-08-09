import { useEffect } from 'react';

/**
 * Hook para gerenciar efeitos sonoros do sistema.
 * Sons de interface futuristas e discretos.
 */
export function useSoundEffects() {
  const playSound = (type: 'success' | 'click' | 'achievement' | 'focus-enter' | 'focus-exit') => {
    // Implementação básica de áudio via Audio API
    // Em um ambiente real, carregaríamos arquivos .mp3/wav otimizados
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      switch (type) {
        case 'click':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, now);
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
        case 'success':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(440, now);
          oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2);
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
        case 'focus-enter':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;
        case 'focus-exit':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(100, now);
          oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  };

  return { playSound };
}
