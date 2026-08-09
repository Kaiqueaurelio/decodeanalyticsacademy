import React, { Component, ErrorInfo } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  isCacheError: boolean;
  isRecovering: boolean;
}

const RECOVERY_PREFIX = 'decode_runtime_recovery:';
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

function isChunkOrCacheError(error: Error) {
  const text = `${error?.name || ''} ${error?.message || ''} ${error?.stack || ''}`.toLowerCase();
  return [
    'chunkloaderror',
    'loading chunk',
    'failed to fetch dynamically imported module',
    'importing a module script failed',
    'error loading dynamically imported module',
    'modulepreload',
  ].some((pattern) => text.includes(pattern));
}

function getRecoveryKey(error: Error) {
  const message = (error?.message || 'unknown').slice(0, 180);
  return `${RECOVERY_PREFIX}${window.location.pathname}:${message}`;
}

function hasRecentlyRecovered(key: string) {
  const recoveredAt = Number(sessionStorage.getItem(key) || 0);
  return recoveredAt > 0 && Date.now() - recoveredAt < RECOVERY_WINDOW_MS;
}

function markRecovered(key: string) {
  sessionStorage.setItem(key, String(Date.now()));
}

function pruneRecoveryMarkers() {
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (!key.startsWith(RECOVERY_PREFIX)) return;

      const recoveredAt = Number(sessionStorage.getItem(key) || 0);
      if (!recoveredAt || Date.now() - recoveredAt > RECOVERY_WINDOW_MS) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // Restricted browsers can deny sessionStorage reads.
  }
}

async function clearRuntimeCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister().catch(() => undefined)));
    }
  } catch {
    // Ignore recovery errors; cache deletion below is the important fallback.
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Private windows or restricted browsers can deny cache access.
  }
}

function reloadWithFreshUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('__decode_refresh', String(Date.now()));
  window.location.replace(url.toString());
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '', isCacheError: false, isRecovering: false };
  }

  static getDerivedStateFromError(error: Error) {
    const isCacheError = isChunkOrCacheError(error);
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado ao carregar o app.',
      isCacheError,
      isRecovering: isCacheError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught in ErrorBoundary: ', error, errorInfo);
    pruneRecoveryMarkers();

    if (!isChunkOrCacheError(error)) {
      this.setState({ isRecovering: false });
      return;
    }

    const recoveryKey = getRecoveryKey(error);
    if (hasRecentlyRecovered(recoveryKey)) {
      clearRuntimeCaches().catch(() => undefined);
      this.setState({ isRecovering: false });
      return;
    }

    markRecovered(recoveryKey);
    clearRuntimeCaches().finally(reloadWithFreshUrl);
  }

  handleReload = async () => {
    pruneRecoveryMarkers();
    await clearRuntimeCaches();
    reloadWithFreshUrl();
  };

  render() {
    if (this.state.hasError) {
      const isCacheError = this.state.isCacheError;
      const title = isCacheError ? 'Atualizando o app' : 'Algo deu errado';
      const description = isCacheError
        ? 'Uma versão antiga ficou presa no cache do navegador. O app vai limpar esses arquivos e abrir a versão nova.'
        : 'O app encontrou um erro inesperado. O log foi registrado e nossa equipe será notificada.';
      const buttonLabel = this.state.isRecovering ? 'Atualizando...' : 'Tentar novamente';

      return (
        <main className="min-h-dvh bg-[#050508] text-foreground flex items-center justify-center p-6 selection:bg-primary/20">
          <section className="w-full max-w-lg rounded-[2rem] border border-border/50 bg-card/80 backdrop-blur-xl p-8 text-center shadow-2xl shadow-primary/5">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed px-4">{description}</p>
            
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                disabled={this.state.isRecovering}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-primary/20"
              >
                {buttonLabel}
              </button>
              
              {!isCacheError && (
                <button
                  type="button"
                  onClick={() => window.location.href = '/dashboard'}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-card border border-border px-8 text-sm font-bold text-foreground transition-all hover:bg-accent/50 hover:scale-[1.02] active:scale-95"
                >
                  Voltar ao Início
                </button>
              )}
            </div>

            {this.state.message && !this.state.isRecovering && (
              <div className="mt-10 p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-left overflow-hidden">
                <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-2 opacity-60">Status do Sistema / Stack Trace</p>
                <code className="text-[11px] font-mono text-muted-foreground/90 block overflow-x-auto whitespace-pre-wrap leading-tight max-h-[120px] scrollbar-thin">
                  {this.state.message}
                </code>
              </div>
            )}
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
