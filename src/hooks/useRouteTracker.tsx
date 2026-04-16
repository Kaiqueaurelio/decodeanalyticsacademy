import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_KEY = 'decode_last_route';
const EXCLUDED = ['/', '/login', '/reset-password'];

export function useRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!EXCLUDED.includes(location.pathname)) {
      localStorage.setItem(ROUTE_KEY, location.pathname);
    }
  }, [location.pathname]);
}

export function getLastRoute(): string | null {
  return localStorage.getItem(ROUTE_KEY);
}

export function clearLastRoute() {
  localStorage.removeItem(ROUTE_KEY);
}
