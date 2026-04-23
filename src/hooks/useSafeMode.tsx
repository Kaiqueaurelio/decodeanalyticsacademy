import { useEffect, useState } from 'react';
import { isSafeModeEnabled, isSafeModeManual, enableSafeMode, disableSafeMode } from '@/lib/safe-mode';

/**
 * Hook reativo que retorna o estado do modo seguro e atualiza quando muda.
 */
export function useSafeMode() {
  const [enabled, setEnabled] = useState<boolean>(() => isSafeModeEnabled());
  const [manual, setManual] = useState<boolean>(() => isSafeModeManual());

  useEffect(() => {
    const handler = () => {
      setEnabled(isSafeModeEnabled());
      setManual(isSafeModeManual());
    };
    window.addEventListener('decode:safe-mode-change', handler);
    return () => window.removeEventListener('decode:safe-mode-change', handler);
  }, []);

  return {
    enabled,
    manual,
    enable: () => enableSafeMode(true),
    disable: () => disableSafeMode(),
  };
}
