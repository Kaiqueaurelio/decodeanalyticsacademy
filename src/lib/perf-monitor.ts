/**
 * Monitor leve de performance e erros de rede.
 * — Captura tempo de carregamento da página (Navigation Timing + LCP)
 * — Captura erros de fetch (status >= 400 ou rejeições)
 * — Persiste tudo em localStorage (limitado a 200 entradas) para o painel admin
 *
 * Tudo no client-side, sem dependências externas e sem impacto perceptível.
 */

const STORAGE_KEY = 'decode:perf-events:v1';
const MAX_EVENTS = 200;

// Limiares (ms) para considerar lento
export const PERF_THRESHOLDS = {
  pageLoad: 4000,      // > 4s = lento
  lcp: 2500,           // > 2.5s = lento (padrão Web Vitals)
  fetch: 5000,         // > 5s = requisição lenta
};

export type PerfEvent =
  | {
      kind: 'page-load';
      route: string;
      duration: number;
      lcp?: number;
      slow: boolean;
      ts: number;
    }
  | {
      kind: 'network-error';
      url: string;
      status: number;
      method: string;
      message?: string;
      ts: number;
    }
  | {
      kind: 'slow-fetch';
      url: string;
      method: string;
      duration: number;
      ts: number;
    };

function readEvents(): PerfEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: PerfEvent[]) {
  try {
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    // Notifica listeners (mesmo tab)
    window.dispatchEvent(new CustomEvent('decode:perf-update'));
  } catch {
    /* quota exceeded — ignora */
  }
}

export function recordEvent(event: PerfEvent) {
  const events = readEvents();
  events.push(event);
  writeEvents(events);
}

export function getEvents(): PerfEvent[] {
  return readEvents();
}

export function clearEvents() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('decode:perf-update'));
  } catch {
    /* noop */
  }
}

let installed = false;

export function installPerfMonitor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // 1) Page load — usa Navigation Timing assim que a página termina
  const capturePageLoad = () => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;
      const duration = Math.round(nav.loadEventEnd - nav.startTime);
      if (!isFinite(duration) || duration <= 0) return;

      let lcp: number | undefined;
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[];
        if (lcpEntries.length) lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
      } catch {
        /* nem todos os browsers suportam */
      }

      const slow = duration > PERF_THRESHOLDS.pageLoad || (lcp !== undefined && lcp > PERF_THRESHOLDS.lcp);
      recordEvent({
        kind: 'page-load',
        route: window.location.pathname,
        duration,
        lcp,
        slow,
        ts: Date.now(),
      });
    } catch {
      /* noop */
    }
  };

  if (document.readyState === 'complete') {
    setTimeout(capturePageLoad, 0);
  } else {
    window.addEventListener('load', () => setTimeout(capturePageLoad, 0), { once: true });
  }

  // 2) Intercepta fetch para capturar erros de rede e requisições lentas
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const start = performance.now();
    try {
      const response = await originalFetch(input, init);
      const duration = Math.round(performance.now() - start);

      // Ignora chamadas para a própria telemetria/logs e assets de dev
      const skip = /\/lovable-uploads\/|\.(?:png|jpg|jpeg|webp|svg|gif|css|js|woff2?)(?:\?|$)/i.test(url);

      if (!skip) {
        if (!response.ok && response.status >= 400) {
          recordEvent({
            kind: 'network-error',
            url: shortenUrl(url),
            status: response.status,
            method,
            message: response.statusText,
            ts: Date.now(),
          });
        } else if (duration > PERF_THRESHOLDS.fetch) {
          recordEvent({
            kind: 'slow-fetch',
            url: shortenUrl(url),
            method,
            duration,
            ts: Date.now(),
          });
        }
      }
      return response;
    } catch (err: any) {
      recordEvent({
        kind: 'network-error',
        url: shortenUrl(url),
        status: 0,
        method,
        message: err?.message || 'Falha de rede',
        ts: Date.now(),
      });
      throw err;
    }
  };
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + (u.search ? u.search.slice(0, 60) : '');
  } catch {
    return url.slice(0, 120);
  }
}

export function summarizeEvents(events: PerfEvent[]) {
  const pageLoads = events.filter((e): e is Extract<PerfEvent, { kind: 'page-load' }> => e.kind === 'page-load');
  const networkErrors = events.filter((e): e is Extract<PerfEvent, { kind: 'network-error' }> => e.kind === 'network-error');
  const slowFetches = events.filter((e): e is Extract<PerfEvent, { kind: 'slow-fetch' }> => e.kind === 'slow-fetch');

  const avgLoad = pageLoads.length
    ? Math.round(pageLoads.reduce((s, e) => s + e.duration, 0) / pageLoads.length)
    : 0;
  const slowLoadCount = pageLoads.filter((e) => e.slow).length;

  return {
    total: events.length,
    pageLoads: pageLoads.length,
    avgLoad,
    slowLoadCount,
    networkErrors: networkErrors.length,
    slowFetches: slowFetches.length,
  };
}
