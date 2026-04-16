import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLastRoute, clearLastRoute, getLocationRoute, saveLastRoute } from '@/lib/app-persistence';

export function useRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    saveLastRoute(getLocationRoute(location));
  }, [location]);
}

export { getLastRoute, clearLastRoute };
