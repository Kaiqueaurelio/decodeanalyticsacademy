import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export type ActionItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "destructive" | "primary";
  description?: string;
  disabled?: boolean;
};

interface ActionSheetProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  actions: ActionItem[];
  /** Footer livre (ex: botão cancelar). Se omitido, mostra "Cancelar" padrão. */
  footer?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Bottom sheet nativo no mobile (com snap points iOS-like) e Dialog centrado no desktop.
 * Uso:
 *   <ActionSheet
 *     trigger={<Button>Ações</Button>}
 *     title="Ações da apostila"
 *     actions={[{ id: 'note', label: 'Anotar', icon: PenLine, onSelect: () => {...} }]}
 *   />
 */
export function ActionSheet({
  trigger,
  title,
  description,
  actions,
  footer,
  open,
  onOpenChange,
}: ActionSheetProps) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const handleSelect = (action: ActionItem) => {
    if (action.disabled) return;
    setOpen(false);
    // Pequeno delay para a animação de fechamento ficar suave antes da ação
    setTimeout(() => action.onSelect(), 120);
  };

  const ActionList = (
    <div className="flex flex-col gap-1 px-2 pb-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const variantCls =
          action.variant === "destructive"
            ? "text-destructive hover:bg-destructive/10"
            : action.variant === "primary"
            ? "text-primary hover:bg-primary/10"
            : "text-foreground hover:bg-muted/70";
        return (
          <button
            key={action.id}
            onClick={() => handleSelect(action)}
            disabled={action.disabled}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left",
              "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
              variantCls,
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                action.variant === "destructive"
                  ? "bg-destructive/10"
                  : action.variant === "primary"
                  ? "bg-primary/15"
                  : "bg-muted/60",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold truncate">{action.label}</span>
              {action.description && (
                <span className="block text-xs text-muted-foreground truncate mt-0.5">
                  {action.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ─── MOBILE: Vaul Drawer com snap points ───
  if (isMobile) {
    return (
      <DrawerPrimitive.Root
        open={isOpen}
        onOpenChange={setOpen}
        snapPoints={[0.55, 0.92]}
        shouldScaleBackground
      >
        <DrawerPrimitive.Trigger asChild>{trigger}</DrawerPrimitive.Trigger>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <DrawerPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border border-border/60 bg-background shadow-2xl",
              "max-h-[92vh] outline-none",
              "pb-[env(safe-area-inset-bottom,0)]",
            )}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-5 pt-2 pb-4 border-b border-border/40">
                {title && (
                  <DrawerPrimitive.Title className="text-base font-bold tracking-tight">
                    {title}
                  </DrawerPrimitive.Title>
                )}
                {description && (
                  <DrawerPrimitive.Description className="text-xs text-muted-foreground mt-1">
                    {description}
                  </DrawerPrimitive.Description>
                )}
              </div>
            )}
            {!title && (
              <VisuallyHidden>
                <DrawerPrimitive.Title>Ações</DrawerPrimitive.Title>
              </VisuallyHidden>
            )}

            {/* Actions */}
            <div className="overflow-y-auto py-2">{ActionList}</div>

            {/* Footer (cancelar padrão) */}
            <div className="px-4 pb-4 pt-2 border-t border-border/40">
              {footer ?? (
                <button
                  onClick={() => setOpen(false)}
                  className="w-full h-12 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    );
  }

  // ─── DESKTOP: Dialog centrado ───
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        {(title || description) ? (
          <div className="px-5 pt-5 pb-3 border-b border-border/40">
            {title && <DialogTitle className="text-base font-bold">{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {description}
              </DialogDescription>
            )}
          </div>
        ) : (
          <VisuallyHidden>
            <DialogTitle>Ações</DialogTitle>
          </VisuallyHidden>
        )}
        <div className="py-2">{ActionList}</div>
        {footer && <div className="px-4 pb-4 pt-2 border-t border-border/40">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
