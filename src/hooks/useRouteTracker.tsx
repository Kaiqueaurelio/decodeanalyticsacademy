import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getLastRoute, clearLastRoute, getLocationRoute, saveLastRoute } from '@/lib/app-persistence';
import { recordRouteTiming } from '@/lib/runtime-logs';

export function useRouteTracker() {
  const location = useLocation();
  const enteredAtRef = useRef<number>(performance.now());
  const previousRouteRef = useRef<string>(location.pathname);

  useEffect(() => {
    saveLastRoute(getLocationRoute(location));

    // Registra a duração da rota anterior antes de trocar
    const previous = previousRouteRef.current;
    const now = performance.now();
    const duration = Math.round(now - enteredAtRef.current);
    if (previous && duration > 0 && duration < 30 * 60_000 /* descarta sessões > 30min */) {
      recordRouteTiming({ ts: Date.now(), route: previous, duration });
    }
    previousRouteRef.current = location.pathname;
    enteredAtRef.current = now;
  }, [location]);
}

export { getLastRoute, clearLastRoute };
