import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

let lastCopyToast = 0;
const notifyBlocked = () => {
  const now = Date.now();
  if (now - lastCopyToast < 2500) return;
  lastCopyToast = now;
  toast.info('Apenas blocos de código podem ser copiados', {
    description: 'O restante do conteúdo está protegido.',
  });
};

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
    // Detecção mais permissiva: qualquer dispositivo touch OU viewport pequena
    // é tratado como "mobile-like" para evitar falsos positivos no overlay
    // (redimensionamento de janela, abrir DevTools, troca de aba rápida, etc.).
    const isMobileLike = () =>
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      || (typeof window !== 'undefined' && (
        window.matchMedia?.('(pointer: coarse)').matches
        || window.innerWidth < 1024
      ));

    let safetyTimer: number | undefined;
    const hide = () => {
      setHidden(true);
      // Rede de segurança: nunca deixa o overlay travado por mais de 4s.
      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => setHidden(false), 4000);
    };
    const show = () => {
      window.clearTimeout(safetyTimer);
      setHidden(false);
    };

    const onVisibility = () => {
      if (isMobileLike()) return; // skip em qualquer tela mobile-like
      if (document.visibilityState === 'hidden') hide();
      else show();
    };

    // Resize/orientationchange NÃO devem acionar overlay — apenas garantir
    // que ele saia se estiver ativo (caso de redimensionar enquanto oculto).
    const onResize = () => show();

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

    /**
     * Permite copiar/recortar/menu de contexto:
     *  - Dentro de elementos marcados com `data-allow-copy` (ex.: blocos de código).
     *  - Em qualquer lugar quando o modo admin está ativo (`<html data-admin-mode="true">`),
     *    para que o admin tenha controle total sobre o texto na sua área de trabalho.
     */
    const isAdminMode = () =>
      document.documentElement.getAttribute('data-admin-mode') === 'true';

    const allowInsideOptIn = (e: Event) => {
      if (isAdminMode()) return; // admin: libera tudo
      const target = e.target as HTMLElement | null;
      if (target && target.closest?.('[data-allow-copy]')) return; // libera
      e.preventDefault();
      if (e.type === 'copy' || e.type === 'cut') notifyBlocked();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('keydown', onKey);
    document.addEventListener('copy', allowInsideOptIn);
    document.addEventListener('cut', allowInsideOptIn);
    document.addEventListener('contextmenu', allowInsideOptIn);
    document.addEventListener('dragstart', block);

    return () => {
      window.clearTimeout(safetyTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('copy', allowInsideOptIn);
      document.removeEventListener('cut', allowInsideOptIn);
      document.removeEventListener('contextmenu', allowInsideOptIn);
      document.removeEventListener('dragstart', block);
    };
  }, []);

  if (!hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center text-center p-8 cursor-pointer"
      aria-hidden="true"
      onClick={() => setHidden(false)}
      onTouchStart={() => setHidden(false)}
    >
      <Lock className="h-10 w-10 mb-4 text-primary" strokeWidth={1.5} />
      <h2 className="font-display text-xl mb-2 text-foreground">Conteúdo protegido</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Toque na tela para voltar ao conteúdo.
      </p>
    </div>
  );
}
