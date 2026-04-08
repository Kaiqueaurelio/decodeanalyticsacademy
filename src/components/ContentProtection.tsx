import { useEffect } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { toast } from "sonner";

export function ContentProtection() {
  const { logActivity } = useActivityLog();

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        logActivity("screenshot");
        toast.error("⚠️ Captura de tela detectada! Esta ação foi registrada no sistema.", {
          duration: 5000,
        });
      }
      if (e.ctrlKey && (e.key === "s" || e.key === "u" || e.key === "p")) {
        e.preventDefault();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logActivity("screenshot");
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [logActivity]);

  return null;
}
