import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

const TRIGGER = 70;
const MAX = 110;

/** Pull-to-refresh nativo (mobile only). Recarrega a página quando o usuário puxa o topo. */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('ontouchstart' in window)) return;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0) { active.current = false; return; }
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // resistência
      const resisted = Math.min(MAX, dy * 0.55);
      setPull(resisted);
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pull >= TRIGGER && !refreshing) {
        setRefreshing(true);
        setPull(TRIGGER);
        setTimeout(() => window.location.reload(), 350);
      } else {
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [pull, refreshing]);

  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(1, pull / TRIGGER);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pull - 40}px)`, transition: refreshing ? 'transform 0.2s ease' : 'none' }}
    >
      <div className="mt-2 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
        <RotateCw
          className={`h-4 w-4 text-primary ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)`, opacity: 0.5 + progress * 0.5 }}
        />
      </div>
    </div>
  );
}
