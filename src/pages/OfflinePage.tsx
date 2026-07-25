import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WifiOff, RefreshCw, BookOpen, Home } from "lucide-react";
import logoDecode from "@/assets/owl-icon.png";

export default function OfflinePage() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <img
          src={logoDecode}
          alt="Logo da coruja"
          className="mx-auto h-20 w-20 object-contain drop-shadow-[0_0_20px_rgba(0,240,255,0.45)]"
        />
        {/* Ícone animado */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center shadow-lg">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono-label uppercase tracking-wider">
          <span
            className={`h-2 w-2 rounded-full ${
              online ? "bg-success animate-pulse" : "bg-destructive"
            }`}
          />
          {online ? "Conexão restaurada" : "Sem conexão"}
        </div>

        {/* Texto */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {online ? "Você está de volta!" : "Modo offline"}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {online
              ? "Sua conexão foi restaurada. Você já pode continuar de onde parou."
              : "Sem internet no momento — mas calma, suas apostilas já visitadas continuam disponíveis para leitura."}
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-2">
          {online ? (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar agora
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}

          <Link
            to="/biblioteca"
            className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-card border border-border text-foreground hover:border-primary/40 transition-all"
          >
            <BookOpen className="h-4 w-4" />
            Abrir biblioteca offline
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Voltar ao dashboard
          </Link>
        </div>

        {/* Dica */}
        <p className="text-[11px] text-muted-foreground/70 pt-4 border-t border-border/50">
          As apostilas que você já abriu ficam salvas automaticamente para leitura sem internet.
        </p>
      </div>
    </div>
  );
}
