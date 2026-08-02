import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'decode-academy-sidebar-open';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved === 'true';
  });

  const toggle = () => setIsOpen((prev) => !prev);
  const setOpen = (open: boolean) => setIsOpen(open);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen));
    
    // Dispatch a custom event so other components using this hook can sync
    window.dispatchEvent(new CustomEvent('sidebar-state-change', { detail: isOpen }));
  }, [isOpen]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail !== isOpen) {
        setIsOpen(e.detail);
      }
    };

    window.addEventListener('sidebar-state-change', handleSync);
    return () => window.removeEventListener('sidebar-state-change', handleSync);
  }, [isOpen]);

  return { isOpen, toggle, setOpen };
}
