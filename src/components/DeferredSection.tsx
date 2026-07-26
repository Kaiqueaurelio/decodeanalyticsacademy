import { useEffect, useRef, useState, Suspense, type ReactNode } from 'react';

interface DeferredSectionProps {
  children: ReactNode;
  /** Altura reservada enquanto a seção não é montada (evita salto de layout). */
  minHeight?: string;
  /** Antecedência para começar a carregar o chunk. */
  rootMargin?: string;
}

/**
 * Só monta (e portanto só baixa o chunk lazy) quando a seção está próxima
 * do viewport. Reduz drasticamente o JS baixado/executado no carregamento.
 */
export function DeferredSection({
  children,
  minHeight = '60vh',
  rootMargin = '400px 0px',
}: DeferredSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? (
        <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>{children}</Suspense>
      ) : null}
    </div>
  );
}
