import { useEffect, useState } from 'react';

/**
 * Web-based screenshot protection:
 * - Blacks out the screen when the tab loses focus/visibility (mitigates iOS/Android app switcher screenshots and desktop screenshot tools that briefly defocus).
 * - Intercepts PrintScreen / Ctrl+P / Ctrl+Shift+S keys.
 * - Blocks copy / cut / context menu / drag.
 *
 * Note: True OS-level screenshot prevention (like WhatsApp) is only possible in a native app (Capacitor + FLAG_SECURE on Android, overlay on iOS).
 */
export function ScreenshotGuard() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const hide = () => setHidden(true);
    const show = () => setHidden(false);

    const onVisibility = () => {
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
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    window.addEventListener('keydown', onKey);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
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
