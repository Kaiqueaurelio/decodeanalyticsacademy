/**
 * Buffer em memória (+ sessionStorage) de eventos do fluxo de auth.
 * Alimentado por `logAuthFlow` no `useAuth`, lido pelo DiagnosticsPanel.
 */
const KEY = 'decode:auth-log:v1';
const MAX = 80;

export type AuthLogEntry = {
  ts: number;
  event: string;
  data?: Record<string, unknown>;
};

function read(): AuthLogEntry[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: AuthLogEntry[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items.slice(-MAX)));
    window.dispatchEvent(new CustomEvent('decode:auth-log-update'));
  } catch { /* quota */ }
}

export function recordAuthEvent(event: string, data?: Record<string, unknown>) {
  const all = read();
  all.push({ ts: Date.now(), event, data });
  write(all);
}

export function getAuthEvents(): AuthLogEntry[] {
  return read();
}

export function clearAuthEvents() {
  try {
    sessionStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('decode:auth-log-update'));
  } catch { /* noop */ }
}
