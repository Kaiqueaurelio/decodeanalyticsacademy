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
      const isCache = this.state.isCacheError;
      const isRecovering = this.state.isRecovering;
      const title = isCache ? 'Preparando a nova versão' : 'Algo deu errado';
      const description = isCache
        ? 'Detectamos arquivos antigos no cache do navegador. Toque no botão para carregar a versão mais recente.'
        : 'O app encontrou um erro inesperado. Atualize a página; se persistir, verifique os diagnósticos do admin.';
      const buttonLabel = isRecovering ? 'Atualizando…' : 'Atualizar agora';

      return (
        <main
          role="alert"
          aria-live="polite"
          className="min-h-dvh flex items-center justify-center p-6 bg-background text-foreground [background:radial-gradient(1200px_600px_at_20%_-10%,hsl(var(--primary)/0.10),transparent_60%),radial-gradient(900px_500px_at_110%_110%,hsl(var(--accent)/0.12),transparent_60%),hsl(var(--background))]"
        >
          <section className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-7 text-center shadow-[0_30px_80px_-20px_hsl(0_0%_0%/0.6)]">
            <div
              aria-hidden="true"
              className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),hsl(var(--accent)/0.14))]"
            >
              <span className="pointer-events-none absolute -inset-px rounded-2xl border-[1.5px] border-transparent border-t-primary border-r-accent animate-spin [animation-duration:1.1s] motion-reduce:animate-none" />
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)] motion-safe:animate-pulse" />
            </div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 mx-auto max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
            <button
              type="button"
              onClick={this.handleReload}
              disabled={isRecovering}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-primary-foreground bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.55)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:-translate-y-px hover:brightness-105 hover:shadow-[0_12px_28px_-8px_hsl(var(--accent)/0.55)] active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-progress disabled:opacity-70"
            >
              {buttonLabel}
            </button>
            <p className="mt-4 text-[11px] tracking-wide text-muted-foreground/70">Isso leva apenas alguns segundos.</p>
            {this.state.message && !isRecovering && !isCache && (
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
