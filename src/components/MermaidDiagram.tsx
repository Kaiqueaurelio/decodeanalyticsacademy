import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useSafeMode } from '@/hooks/useSafeMode';

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#a855f7',
      primaryTextColor: '#fafafa',
      primaryBorderColor: '#00f0ff',
      lineColor: '#00f0ff',
      mainBkg: '#0f0f17',
      secondaryColor: '#1a1a24',
    },
  });
  initialized = true;
}

interface Props {
  chart: string;
  className?: string;
}

/** Renderiza um diagrama Mermaid (mindmap, flowchart, etc.) */
export function MermaidDiagram({ chart, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { enabled: safeMode } = useSafeMode();

  useEffect(() => {
    if (safeMode) return; // Não inicializa mermaid em modo seguro
    ensureInit();
    let cancelled = false;
    const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
    (async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('Mermaid render error', e);
        setError(e instanceof Error ? e.message : 'Erro ao renderizar diagrama');
      }
    })();
    return () => { cancelled = true; };
  }, [chart, safeMode]);

  if (safeMode) {
    return (
      <pre className={`text-xs text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border overflow-x-auto whitespace-pre-wrap ${className ?? ''}`}>
        <span className="block text-[10px] uppercase tracking-wider mb-2 text-foreground/60">Diagrama (modo seguro)</span>
        {chart}
      </pre>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        Erro ao renderizar mapa mental. <br />
        <pre className="mt-2 text-[10px] opacity-70 overflow-x-auto">{error}</pre>
      </div>
    );
  }

  return <div ref={ref} className={`mermaid-container overflow-x-auto ${className ?? ''}`} />;
}
