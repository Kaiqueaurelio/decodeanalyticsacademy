/**
 * Modo Seguro de Emergência
 * — Detecta falhas repetidas (render errors, chunk errors, unhandled rejections)
 *   na MESMA rota dentro de uma janela curta de tempo.
 * — Quando excede o limiar, ativa "safe mode": desliga renderizadores pesados
 *   (Mermaid, Charts, Watermark, animações, etc.) e mostra fallbacks simples.
 * — Pode ser ativado/desativado manualmente pelo usuário (banner).
 *
 * Estado persistido em sessionStorage (zera ao fechar a aba).
 */

const FAILURE_KEY = 'decode:safe-mode:failures:v1';
const ENABLED_KEY = 'decode:safe-mode:enabled:v1';
const MANUAL_KEY = 'decode:safe-mode:manual:v1';

const FAILURE_WINDOW_MS = 60_000; // 1 min
const FAILURE_THRESHOLD = 3;       // 3 falhas na mesma rota → safe mode

type FailureRecord = { route: string; ts: number; reason?: string };

function readFailures(): FailureRecord[] {
  try {
    const raw = sessionStorage.getItem(FAILURE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFailures(records: FailureRecord[]) {
  try {
    sessionStorage.setItem(FAILURE_KEY, JSON.stringify(records));
  } catch {
    /* noop */
  }
}

function emitChange() {
  try {
    window.dispatchEvent(new CustomEvent('decode:safe-mode-change'));
  } catch {
    /* noop */
  }
}

export function isSafeModeEnabled(): boolean {
  try {
    return sessionStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function isSafeModeManual(): boolean {
  try {
    return sessionStorage.getItem(MANUAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableSafeMode(manual = false) {
  try {
    sessionStorage.setItem(ENABLED_KEY, '1');
    if (manual) sessionStorage.setItem(MANUAL_KEY, '1');
  } catch {
    /* noop */
  }
  emitChange();
}

export function disableSafeMode() {
  try {
    sessionStorage.removeItem(ENABLED_KEY);
    sessionStorage.removeItem(MANUAL_KEY);
    sessionStorage.removeItem(FAILURE_KEY);
  } catch {
    /* noop */
  }
  emitChange();
}

/**
 * Rotas em que NUNCA devemos ativar Modo Seguro automaticamente
 * (ex: telas públicas leves de login/landing).
 */
const SAFE_MODE_ROUTE_BLOCKLIST = ['/', '/login', '/reset-password', '/offline'];

/**
 * Registra uma falha para uma rota. Se ultrapassar o limiar dentro da janela,
 * ativa o modo seguro automaticamente. Retorna `true` se ativou agora.
 */
export function recordFailure(route: string, reason?: string): boolean {
  // Não acumula falhas em rotas públicas — evita prender o usuário no login.
  if (SAFE_MODE_ROUTE_BLOCKLIST.includes(route)) return false;

  const now = Date.now();
  const all = readFailures().filter((r) => now - r.ts < FAILURE_WINDOW_MS);
  all.push({ route, ts: now, reason });
  writeFailures(all);

  const sameRoute = all.filter((r) => r.route === route);
  if (sameRoute.length >= FAILURE_THRESHOLD && !isSafeModeEnabled()) {
    enableSafeMode(false);
    return true;
  }
  return false;
}

export function getRecentFailures(route?: string): FailureRecord[] {
  const now = Date.now();
  return readFailures()
    .filter((r) => now - r.ts < FAILURE_WINDOW_MS)
    .filter((r) => !route || r.route === route);
}

let listenersInstalled = false;

/**
 * Escuta erros globais (chunk loading, unhandled rejections) e contabiliza
 * falhas para a rota atual.
 */
export function installSafeModeListeners() {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;

  const isLikelyRenderFailure = (msg?: string) => {
    if (!msg) return false;
    return (
      /Importing a module script failed/i.test(msg) ||
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Loading chunk \d+ failed/i.test(msg) ||
      /ChunkLoadError/i.test(msg) ||
      /Cannot read propert(y|ies)/i.test(msg) ||
      /undefined is not a function/i.test(msg)
    );
  };

  window.addEventListener('error', (e) => {
    if (isLikelyRenderFailure(e.message)) {
      recordFailure(window.location.pathname, e.message);
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    if (isLikelyRenderFailure(msg)) {
      recordFailure(window.location.pathname, msg);
    }
  });
}
