import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type SwipeAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** cor de fundo (hsl tokens). Ex: 'hsl(var(--primary))' ou 'hsl(45 100% 55%)' */
  background?: string;
  /** cor do texto/ícone. Default depende da variant */
  color?: string;
  variant?: "default" | "destructive" | "primary" | "warning";
};

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Ações reveladas no swipe-left (lado direito). Máx 3 recomendado. */
  rightActions?: SwipeAction[];
  /** Ações reveladas no swipe-right (lado esquerdo). Use 1 ação para destaque iOS-like. */
  leftActions?: SwipeAction[];
  /** Largura de cada ação (px). Default 76. */
  actionWidth?: number;
  /** Threshold (px) para snap aberto. Default = 40% da largura total das ações. */
  snapThreshold?: number;
  /** Callback ao abrir/fechar (ex: para fechar outros cards) */
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Desabilita o swipe (ex: desktop). Default: false */
  disabled?: boolean;
}

const variantBg: Record<NonNullable<SwipeAction["variant"]>, string> = {
  default: "hsl(var(--muted-foreground))",
  primary: "hsl(var(--primary))",
  destructive: "hsl(var(--destructive))",
  warning: "hsl(45 100% 55%)",
};
const variantFg: Record<NonNullable<SwipeAction["variant"]>, string> = {
  default: "hsl(var(--background))",
  primary: "hsl(var(--primary-foreground))",
  destructive: "hsl(var(--destructive-foreground))",
  warning: "hsl(20 14% 10%)",
};

/**
 * SwipeableRow — gesto estilo iOS Mail.
 *
 * - Arraste para a ESQUERDA → revela `rightActions` (lado direito).
 * - Arraste para a DIREITA → revela `leftActions` (lado esquerdo). Útil para
 *   1 ação rápida estilo "Marcar como lido" / "Favoritar".
 * - Tap fora ou em outro card fecha automaticamente.
 * - Não interfere com clique, scroll vertical ou long-press do conteúdo
 *   (só ativa quando o movimento horizontal supera o vertical).
 */
export function SwipeableRow({
  children,
  rightActions = [],
  leftActions = [],
  actionWidth = 76,
  snapThreshold,
  onOpenChange,
  className,
  disabled = false,
}: SwipeableRowProps) {
  const rightWidth = rightActions.length * actionWidth;
  const leftWidth = leftActions.length * actionWidth;
  const rightThreshold = snapThreshold ?? rightWidth * 0.4;
  const leftThreshold = snapThreshold ?? leftWidth * 0.4;

  const [translate, setTranslate] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const startTranslate = React.useRef(0);
  const lockedAxis = React.useRef<"x" | "y" | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isOpen = translate < -2 || translate > 2;

  React.useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Fecha ao tocar fora
  React.useEffect(() => {
    if (translate === 0) return;
    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setTranslate(0);
      }
    };
    document.addEventListener("touchstart", handleOutside, { passive: true });
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [translate]);

  if (disabled || (rightActions.length === 0 && leftActions.length === 0)) {
    return <div className={className}>{children}</div>;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    startTranslate.current = translate;
    lockedAxis.current = null;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    if (lockedAxis.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      lockedAxis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (lockedAxis.current === "y") return;

    let next = startTranslate.current + dx;

    // Limites
    const minOpen = -rightWidth;
    const maxOpen = leftWidth;
    if (next < minOpen) {
      // Resistência ao passar do limite esquerdo
      const over = minOpen - next;
      next = minOpen - over * 0.4;
    }
    if (next > maxOpen) {
      const over = next - maxOpen;
      next = maxOpen + over * 0.4;
    }
    // Bloqueia movimento para um lado se não houver ações
    if (next < 0 && rightActions.length === 0) next = 0;
    if (next > 0 && leftActions.length === 0) next = 0;

    setTranslate(next);
  };

  const onTouchEnd = () => {
    setDragging(false);
    if (lockedAxis.current !== "x") return;

    if (translate <= -rightThreshold && rightActions.length > 0) {
      setTranslate(-rightWidth);
    } else if (translate >= leftThreshold && leftActions.length > 0) {
      setTranslate(leftWidth);
    } else {
      setTranslate(0);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    setTranslate(0);
    setTimeout(() => action.onSelect(), 120);
  };

  const renderActionButton = (action: SwipeAction) => {
    const Icon = action.icon;
    const bg = action.background ?? variantBg[action.variant ?? "default"];
    const fg = action.color ?? variantFg[action.variant ?? "default"];
    return (
      <button
        key={action.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleActionClick(action);
        }}
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold active:brightness-90 transition-[filter]"
        style={{ width: actionWidth, background: bg, color: fg }}
        aria-label={action.label}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
        <span className="leading-none">{action.label}</span>
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl", className)}
    >
      {/* Ações ESQUERDA (revelado ao arrastar para direita) */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-stretch"
          style={{ width: leftWidth, pointerEvents: translate > 2 ? "auto" : "none" }}
          aria-hidden={translate <= 2}
        >
          {leftActions.map(renderActionButton)}
        </div>
      )}

      {/* Ações DIREITA (revelado ao arrastar para esquerda) */}
      {rightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{ width: rightWidth, pointerEvents: translate < -2 ? "auto" : "none" }}
          aria-hidden={translate >= -2}
        >
          {rightActions.map(renderActionButton)}
        </div>
      )}

      {/* Conteúdo arrastável */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{
          transform: `translate3d(${translate}px, 0, 0)`,
          transition: dragging ? "none" : "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          touchAction: "pan-y",
        }}
        className="relative bg-background"
      >
        {children}
      </div>
    </div>
  );
}
