import type { Location } from 'react-router-dom';

export const ROUTE_KEY = 'decode_last_route';
const SCROLL_KEY = 'decode_scroll_positions';
const PAGE_STATE_PREFIX = 'decode_page_state:';
const EXCLUDED_PATHS = new Set(['/', '/login', '/reset-password']);

type ScrollPosition = {
  x: number;
  y: number;
};

function canUseStorage() {
  return typeof window !== 'undefined';
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
  if (!canUseStorage()) return route;

  try {
    const url = new URL(route, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return route;
  }
}

export function isPersistablePath(pathname: string) {
  return !EXCLUDED_PATHS.has(pathname);
}

export function getLocationRoute(location: Pick<Location, 'pathname' | 'search' | 'hash'>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function saveLastRoute(route: string) {
  if (!canUseStorage()) return;

  const normalizedRoute = getNormalizedRoute(route);

  try {
    const url = new URL(normalizedRoute, window.location.origin);
    if (!isPersistablePath(url.pathname)) return;
    localStorage.setItem(ROUTE_KEY, `${url.pathname}${url.search}${url.hash}`);
  } catch {
    if (normalizedRoute && !EXCLUDED_PATHS.has(normalizedRoute)) {
      localStorage.setItem(ROUTE_KEY, normalizedRoute);
    }
  }
}

export function getLastRoute(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ROUTE_KEY);
}

export function clearLastRoute() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ROUTE_KEY);
}

export function bootstrapSavedRoute() {
  if (!canUseStorage()) return;

  const currentPath = window.location.pathname;
  if (currentPath !== '/' && currentPath !== '/login') return;

  const lastRoute = getLastRoute();
  if (!lastRoute || lastRoute === '/' || lastRoute === '/login') return;

  window.history.replaceState(window.history.state, '', lastRoute);
}

export function saveScrollPosition(route: string, position: ScrollPosition) {
  if (!canUseStorage()) return;

  const scrollMap = readJson<Record<string, ScrollPosition>>(sessionStorage, SCROLL_KEY, {});
  scrollMap[route] = position;
  sessionStorage.setItem(SCROLL_KEY, JSON.stringify(scrollMap));
}

export function getScrollPosition(route: string): ScrollPosition | null {
  if (!canUseStorage()) return null;

  const scrollMap = readJson<Record<string, ScrollPosition>>(sessionStorage, SCROLL_KEY, {});
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
  if (!canUseStorage()) return;
  sessionStorage.setItem(getPageStateStorageKey(route), JSON.stringify(state));
}

export function getPageState(route: string): PersistedField[] {
  if (!canUseStorage()) return [];
  return readJson<PersistedField[]>(sessionStorage, getPageStateStorageKey(route), []);
}