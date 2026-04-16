import { useEffect, useState } from 'react';

/**
 * Web-based screenshot protection:
 * - Desktop: blacks out the screen on visibility change (mitigates screenshot tools that briefly defocus the tab).
 * - Intercepts PrintScreen / Ctrl+P / Ctrl+Shift+S keys.
 * - Blocks copy / cut / context menu / drag.
 *
 * NOTE: We intentionally do NOT trigger the overlay on mobile visibility/blur events,
 * because opening the keyboard, switching apps briefly, or tapping the URL bar fires those events
 * and would constantly cover the UI with the "Conteúdo protegido" screen — bad UX with no real protection benefit
 * (the OS-level screenshot already happens before any web event fires). Real prevention requires a native app.
 */
export function ScreenshotGuard() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      || (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);

    const hide = () => setHidden(true);
    const show = () => setHidden(false);

    const onVisibility = () => {
      if (isMobile) return; // skip on mobile to avoid false positives
      if (document.visibilityState === 'hidden') hide();
      else show();
    };

    const onKey = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard?.writeText('').catch(() => {});
        hide();
        setTimeout(show, 1500);
      }
      // Ctrl/Cmd + P (print) and Ctrl+Shift+S (some screenshot tools)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    const block = (e: Event) => e.preventDefault();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onKey);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
    };
  }, []);

  if (!hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center text-center p-8"
      aria-hidden="true"
    >
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="font-display text-xl mb-2 text-foreground">Conteúdo protegido</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Por questões de privacidade, a captura de tela e a visualização em segundo plano foram bloqueadas.
      </p>
    </div>
  );
}
