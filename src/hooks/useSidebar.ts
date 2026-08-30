import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'decode-academy-sidebar-open';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return typeof window !== 'undefined'
        && window.localStorage?.getItem(SIDEBAR_STATE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = () => setIsOpen((prev) => !prev);
  const setOpen = (open: boolean) => setIsOpen(open);

  useEffect(() => {
    try {
      window.localStorage?.setItem(SIDEBAR_STATE_KEY, String(isOpen));
    } catch {
      // The sidebar remains usable even when browser storage is unavailable.
    }
    
    // Dispatch a custom event so other components using this hook can sync
    window.dispatchEvent(new CustomEvent('sidebar-state-change', { detail: isOpen }));
  }, [isOpen]);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const next = (event as CustomEvent<boolean>).detail;
      if (typeof next === 'boolean' && next !== isOpen) {
        setIsOpen(next);
      }
    };

    window.addEventListener('sidebar-state-change', handleSync);
    return () => window.removeEventListener('sidebar-state-change', handleSync);
  }, [isOpen]);

  return { isOpen, toggle, setOpen };
}
