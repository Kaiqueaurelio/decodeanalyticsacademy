import { useEffect, useRef } from "react";

/**
 * Hook para detectar long-press em mobile sem interferir com clique normal.
 * Retorna handlers para spread no elemento.
 *
 * @example
 * const longPress = useLongPress(() => setSheetOpen(true));
 * <button onClick={...} {...longPress}>...</button>
 */
export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clear, []);

  const start = () => {
    triggered.current = false;
    clear();
    timer.current = setTimeout(() => {
      triggered.current = true;
      // Vibração discreta se disponível
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(15); } catch { /* ignore */ }
      }
      onLongPress();
    }, ms);
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onTouchCancel: clear,
    onContextMenu: (e: React.MouseEvent) => {
      // Bloqueia menu do navegador no long-press; também serve em desktop
      e.preventDefault();
      onLongPress();
    },
    /** Use para checar se o último clique foi um long-press (e cancelar o onClick) */
    wasLongPress: () => triggered.current,
  };
}
