/**
 * useSyncedScroll — sincroniza a rolagem entre dois contêineres (editor ↔ preview).
 *
 * Estratégia:
 * - Cada contêiner reporta seu scroll. Convertemos para um ratio [0..1]
 *   (scrollTop / (scrollHeight - clientHeight)) e aplicamos o mesmo ratio
 *   no outro lado.
 * - Para evitar loops infinitos, usamos uma flag "leader" com timestamp:
 *   quem rolar primeiro lidera por ~120ms; eventos no follower são ignorados
 *   nesse intervalo.
 */
import { useEffect, useRef } from 'react';

export function useSyncedScroll(
  leftRef: React.RefObject<HTMLElement>,
  rightRef: React.RefObject<HTMLElement>,
  enabled: boolean,
) {
  const lockUntil = useRef(0);
  const leader = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    const sync = (from: HTMLElement, to: HTMLElement) => {
      const max = Math.max(1, from.scrollHeight - from.clientHeight);
      const ratio = from.scrollTop / max;
      const targetMax = Math.max(1, to.scrollHeight - to.clientHeight);
      to.scrollTop = ratio * targetMax;
    };

    const onLeft = () => {
      const now = performance.now();
      if (leader.current === 'right' && now < lockUntil.current) return;
      leader.current = 'left';
      lockUntil.current = now + 120;
      sync(left, right);
    };
    const onRight = () => {
      const now = performance.now();
      if (leader.current === 'left' && now < lockUntil.current) return;
      leader.current = 'right';
      lockUntil.current = now + 120;
      sync(right, left);
    };

    left.addEventListener('scroll', onLeft, { passive: true });
    right.addEventListener('scroll', onRight, { passive: true });
    return () => {
      left.removeEventListener('scroll', onLeft);
      right.removeEventListener('scroll', onRight);
    };
  }, [enabled, leftRef, rightRef]);
}
