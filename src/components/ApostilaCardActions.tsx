import { useState, type ReactElement, cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, PenLine, Share2, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { ActionSheet, type ActionItem } from "@/components/ActionSheet";
import { useLongPress } from "@/hooks/useLongPress";
import type { Tables } from "@/integrations/supabase/types";

type Apostila = Tables<"apostilas">;

interface ApostilaCardActionsProps {
  apostila: Apostila;
  exerciseCount?: number;
  /**
   * Filho deve ser um único elemento clicável (button/div). Recebe handlers de
   * long-press e tem o onClick interceptado para cancelar quando for long-press.
   */
  children: ReactElement<any>;
}

/**
 * Wrapper que adiciona long-press → bottom sheet (mobile) ou context menu
 * (desktop) em qualquer card de apostila, sem alterar o tap normal.
 */
export function ApostilaCardActions({
  apostila: a,
  exerciseCount = 0,
  children,
}: ApostilaCardActionsProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const longPress = useLongPress(() => setOpen(true));

  const shareApostila = async () => {
    const url = `${window.location.origin}/apostila/${a.id}`;
    try {
      if (navigator.share) await navigator.share({ title: a.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado");
      }
    } catch { /* cancelado */ }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/apostila/${a.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  const actions: ActionItem[] = [
    {
      id: "open",
      label: "Ler apostila",
      description: a.category || "Geral",
      icon: BookOpen,
      variant: "primary",
      onSelect: () => navigate(`/apostila/${a.id}`),
    },
    ...(exerciseCount > 0
      ? [{
          id: "exercises",
          label: "Fazer exercícios",
          description: `${exerciseCount} questões disponíveis`,
          icon: PenLine,
          onSelect: () => navigate(`/exercises/${a.id}`),
        } as ActionItem]
      : []),
    {
      id: "preview",
      label: "Pré-visualizar",
      description: "Abrir em nova aba",
      icon: Eye,
      onSelect: () => window.open(`/apostila/${a.id}`, "_blank", "noopener"),
    },
    { id: "share", label: "Compartilhar", icon: Share2, onSelect: shareApostila },
    { id: "copy", label: "Copiar link", icon: Copy, onSelect: copyLink },
  ];

  // Intercepta onClick do filho para cancelar quando for long-press
  const originalOnClick = children.props.onClick;
  const enhanced = cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      if (longPress.wasLongPress()) { e.preventDefault(); e.stopPropagation(); return; }
      originalOnClick?.(e);
    },
    onTouchStart: longPress.onTouchStart,
    onTouchEnd: longPress.onTouchEnd,
    onTouchMove: longPress.onTouchMove,
    onTouchCancel: longPress.onTouchCancel,
    onContextMenu: longPress.onContextMenu,
  });

  return (
    <ActionSheet
      open={open}
      onOpenChange={setOpen}
      title={a.title}
      description={a.category || "Geral"}
      actions={actions}
      trigger={enhanced}
    />
  );
}
