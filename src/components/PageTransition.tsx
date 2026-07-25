import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps app content and animates every route change with a smooth
 * fade + slide-up transition. Respects prefers-reduced-motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [stage, setStage] = useState<'enter' | 'idle'>('enter');
  const [displayKey, setDisplayKey] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname === displayKey) return;
    setStage('enter');
    setDisplayKey(location.pathname);
  }, [location.pathname, displayKey]);

  useEffect(() => {
    if (stage !== 'enter') return;
    const t = window.setTimeout(() => setStage('idle'), 420);
    return () => window.clearTimeout(t);
  }, [displayKey, stage]);

  return (
    <div
      key={displayKey}
      data-page-stage={stage}
      className="page-transition-wrapper"
    >
      {children}
    </div>
  );
}
