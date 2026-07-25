import React, { Component, ErrorInfo } from 'react';

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
      const title = this.state.isCacheError ? 'Atualizando o app' : 'Algo deu errado';
      const description = this.state.isCacheError
        ? 'Uma versao antiga ficou presa no cache do navegador. O app vai limpar esses arquivos e abrir a versao nova.'
        : 'O app encontrou um erro inesperado. Atualize a pagina; se continuar, verifique os diagnosticos do admin.';
      const buttonLabel = this.state.isRecovering ? 'Atualizando...' : 'Atualizar agora';

      return (
        <main className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              !
            </div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <button
              type="button"
              onClick={this.handleReload}
              disabled={this.state.isRecovering}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {buttonLabel}
            </button>
            {this.state.message && !this.state.isRecovering && (
              <p className="mt-4 break-words text-[11px] text-muted-foreground/70">{this.state.message}</p>
            )}
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
