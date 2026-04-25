import { Component, ReactNode } from 'react';
import { recordFailure, isSafeModeEnabled, disableSafeMode } from '@/lib/safe-mode';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  routeKey: string;
}

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Error Boundary global por rota.
 * — Captura qualquer erro de renderização da árvore filha.
 * — Registra a falha em `safe-mode` (que ativa o modo seguro automaticamente
 *   após N falhas na mesma rota).
 * — Mostra um fallback minimalista com botão de retry.
 */
export class SafeModeBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message };
  }

  componentDidCatch(error: Error) {
    try {
      const activated = recordFailure(this.props.routeKey, error?.message);
      if (activated) {
        // Recarrega para aplicar safe-mode em toda a árvore
        setTimeout(() => window.location.reload(), 250);
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line no-console
    console.error('[SafeModeBoundary]', this.props.routeKey, error);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, message: undefined });
    }
  }

  handleRetry = () => {
    // Limpa estado de falhas para evitar que o Modo Seguro continue ativo
    // após o usuário pedir nova tentativa.
    try { disableSafeMode(); } catch { /* noop */ }
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const safe = isSafeModeEnabled();
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Algo travou nesta página</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {safe
                ? 'O Modo Seguro está ativo. Tente recarregar — recursos pesados estão desativados.'
                : 'Vamos tentar de novo. Se o problema continuar, o Modo Seguro será ativado automaticamente.'}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={this.handleRetry} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
            </Button>
            <Button size="sm" onClick={() => window.location.reload()} className="gap-1.5">
              Recarregar página
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
