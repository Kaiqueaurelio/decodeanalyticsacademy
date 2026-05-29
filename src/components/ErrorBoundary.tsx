import React, { Component, ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

const RECOVERY_KEY = 'decode_runtime_recovered_once';

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

async function clearRuntimeCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));
    }
  } catch {
    // Ignore recovery errors; cache deletion below is the important fallback.
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.includes('js') || key.includes('workbox') || key.includes('precache') || key.includes('vite'))
          .map((key) => caches.delete(key))
      );
    }
  } catch {
    // Private windows or restricted browsers can deny cache access.
  }
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Erro inesperado ao carregar o app.' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught in ErrorBoundary: ', error, errorInfo);

    const alreadyRecovered = sessionStorage.getItem(RECOVERY_KEY) === 'true';
    if (isChunkOrCacheError(error) && !alreadyRecovered) {
      sessionStorage.setItem(RECOVERY_KEY, 'true');
      clearRuntimeCaches().finally(() => window.location.reload());
    }
  }

  handleReload = async () => {
    sessionStorage.removeItem(RECOVERY_KEY);
    await clearRuntimeCaches();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              !
            </div>
            <h1 className="text-xl font-bold">Precisamos atualizar o app</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Uma versao antiga ficou presa no cache do navegador. Clique abaixo para limpar e abrir a versao nova.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Atualizar agora
            </button>
            {this.state.message && (
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
