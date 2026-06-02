/**
 * Runtime logs — buffer leve de erros de JS, rejeições não tratadas e
 * timings de navegação por rota.
 *
 * Tudo client-side, persistido em sessionStorage (zera ao fechar a aba)
 * para que o painel de diagnóstico mostre apenas a sessão atual.
 */

const ERR_KEY = 'decode:runtime-errors:v1';
const ROUTE_KEY = 'decode:route-timings:v1';
const MAX_ERRORS = 100;
const MAX_ROUTES = 100;

export type RuntimeError = {
  ts: number;
  route: string;
  message: string;
  source?: string;
  kind: 'error' | 'rejection' | 'console';
};

export type RouteTiming = {
  ts: number;
  route: string;
  duration: number; // ms entre entrar e sair da rota
};

function readJSON<T>(key: string): T[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJSON<T>(key: string, items: T[], max: number) {
  try {
    sessionStorage.setItem(key, JSON.stringify(items.slice(-max)));
    window.dispatchEvent(new CustomEvent('decode:runtime-update'));
  } catch {
    /* quota exceeded */
  }
}

export function recordRuntimeError(err: RuntimeError) {
  if (isBenignRuntimeMessage(err.message)) return;

  const all = readJSON<RuntimeError>(ERR_KEY);
  all.push(err);
  writeJSON(ERR_KEY, all, MAX_ERRORS);
}

export function recordRouteTiming(t: RouteTiming) {
  const all = readJSON<RouteTiming>(ROUTE_KEY);
  all.push(t);
  writeJSON(ROUTE_KEY, all, MAX_ROUTES);
}

export function getRuntimeErrors(): RuntimeError[] {
  return readJSON<RuntimeError>(ERR_KEY);
}

export function getRouteTimings(): RouteTiming[] {
  return readJSON<RouteTiming>(ROUTE_KEY);
}

export function clearRuntimeLogs() {
  try {
    sessionStorage.removeItem(ERR_KEY);
    sessionStorage.removeItem(ROUTE_KEY);
    window.dispatchEvent(new CustomEvent('decode:runtime-update'));
  } catch {
    /* noop */
  }
}

/** Agrupa rotas em buckets amigáveis (dashboard, apostila, admin, etc). */
export function bucketRoute(path: string): string {
  if (path === '/' || path === '') return 'landing';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/apostila')) return 'apostila';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/biblioteca')) return 'biblioteca';
  if (path.startsWith('/exercicios') || path.startsWith('/exercises')) return 'exercicios';
  if (path.startsWith('/simulado')) return 'simulado';
  if (path.startsWith('/comunidade') || path.startsWith('/community')) return 'comunidade';
  if (path.startsWith('/perfil') || path.startsWith('/profile')) return 'perfil';
  if (path.startsWith('/login') || path.startsWith('/auth')) return 'auth';
  return 'outras';
}

let installed = false;

/**
 * Instala listeners globais para capturar erros de runtime.
 * Idempotente — chamar várias vezes é seguro.
 */
export function installRuntimeLogger() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (e) => {
    // Ignora erros de scripts third-party sem mensagem (cross-origin)
    if (!e.message) return;
    recordRuntimeError({
      ts: Date.now(),
      route: window.location.pathname,
      message: String(e.message).slice(0, 300),
      source: e.filename ? `${e.filename}:${e.lineno || '?'}` : undefined,
      kind: 'error',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || 'Unhandled promise rejection';
    recordRuntimeError({
      ts: Date.now(),
      route: window.location.pathname,
      message: String(msg).slice(0, 300),
      kind: 'rejection',
    });
  });

  // Wrap console.error para capturar erros logados pelo React/libs
  const originalError = console.error.bind(console);
  console.error = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : ''))
        .filter(Boolean)
        .join(' ')
        .slice(0, 300);
      if (msg && !isBenignRuntimeMessage(msg)) {
        recordRuntimeError({
          ts: Date.now(),
          route: window.location.pathname,
          message: msg,
          kind: 'console',
        });
      }
    } catch {
      /* noop */
    }
    originalError(...args);
  };
}

function isBenignRuntimeMessage(message: string): boolean {
  return [
    /^Download the React DevTools/i,
    /\[HMR\]|\[vite\]/i,
    /Failed to load resource/i,
    /net::ERR_ABORTED/i,
    /AbortError/i,
    /The user aborted a request/i,
    /promo-media/i,
    /ad_views/i,
    /ad_clicks/i,
  ].some((pattern) => pattern.test(message));
}
