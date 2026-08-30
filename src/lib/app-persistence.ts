import type { Location } from 'react-router-dom';

export const ROUTE_KEY = 'decode_last_route';
const SCROLL_KEY = 'decode_scroll_positions';
const PAGE_STATE_PREFIX = 'decode_page_state:';
const EXCLUDED_PATHS = new Set(['/','/login','/reset-password']);

export function isAdministrativePath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

type ScrollPosition = {
  x: number;
  y: number;
};

function getLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage ?? null : null;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage ?? null : null;
  } catch {
    return null;
  }
}

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getNormalizedRoute(route: string) {
  if (typeof window === 'undefined') return route;

  try {
    const url = new URL(route, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return route;
  }
}

export function isPersistablePath(pathname: string) {
  return !EXCLUDED_PATHS.has(pathname) && !isAdministrativePath(pathname);
}

export function getLocationRoute(location: Pick<Location, 'pathname' | 'search' | 'hash'>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function saveLastRoute(route: string) {
  const storage = getLocalStorage();
  if (!storage) return;

  const normalizedRoute = getNormalizedRoute(route);

  try {
    const url = new URL(normalizedRoute, window.location.origin);
    if (!isPersistablePath(url.pathname)) return;
    storage.setItem(ROUTE_KEY, `${url.pathname}${url.search}${url.hash}`);
  } catch {
    const fallbackPathname = normalizedRoute.split(/[?#]/)[0];
    if (normalizedRoute && isPersistablePath(fallbackPathname)) {
      try {
        storage.setItem(ROUTE_KEY, normalizedRoute);
      } catch {
        // Persistence is optional when browser storage is blocked.
      }
    }
  }
}

export function getLastRoute(): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(ROUTE_KEY);
  } catch {
    return null;
  }
}

export function clearLastRoute() {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(ROUTE_KEY);
  } catch {
    // Best-effort cleanup only.
  }
}

export function bootstrapSavedRoute() {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  if (currentPath !== '/' && currentPath !== '/login') return;

  const lastRoute = getLastRoute();
  if (!lastRoute || lastRoute === '/' || lastRoute === '/login') return;

  try {
    const url = new URL(lastRoute, window.location.origin);
    if (!isPersistablePath(url.pathname)) {
      clearLastRoute();
      return;
    }
  } catch {
    clearLastRoute();
    return;
  }

  window.history.replaceState(window.history.state, '', lastRoute);
}

export function saveScrollPosition(route: string, position: ScrollPosition) {
  const storage = getSessionStorage();
  if (!storage) return;

  const scrollMap = readJson<Record<string, ScrollPosition>>(storage, SCROLL_KEY, {});
  scrollMap[route] = position;
  try {
    storage.setItem(SCROLL_KEY, JSON.stringify(scrollMap));
  } catch {
    // Scroll restoration remains optional.
  }
}

export function getScrollPosition(route: string): ScrollPosition | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  const scrollMap = readJson<Record<string, ScrollPosition>>(storage, SCROLL_KEY, {});
  return scrollMap[route] ?? null;
}

export function getPageStateStorageKey(route: string) {
  return `${PAGE_STATE_PREFIX}${getNormalizedRoute(route)}`;
}

type PersistedField = {
  key: string;
  value: string | boolean;
};

export function savePageState(route: string, state: PersistedField[]) {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(getPageStateStorageKey(route), JSON.stringify(state));
  } catch {
    // Page state persistence is optional.
  }
}

export function getPageState(route: string): PersistedField[] {
  const storage = getSessionStorage();
  if (!storage) return [];
  return readJson<PersistedField[]>(storage, getPageStateStorageKey(route), []);
}
