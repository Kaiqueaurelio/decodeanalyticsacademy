import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (children !== displayChildren) {
      setStage('exit');
      const t = setTimeout(() => {
        setDisplayChildren(children);
        setStage('enter');
      }, 150);
      return () => clearTimeout(t);
    }
  }, [children, displayChildren]);

  return (
    <div
      key={location.pathname}
      className={`transition-all duration-300 ease-out ${
        stage === 'enter'
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {displayChildren}
    </div>
  );
}
