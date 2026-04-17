import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type SwipeAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** cor de fundo (hsl tokens). Ex: 'hsl(var(--primary))' ou 'hsl(0 84% 60%)' */
  background?: string;
  /** cor do texto/ícone. Default: branco */
  color?: string;
  variant?: "default" | "destructive" | "primary";
};

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Ações reveladas no swipe-left (lado direito). Máx 3 recomendado. */
  rightActions?: SwipeAction[];
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
};
const variantFg: Record<NonNullable<SwipeAction["variant"]>, string> = {
  default: "hsl(var(--background))",
  primary: "hsl(var(--primary-foreground))",
  destructive: "hsl(var(--destructive-foreground))",
};

/**
 * SwipeableRow — gesto estilo iOS Mail.
 *
 * - Arraste para a ESQUERDA para revelar ações inline.
 * - Tap fora ou em outro card fecha automaticamente.
 * - Não interfere com clique, scroll vertical ou long-press do conteúdo
 *   (só ativa quando o movimento horizontal supera o vertical).
 *
 * @example
 * <SwipeableRow rightActions={[
 *   { id: 'fav', label: 'Favorito', icon: Star, variant: 'primary', onSelect: () => {} },
 *   { id: 'del', label: 'Excluir', icon: Trash2, variant: 'destructive', onSelect: () => {} },
 * ]}>
 *   <MyCard />
 * </SwipeableRow>
 */
export function SwipeableRow({
  children,
  rightActions = [],
  actionWidth = 76,
  snapThreshold,
  onOpenChange,
  className,
  disabled = false,
}: SwipeableRowProps) {
  const totalWidth = rightActions.length * actionWidth;
  const threshold = snapThreshold ?? totalWidth * 0.4;

  const [translate, setTranslate] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const startX = React.useRef(0);
  const startY = React.useRef(0);
  const startTranslate = React.useRef(0);
  const lockedAxis = React.useRef<"x" | "y" | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const open = translate <= -threshold;

  // Notifica abertura
  React.useEffect(() => {
    onOpenChange?.(translate < -2);
  }, [translate, onOpenChange]);

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

  if (disabled || rightActions.length === 0) {
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

    // Decide eixo na primeira movimentação significativa
    if (lockedAxis.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      lockedAxis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (lockedAxis.current === "y") return;

    let next = startTranslate.current + dx;
    // Limites: não passa de 0 (direita) nem além do total + leve borracha (esquerda)
    if (next > 0) next = next * 0.25; // resistência
    const min = -totalWidth - 24;
    if (next < min) next = min - (next - min) * 0.5;
    setTranslate(next);
  };

  const onTouchEnd = () => {
    setDragging(false);
    if (lockedAxis.current !== "x") {
      // Sem swipe → mantém estado atual
      return;
    }
    // Snap: aberto se passou do threshold, senão fecha
    if (translate <= -threshold) setTranslate(-totalWidth);
    else setTranslate(0);
  };

  const handleActionClick = (action: SwipeAction) => {
    setTranslate(0);
    setTimeout(() => action.onSelect(), 120);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl", className)}
    >
      {/* Camada de ações (atrás do conteúdo) */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: totalWidth, pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      >
        {rightActions.map((action) => {
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
        })}
      </div>

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
