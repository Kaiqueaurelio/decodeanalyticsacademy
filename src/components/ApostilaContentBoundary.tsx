import { Component, ReactNode, Suspense, lazy } from 'react';
import { AlertTriangle } from 'lucide-react';

// Lazy import — se o chunk falhar, o ErrorBoundary captura
const LazyRenderer = lazy(() =>
  import('@/components/ApostilaContentRenderer').then((m) => ({
    default: m.ApostilaContentRenderer,
  }))
);

interface Props {
  content: string;
}

interface State {
  hasError: boolean;
}

/**
 * Renderiza o conteúdo da apostila como parágrafos simples, sem formatação rica.
 * Usado como fallback quando o módulo principal de renderização falha
 * (ex.: chunk não carregado após deploy, erro de parsing, etc.) — evita tela preta.
 */
function SimpleFallback({ content }: { content: string }) {
  const paragraphs = (content || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="apostila-prose max-w-[70ch] mx-auto w-full min-w-0 px-1 sm:px-0 text-[15.5px] sm:text-[16.5px] leading-[1.85] text-foreground/90">
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>
          Modo de leitura simplificado ativo. A formatação rica não pôde ser carregada,
          mas o conteúdo está disponível abaixo.
        </span>
      </div>
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-6 last:mb-0 text-foreground/85 whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </article>
  );
}

class ApostilaErrorBoundary extends Component<Props & { children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ApostilaContentBoundary] render failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return <SimpleFallback content={this.props.content} />;
    }
    return this.props.children;
  }
}

/**
 * Wrapper resiliente do renderer da apostila:
 * - Suspense para o lazy load do módulo
 * - ErrorBoundary para qualquer erro de runtime / chunk não carregado
 * - Fallback de texto simples preserva a leitura mesmo em falha total
 */
export function ApostilaContentBoundary({ content }: Props) {
  return (
    <ApostilaErrorBoundary content={content}>
      <Suspense fallback={<SimpleFallback content={content} />}>
        <LazyRenderer content={content} />
      </Suspense>
    </ApostilaErrorBoundary>
  );
}
