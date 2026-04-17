import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Indicador discreto que aparece quando o usuário fica offline.
 * Some sozinho 3s após voltar online.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const on = () => {
      setOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-[70] left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top,0px)+12px)] px-4 py-2 rounded-full shadow-lg border text-xs font-bold flex items-center gap-2 transition-all duration-300 animate-fade-in ${
        online
          ? "bg-success text-success-foreground border-success/30"
          : "bg-destructive text-destructive-foreground border-destructive/30"
      }`}
    >
      {online ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Conexão restaurada
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          Sem internet — modo offline
        </>
      )}
    </div>
  );
}
