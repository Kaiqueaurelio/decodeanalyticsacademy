import { useEffect, useRef, useState, type ReactNode, type ElementType, type CSSProperties } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Delay em ms antes de animar (cascata) */
  delay?: number;
  /** Direção da entrada */
  from?: 'bottom' | 'left' | 'right' | 'scale';
  /** Distância da animação em px */
  distance?: number;
  /** Threshold do IntersectionObserver */
  threshold?: number;
  /** Animar uma única vez (default true) */
  once?: boolean;
  /** Tag HTML (default div) */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Componente Reveal — anima children quando entram no viewport.
 * Respeita prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  from = 'bottom',
  distance = 18,
  threshold = 0.12,
  once = true,
  as: Tag = 'div',
  className = '',
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold, reduced]);

  const transforms: Record<NonNullable<RevealProps['from']>, string> = {
    bottom: `translate3d(0, ${distance}px, 0)`,
    left: `translate3d(-${distance}px, 0, 0)`,
    right: `translate3d(${distance}px, 0, 0)`,
    scale: `scale(0.96)`,
  };

  const baseStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translate3d(0,0,0) scale(1)' : transforms[from],
    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
    willChange: 'opacity, transform',
    ...style,
  };

  return (
    <Tag ref={ref as any} className={className} style={baseStyle}>
      {children}
    </Tag>
  );
}

/** Wrapper que aplica stagger automático em filhos diretos. */
export function RevealStagger({
  children,
  step = 80,
  className = '',
  initialDelay = 0,
}: {
  children: ReactNode[];
  step?: number;
  initialDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <Reveal key={i} delay={initialDelay + i * step}>
              {child}
            </Reveal>
          ))
        : children}
    </div>
  );
}
